import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { findConfigFile, loadConfig, requireConfig } from "../src/config.ts";
import { ConfigError } from "../src/errors.ts";
import { fixture } from "./helpers.ts";

const valid = JSON.stringify({ root: "..", projectsDir: "projects", bibliography: "../lit/refs.bib" });

test("finds the nearest config upward and resolves paths against its directory", () => {
  const dir = fixture({ "phd/thesis-toolkit.json": valid, "phd/projects/thesis/src/x.typ": "" });
  const file = findConfigFile(join(dir, "phd/projects/thesis/src"));
  assert.equal(file, join(dir, "phd/thesis-toolkit.json"));
  const config = loadConfig(file as string);
  assert.equal(config.root, dir);
  assert.equal(config.projectsDir, join(dir, "phd/projects"));
  assert.equal(config.bibliography, join(dir, "lit/refs.bib"));
});

test("rejects missing, mistyped, and unknown keys", () => {
  for (const content of ['{"root": ".."}', '{"root": 1, "projectsDir": "p", "bibliography": "b"}', `{${valid.slice(1, -1)}, "extra": "x"}`, "[]"]) {
    const dir = fixture({ "thesis-toolkit.json": content });
    assert.throws(() => loadConfig(join(dir, "thesis-toolkit.json")), ConfigError);
  }
});

test("requireConfig explains how to create a missing config", () => {
  const dir = fixture({ "empty/.keep": "" });
  assert.throws(() => requireConfig(join(dir, "empty")), /no thesis-toolkit.json found/);
});
