import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readlinkSync, symlinkSync, writeFileSync } from "node:fs";
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

/** Install a minimal package the way a user does by hand: a real directory in Typst's package directory. */
function installUserPackage(userDir: string, namespace: string, name: string, version: string, lib: string): void {
  const dir = join(userDir, namespace, name, version);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "typst.toml"), `[package]\nname = "${name}"\nversion = "${version}"\nentrypoint = "lib.typ"\n`);
  writeFileSync(join(dir, "lib.typ"), lib);
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

test("compile resolves the packages in Typst's user package directory, in any namespace", () => {
  const env = sandboxEnv();
  const userDir = typstUserPackageDir(env);
  installUserPackage(userDir, "local", "mine", "1.0.0", '#let hello = "from mine"\n');
  installUserPackage(userDir, "lab", "kit", "0.2.0", '#let tool = "from kit"\n');
  const dir = fixture({
    "a.typ": '#import "@local/mine:1.0.0": hello\n#import "@lab/kit:0.2.0": tool\n#hello #tool\n',
  });

  const result = runCli(["compile", "a.typ"], dir, env);
  assert.equal(result.code, 0, result.stderr);
  assert.ok(existsSync(join(dir, "a.pdf")));
});

test("the toolkit's package wins over a user package of the same name and version", () => {
  const env = sandboxEnv();
  const pkg = thesisPackage();
  installUserPackage(typstUserPackageDir(env), "local", pkg.name, pkg.version, '#let only-in-the-user-copy = 1\n');
  const dir = fixture({ "a.typ": `#import "@local/${pkg.name}:${pkg.version}": setup\n` });

  const result = runCli(["compile", "a.typ"], dir, env);
  assert.equal(result.code, 0, result.stderr);
});

test("a link that `link` left at an old version in the user directory is not carried into compile", () => {
  const env = sandboxEnv();
  const pkg = thesisPackage();
  linkAtOldVersion(typstUserPackageDir(env), "0.0.1");
  const dir = fixture({ "a.typ": `#import "@local/${pkg.name}:0.0.1": setup\n` });

  const result = runCli(["compile", "a.typ"], dir, env);
  assert.equal(result.code, 1);
  assert.match(result.stderr, new RegExp(`package not found \\(searched for @local/${pkg.name}:0\\.0\\.1\\)`));
});
