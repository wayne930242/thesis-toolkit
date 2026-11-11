import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { escapeTypst, newProject } from "../src/commands/new-project.ts";
import { ProjectError } from "../src/errors.ts";
import { fontDir } from "../src/paths.ts";
import { runCli, typstEval } from "./cli-helpers.ts";
import { fixture } from "./helpers.ts";

function consumer(): string {
  return fixture({
    "thesis-toolkit.json": JSON.stringify({ root: ".", projectsDir: "projects", bibliography: "refs.bib" }),
    "refs.bib": "@book{fine1994essence,\n  title = {Essence and Modality},\n  author = {Fine, Kit},\n  year = {1994}\n}\n",
    "projects/.keep": "",
  });
}

/** Titles the audit found broken: each is ordinary prose, and each means something in Typst markup. */
const MARKUP_TITLES = [
  "Price is $5",
  "On *-algebras",
  "C# and F#",
  "Reply to @smith",
  "Tom & Jerry <draft>",
  "Use // wisely",
  "A $& B",
  'Say "hi" \\ bye',
];

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

test("a title that means something in Typst markup compiles and reaches the document unchanged", () => {
  const dir = consumer();
  MARKUP_TITLES.forEach((title, index) => {
    const slug = `essay-${index}`;
    assert.equal(newProject([slug, title], dir), 0);
    const main = readFileSync(join(dir, "projects", slug, "src/main/main.typ"), "utf8");

    const literal = main.match(/^#set document\(title: (".*")\)$/m)?.[1];
    assert.ok(literal, `${title}: no document title in\n${main}`);
    assert.equal(typstEval(literal), title, `${title}: the document title Typst reads`);
    assert.equal(
      main.split(escapeTypst(title)).length - 1,
      1,
      `${title}: the title must appear once, in that string, where markup cannot interpret it:\n${main}`,
    );

    const compiled = runCli(["compile", slug, "main"], dir);
    assert.equal(compiled.code, 0, `${title}: ${compiled.stderr}`);
    assert.ok(existsSync(join(dir, "projects", slug, "src/main/main.pdf")), `${title}: no main.pdf`);
  });
});

test("the title is not a numbered heading, so the first section is 1.", () => {
  const dir = consumer();
  newProject(["essay", "On Grounding"], dir);
  const numbers = typstEval(
    "query(heading).filter(it => it.numbering != none)" +
      ".map(it => numbering(it.numbering, ..counter(heading).at(it.location())))",
    ["--in", join(dir, "projects/essay/src/main/main.typ"), "--root", dir, "--input", "bib-path=/refs.bib", "--font-path", fontDir],
  );
  assert.deepEqual(numbers, ["1."]);
});

test("--template journal creates the Markdown journal skeleton with the title filled in", () => {
  for (const flag of [["--template", "journal"], ["--template=journal"]]) {
    const dir = consumer();
    assert.equal(newProject(["paper", 'On "Virtue"', ...flag], dir), 0);
    const project = join(dir, "projects/paper");
    for (const file of ["body.md", "abstract.md", "abstract-en.md", "src/main/main.typ"]) {
      assert.ok(existsSync(join(project, file)), `${flag.join(" ")}: ${file}`);
    }
    assert.ok(!existsSync(join(project, "chapters")), "journal has no chapters/");
    assert.ok(!existsSync(join(project, "README.md")));
    const main = readFileSync(join(project, "src/main/main.typ"), "utf8");
    assert.ok(main.includes('title: "On \\"Virtue\\""'));
    assert.ok(main.includes("@local/zh-journal:"));
    assert.ok(!main.includes("{Article Title}"));
  }
});

test("new-project refuses an unknown or missing --template", () => {
  const dir = consumer();
  assert.throws(() => newProject(["paper", "T", "--template", "poster"], dir), /unknown template: poster/);
  assert.throws(() => newProject(["paper", "T", "--template"], dir), /--template needs a name/);
  assert.ok(!existsSync(join(dir, "projects/paper")));
});
