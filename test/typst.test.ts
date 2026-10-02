import assert from "node:assert/strict";
import { readFileSync, readlinkSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { packageRoot } from "../src/paths.ts";
import { linkPackage, thesisPackage } from "../src/typst.ts";
import { rootRelative } from "../src/commands/compile.ts";
import { fixture } from "./helpers.ts";

test("thesisPackage reads name and version from typst.toml", () => {
  const pkg = thesisPackage();
  assert.equal(pkg.name, "ntu-thesis");
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
});

test("linkPackage creates, keeps, and repoints its own symlink but never replaces a directory", () => {
  const root = fixture({ ".keep": "" });
  const pkg = { ...thesisPackage() };
  const link = linkPackage(root, pkg);
  assert.equal(readlinkSync(link), pkg.dir);
  assert.equal(linkPackage(root, pkg), link);
  const moved = { ...pkg, dir: join(root, ".keep") };
  assert.equal(readlinkSync(linkPackage(root, moved)), moved.dir);

  const other = { ...pkg, version: "9.9.9" };
  mkdirSync(join(root, "local", pkg.name, "9.9.9"), { recursive: true });
  writeFileSync(join(root, "local", pkg.name, "9.9.9", "user.typ"), "");
  assert.throws(() => linkPackage(root, other), /not a symlink/);
});

test("rootRelative produces root-anchored paths and rejects paths outside the root", () => {
  assert.equal(rootRelative("/kb", "/kb/phd/projects/t/references.generated.bib"), "/phd/projects/t/references.generated.bib");
  assert.throws(() => rootRelative("/kb", "/elsewhere/x.bib"), /outside the Typst root/);
});

test("the article template and package manifest ship in the npm files list", () => {
  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as { files: string[] };
  assert.ok(manifest.files.includes("templates"));
  assert.ok(manifest.files.includes("fonts"));
});
