import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { rootRelative } from "../src/commands/compile.ts";
import { runCli } from "./cli-helpers.ts";
import { fixture } from "./helpers.ts";

test("F018: rootRelative accepts directories whose name starts with .. and rejects real escapes", () => {
  assert.equal(rootRelative("/kb", "/kb/..drafts/p/references.generated.bib"), "/..drafts/p/references.generated.bib");
  assert.throws(() => rootRelative("/kb", "/kb/../elsewhere/x.bib"), /outside the Typst root/);
  assert.throws(() => rootRelative("/kb/sub", "/kb"), /outside the Typst root/);
});

function project(): string {
  return fixture({
    "thesis-toolkit.json": JSON.stringify({ root: ".", projectsDir: "projects", bibliography: "refs.bib" }),
    "refs.bib": "@book{sosa2007, title = {A Virtue Epistemology}, author = {Sosa, Ernest}, year = {2007}}\n",
    "projects/p/src/main/main.typ": '見 @sosa2007。\n#bibliography(sys.inputs.at("bib-path"))\n',
  });
}

test("compile --output writes the PDF there and leaves main.pdf alone", () => {
  for (const form of ["separate", "joined"] as const) {
    const dir = project();
    const out = join(dir, "preview", "nested", "out.pdf");
    const args = form === "separate" ? ["compile", "p", "main", "--output", out] : ["compile", "p", "main", `--output=${out}`];
    const result = runCli(args, dir);
    assert.equal(result.code, 0, result.stderr);
    assert.ok(statSync(out).size > 0, `${form}: PDF written`);
    assert.ok(!existsSync(join(dir, "projects/p/src/main/main.pdf")), `${form}: main.pdf untouched`);
  }
});

test("compile refuses a bad --output and unknown options", () => {
  const dir = project();
  for (const [args, message] of [
    [["compile", "p", "main", "--output"], /--output takes one PDF path/],
    [["compile", "p", "main", "--output", "x.png"], /must name a .pdf file/],
    [["compile", "p", "main", "--output", "a.pdf", "--output", "b.pdf"], /--output takes one PDF path/],
    [["compile", "p", "main", "--fast"], /unknown option: --fast/],
  ] as const) {
    const result = runCli([...args], dir);
    assert.equal(result.code, 1, args.join(" "));
    assert.match(result.stderr, message, args.join(" "));
  }
  assert.ok(!existsSync(join(dir, "projects/p/src/main/main.pdf")));
});
