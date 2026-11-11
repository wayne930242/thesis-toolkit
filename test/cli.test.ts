import assert from "node:assert/strict";
import { once } from "node:events";
import { chmodSync, existsSync, readFileSync } from "node:fs";
import { delimiter, join } from "node:path";
import { test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { compileUsage } from "../src/commands/compile.ts";
import { linkUsage } from "../src/commands/link.ts";
import { mcpUsage } from "../src/commands/mcp.ts";
import { newProjectUsage } from "../src/commands/new-project.ts";
import { ProjectError, ToolkitError, userMessage } from "../src/errors.ts";
import { typstUserPackageDir } from "../src/paths.ts";
import { run, usage } from "../src/run.ts";
import { runCli, sandboxEnv, spawnCli } from "./cli-helpers.ts";
import { fixture } from "./helpers.ts";

async function capture(argv: string[], cwd = process.cwd()): Promise<{ code: number; text: string }> {
  const lines: string[] = [];
  const code = await run(argv, cwd, (line) => lines.push(line));
  return { code, text: lines.join("\n") };
}

/** Run `body` with HOME and XDG_DATA_HOME pointed at a fresh directory, restoring them afterwards. */
async function withTempHome(body: (home: string) => Promise<void>): Promise<void> {
  const home = fixture({ ".keep": "" });
  const saved = { HOME: process.env.HOME, XDG_DATA_HOME: process.env.XDG_DATA_HOME };
  process.env.HOME = home;
  process.env.XDG_DATA_HOME = join(home, ".local", "share");
  try {
    await body(home);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

const commandUsages: Record<string, string> = {
  compile: compileUsage,
  "new-project": newProjectUsage,
  link: linkUsage,
  mcp: mcpUsage,
};

test("each command prints its own usage for -h, --help, and help <command>, exiting 0", async () => {
  for (const [name, expected] of Object.entries(commandUsages)) {
    for (const argv of [[name, "--help"], [name, "-h"], ["help", name], [name, "x.typ", "--help"]]) {
      assert.deepEqual(await capture(argv), { code: 0, text: expected }, argv.join(" "));
    }
  }
});

test("link --help writes no package link, while plain link does", async () => {
  await withTempHome(async () => {
    const dir = typstUserPackageDir();
    assert.equal((await capture(["link", "--help"])).code, 0);
    assert.equal(existsSync(dir), false, "link --help created the package directory");
    assert.equal((await capture(["link"])).code, 0);
    assert.equal(existsSync(join(dir, "local", "zh-journal")), true, "control: plain link must write");
  });
});

test("top-level help, version, no arguments, and unknown commands", async () => {
  assert.deepEqual(await capture(["--help"]), { code: 0, text: usage });
  assert.deepEqual(await capture(["help"]), { code: 0, text: usage });
  assert.deepEqual(await capture([]), { code: 1, text: usage });
  assert.match((await capture(["--version"])).text, /^\d+\.\d+\.\d+$/);
  for (const name of ["nope", "toString", "constructor"]) {
    await assert.rejects(capture([name]), ToolkitError);
    await assert.rejects(capture(["help", name]), ToolkitError);
  }
});

test("an unwritable cache directory is reported as one error line, not a stack trace", () => {
  const dir = fixture({ "a.typ": "hello" });
  const result = runCli(["compile", "a.typ"], dir, sandboxEnv({ XDG_CACHE_HOME: "/dev/null/x" }));
  assert.equal(result.code, 1);
  // Which call hits the bad path first (lstat, mkdir) depends on the Node version.
  assert.match(result.stderr, /^error: ENOTDIR: not a directory, \w+ '\/dev\/null\/x\/thesis-toolkit/);
  assert.doesNotMatch(result.stderr, /^\s+at /m, "a stack trace was printed");
});

test("only failures the user can act on become an error line; a bug keeps its stack", () => {
  assert.equal(userMessage(new ProjectError("file not found: x")), "file not found: x");
  const denied = Object.assign(new Error("EACCES: permission denied, open '/x'"), { code: "EACCES", errno: -13, syscall: "open" });
  assert.equal(userMessage(denied), "EACCES: permission denied, open '/x'");
  // Node's own argument errors carry a code but no errno: they are bugs in this program.
  const invalid = Object.assign(new TypeError("The \"path\" argument must be of type string"), { code: "ERR_INVALID_ARG_TYPE" });
  for (const bug of [new TypeError("x is not a function"), invalid, "thrown string", undefined]) {
    assert.equal(userMessage(bug), undefined);
  }
});

/** Stands in for typst: answers --version, otherwise records its pid and stays up like `typst watch`. */
const FAKE_TYPST = `#!/bin/sh
if [ "$1" = "--version" ]; then
  echo "typst 0.15.0"
  exit 0
fi
echo $$ > "$FAKE_TYPST_PID_FILE"
exec sleep 600
`;

function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

test("terminating compile --watch ends typst watch too, leaving no orphan", async () => {
  const dir = fixture({ "a.typ": "hello", "bin/typst": FAKE_TYPST });
  chmodSync(join(dir, "bin", "typst"), 0o755);
  const pidFile = join(dir, "typst.pid");
  const env = sandboxEnv({ PATH: `${join(dir, "bin")}${delimiter}${process.env.PATH}`, FAKE_TYPST_PID_FILE: pidFile });
  const cli = spawnCli(["compile", "a.typ", "--watch"], dir, env);
  let watcher: number | undefined;
  try {
    for (let waited = 0; watcher === undefined; waited += 20) {
      assert.equal(cli.exitCode, null, "the CLI exited before typst watch started");
      assert.ok(waited < 10_000, "typst watch did not start");
      await sleep(20);
      const recorded = existsSync(pidFile) ? readFileSync(pidFile, "utf8") : "";
      watcher = /^\d+\n$/.test(recorded) ? Number(recorded) : undefined;
    }
    cli.kill("SIGTERM");
    await once(cli, "exit");
    assert.equal(isRunning(watcher), false, `typst watch (pid ${watcher}) outlived the CLI`);
  } finally {
    cli.kill("SIGKILL");
    if (watcher !== undefined && isRunning(watcher)) {
      process.kill(watcher, "SIGKILL");
    }
  }
});
