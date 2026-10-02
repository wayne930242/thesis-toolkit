import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { escapeTypst, newProject } from "../src/commands/new-project.ts";
import { ProjectError } from "../src/errors.ts";
import { fixture } from "./helpers.ts";

function consumer(): string {
  return fixture({
    "thesis-toolkit.json": JSON.stringify({ root: ".", projectsDir: "projects", bibliography: "refs.bib" }),
    "projects/.keep": "",
  });
}

test("creates a project from the article skeleton with an escaped title", () => {
  const dir = consumer();
  assert.equal(newProject(["essay", 'On "Grounding"'], dir), 0);
  const main = readFileSync(join(dir, "projects/essay/src/main/main.typ"), "utf8");
  assert.ok(main.includes('title: "On \\"Grounding\\""'));
  assert.ok(!main.includes("{Article Title}"));
  assert.ok(!existsSync(join(dir, "projects/essay/README.md")));
});

test("refuses bad slugs and existing projects", () => {
  const dir = consumer();
  assert.throws(() => newProject(["Bad_Slug", "T"], dir), ProjectError);
  newProject(["essay", "T"], dir);
  assert.throws(() => newProject(["essay", "T"], dir), /already exists/);
});

test("escapeTypst escapes backslashes and quotes", () => {
  assert.equal(escapeTypst('a\\b"c'), 'a\\\\b\\"c');
});
