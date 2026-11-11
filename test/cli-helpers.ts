import assert from "node:assert/strict";
import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { join } from "node:path";
import { packageRoot } from "../src/paths.ts";
import { fixture } from "./helpers.ts";

const CLI = join(packageRoot, "src", "cli.ts");

/**
 * An environment whose HOME, cache, and Typst user package directory are fresh temp directories,
 * so a CLI run in a test never reads or writes the developer's own. RSH_* credentials are dropped.
 */
export function sandboxEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const home = fixture({ ".keep": "" });
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("RSH_")) {
      env[key] = value;
    }
  }
  return {
    ...env,
    HOME: home,
    XDG_CACHE_HOME: join(home, ".cache"),
    XDG_DATA_HOME: join(home, ".local", "share"),
    ...extra,
  };
}

export interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/** Run the CLI as its own process, the way a user does. */
export function runCli(args: string[], cwd: string, env: NodeJS.ProcessEnv = sandboxEnv()): CliResult {
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd, env, encoding: "utf8" });
  if (result.error) {
    throw result.error;
  }
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** Start the CLI without waiting for it, for runs a test has to signal. */
export function spawnCli(args: string[], cwd: string, env: NodeJS.ProcessEnv = sandboxEnv()): ChildProcess {
  return spawn(process.execPath, [CLI, ...args], { cwd, env, stdio: "ignore" });
}

/** Evaluate Typst code with the real `typst` and return its JSON value. */
export function typstEval(expression: string, args: string[] = []): unknown {
  const result = spawnSync("typst", ["eval", expression, ...args], { encoding: "utf8", env: sandboxEnv() });
  if (result.error) {
    throw result.error;
  }
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
