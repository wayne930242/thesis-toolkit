import assert from "node:assert/strict";
import { isAbsolute, join } from "node:path";
import { test } from "node:test";
import { cacheDir, typstUserPackageDir } from "../src/paths.ts";

const HOME = "/home/someone";

test("an absolute XDG_CACHE_HOME or XDG_DATA_HOME is used", () => {
  assert.equal(cacheDir({ HOME, XDG_CACHE_HOME: "/var/cache/me" }, "linux"), "/var/cache/me/thesis-toolkit");
  assert.equal(cacheDir({ HOME, XDG_CACHE_HOME: "/var/cache/me" }, "darwin"), "/var/cache/me/thesis-toolkit");
  assert.equal(typstUserPackageDir({ HOME, XDG_DATA_HOME: "/var/data/me" }, "linux"), "/var/data/me/typst/packages");
});

test("an empty or relative XDG_CACHE_HOME or XDG_DATA_HOME is ignored, as Typst ignores it", () => {
  for (const value of ["", "relative/dir", "./here", "~/cache"]) {
    for (const platform of ["linux", "darwin"]) {
      const cache = cacheDir({ HOME, XDG_CACHE_HOME: value }, platform);
      assert.ok(isAbsolute(cache), `cacheDir with XDG_CACHE_HOME=${JSON.stringify(value)} on ${platform}: ${cache}`);
      assert.equal(cache, cacheDir({ HOME }, platform));
    }
    assert.equal(
      typstUserPackageDir({ HOME, XDG_DATA_HOME: value }, "linux"),
      join(HOME, ".local", "share", "typst", "packages"),
      `XDG_DATA_HOME=${JSON.stringify(value)}`,
    );
  }
});

test("macOS keeps Typst's Application Support directory whatever XDG_DATA_HOME says", () => {
  assert.equal(
    typstUserPackageDir({ HOME, XDG_DATA_HOME: "/var/data/me" }, "darwin"),
    join(HOME, "Library", "Application Support", "typst", "packages"),
  );
});
