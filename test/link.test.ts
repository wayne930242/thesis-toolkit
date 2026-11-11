import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readlinkSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { cacheDir, typstUserPackageDir } from "../src/paths.ts";
import { linkPackage, thesisPackage } from "../src/typst.ts";
import { runCli, sandboxEnv } from "./cli-helpers.ts";
import { fixture } from "./helpers.ts";

/** The link an earlier run made when the package's typst.toml still said `version`. */
function linkAtOldVersion(root: string, version: string): string {
  return linkPackage(root, { ...thesisPackage(), version });
}

test("link removes its links at older versions of a package, says so, and leaves the user's own entries", () => {
  const env = sandboxEnv();
  const pkg = thesisPackage();
  const userDir = typstUserPackageDir(env);
  const versions = join(userDir, "local", pkg.name);
  const elsewhere = fixture({ "typst.toml": "" });
  linkAtOldVersion(userDir, "0.0.1");
  mkdirSync(join(versions, "9.9.9"));
  symlinkSync(elsewhere, join(versions, "8.8.8"), "dir");

  const result = runCli(["link"], elsewhere, env);
  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(readdirSync(versions).sort(), ["8.8.8", "9.9.9", pkg.version].sort());
  assert.equal(readlinkSync(join(versions, "8.8.8")), elsewhere);
  assert.match(
    result.stdout,
    new RegExp(`removed stale link @local/${pkg.name}:0\\.0\\.1; update imports to @local/${pkg.name}:${pkg.version.replaceAll(".", "\\.")}`),
  );

  const again = runCli(["link"], elsewhere, env);
  assert.doesNotMatch(again.stdout, /stale/);
});

test("compile does not resolve an import of a package version the toolkit no longer ships", () => {
  const env = sandboxEnv();
  const pkg = thesisPackage();
  const stale = linkAtOldVersion(join(cacheDir(env), "typst-packages"), "0.0.1");
  const dir = fixture({ "a.typ": `#import "@local/${pkg.name}:0.0.1": setup\n` });

  const result = runCli(["compile", "a.typ"], dir, env);
  assert.equal(result.code, 1);
  assert.match(result.stderr, new RegExp(`package not found \\(searched for @local/${pkg.name}:0\\.0\\.1\\)`));
  assert.equal(existsSync(stale), false, "the stale link is still in the generated package tree");
});
