import assert from "node:assert/strict";
import { readFileSync, readdirSync, readlinkSync, symlinkSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { packageRoot } from "../src/paths.ts";
import { essayPackage, journalPackage, linkPackage, pruneStaleLinks, thesisPackage, toolkitPackages } from "../src/typst.ts";
import { rootRelative } from "../src/commands/compile.ts";
import { fixture } from "./helpers.ts";

test("thesisPackage reads name and version from typst.toml", () => {
  const pkg = thesisPackage();
  assert.equal(pkg.name, "ntu-thesis");
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
});

test("essayPackage reads the anonymous-essay manifest, and toolkitPackages lists every package", () => {
  const pkg = essayPackage();
  assert.equal(pkg.name, "anonymous-essay");
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  assert.deepEqual(
    toolkitPackages().map((p) => p.name),
    ["ntu-thesis", "anonymous-essay", "zh-journal"],
  );
});

test("journalPackage reads the zh-journal manifest from its own directory", () => {
  const pkg = journalPackage();
  assert.equal(pkg.name, "zh-journal");
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  assert.equal(pkg.dir, join(packageRoot, "templates", "zh-journal"));
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

test("pruneStaleLinks removes only version links that point at the same package directory", () => {
  const root = fixture({ "elsewhere/typst.toml": "" });
  const pkg = thesisPackage();
  const versions = join(root, "local", pkg.name);
  linkPackage(root, { ...pkg, version: "0.0.1" });
  linkPackage(root, { ...pkg, version: "0.0.2" });
  const link = linkPackage(root, pkg);
  mkdirSync(join(versions, "9.9.9"));
  symlinkSync(join(root, "elsewhere"), join(versions, "8.8.8"), "dir");
  // Not a version, e.g. another run's link on its way into place: not ours to remove.
  symlinkSync(pkg.dir, join(versions, `${pkg.version}.123.tmp`), "dir");

  assert.deepEqual(pruneStaleLinks(root, pkg), ["0.0.1", "0.0.2"]);
  assert.deepEqual(readdirSync(versions).sort(), ["8.8.8", "9.9.9", pkg.version, `${pkg.version}.123.tmp`].sort());
  assert.equal(readlinkSync(link), pkg.dir);
  assert.deepEqual(pruneStaleLinks(root, pkg), []);
  assert.deepEqual(pruneStaleLinks(join(root, "missing"), pkg), []);
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
