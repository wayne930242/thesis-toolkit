import assert from "node:assert/strict";
import { readFileSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  explicitCitations,
  parseBib,
  parseEntries,
  referencedTokens,
  sourceFiles,
  writeSubset,
} from "../src/bibliography.ts";
import { fixture } from "./helpers.ts";

const BIB = [
  "@book{sosa2007,\n  title = {A Virtue Epistemology}\n}",
  "@incollection{fine2012,\n  title = {Guide to Ground}\n}",
  "@article{rosen2010,\n  title = {Metaphysical Dependence}\n}",
].join("\n\n");

/** Keys `writeSubset` keeps for `source` placed in `main.typ`, against `bib`. */
function kept(source: string, bib = BIB, file = "src/main/main.typ"): string[] {
  const dir = fixture({ "refs.bib": bib, [file]: source });
  const output = join(dir, "out.bib");
  writeSubset(dir, join(dir, "refs.bib"), output);
  return [...parseBib(readFileSync(output, "utf8")).entries.keys()].sort();
}

test("F002: a citation followed by sentence punctuation is kept", () => {
  assert.deepEqual(kept("see @sosa2007. Also @fine2012: a guide."), ["fine2012", "sosa2007"]);
});

test("F002: a URL earlier on the line does not hide the citation", () => {
  assert.deepEqual(kept('#link("https://plato.stanford.edu/entries/grounding/")[SEP] and @fine2012'), ["fine2012"]);
  assert.deepEqual(kept("https://plato.stanford.edu/ and @fine2012"), ["fine2012"]);
});

test("F002: prose double quotes and a stray quote do not hide citations", () => {
  assert.deepEqual(kept('He wrote: "knowledge is apt belief @sosa2007[23] and nothing more".'), ["sosa2007"]);
  assert.deepEqual(kept('A 5" nail. Then the "apt" view @sosa2007 and the "ground" view.'), ["sosa2007"]);
});

test("F008: function-form, label(), and non-ASCII or digit-first keys are kept", () => {
  assert.deepEqual(kept("#ref(<rosen2010>, supplement: [p. 3])"), ["rosen2010"]);
  assert.deepEqual(kept('#let c = cite.with(form: "prose")\n#c(<sosa2007>)'), ["sosa2007"]);
  assert.deepEqual(kept('#cite(label("fine2012"))'), ["fine2012"]);
  const bib = "@book{王2020,\n  title = {甲}\n}\n\n@book{2007sosa,\n  title = {B}\n}";
  assert.deepEqual(kept("@王2020 與 @2007sosa。", bib), ["2007sosa", "王2020"]);
});

test("F001: citations anywhere in the project count, including chapters/ beside src/ and Markdown", () => {
  const dir = fixture({
    "refs.bib": BIB,
    "src/main/main.typ": '#include "../../chapters/section1.typ"',
    "chapters/section1.typ": "Knowledge is apt belief @sosa2007 here.",
    "src/main/body.md": "Grounding [@fine2012] and [23][@rosen2010].",
  });
  writeSubset(dir, join(dir, "refs.bib"), join(dir, "out.bib"));
  assert.deepEqual([...parseEntries(readFileSync(join(dir, "out.bib"), "utf8")).keys()].sort(), [
    "fine2012",
    "rosen2010",
    "sosa2007",
  ]);
});

test("F003: @string and @preamble are copied, @comment is skipped", () => {
  const bib = '@string{oup = "Oxford University Press"}\n@preamble{"\\newcommand{\\x}{x}"}\n@comment{@book{ghost,}}\n\n@book{sosa2007,\n  publisher = oup\n}\n';
  const dir = fixture({ "refs.bib": bib, "main.typ": "@sosa2007" });
  const result = writeSubset(dir, join(dir, "refs.bib"), join(dir, "out.bib"));
  const written = readFileSync(join(dir, "out.bib"), "utf8");
  assert.deepEqual({ kept: result.kept, total: result.total }, { kept: 1, total: 1 });
  assert.ok(written.includes('@string{oup = "Oxford University Press"}'));
  assert.ok(written.includes("@preamble{"));
  assert.ok(!written.includes("ghost"));
});

test("F003: one-line entries, indented closing braces, and a field brace at line start parse", () => {
  const bib = [
    "@book{sosa2007, title = {A}, year = {2007}}",
    "@book{fine2012,\n  title = {B}\n  }",
    "@article{rosen2010,\n  abstract = {\nLine one.\n},\n  title = {C}\n}",
    "@book(paren2000, title = {Has (parens)}, note = \"a ) b\")",
  ].join("\n");
  const entries = parseEntries(bib);
  assert.deepEqual([...entries.keys()], ["sosa2007", "fine2012", "rosen2010", "paren2000"]);
  assert.equal(entries.get("rosen2010"), "@article{rosen2010,\n  abstract = {\nLine one.\n},\n  title = {C}\n}");
  assert.equal(entries.get("paren2000"), '@book(paren2000, title = {Has (parens)}, note = "a ) b")');
});

test("F003: an unterminated entry is a ProjectError naming its line", () => {
  assert.throws(() => parseBib("@book{a,\n  title = {x}\n\n@book{b,\n  title = {y}\n"), /unterminated entry at line 1/);
});

test("F007: crossref and xdata parents come along, transitively, in file order", () => {
  const bib = [
    "@incollection{fine2012,\n  crossref = {correia2012}\n}",
    "@book{correia2012,\n  xdata = {cup, series}\n}",
    "@xdata{cup,\n  publisher = {CUP}\n}",
    "@xdata{series,\n  series = {S}\n}",
    "@book{unused,\n  title = {U}\n}",
  ].join("\n\n");
  const dir = fixture({ "refs.bib": bib, "main.typ": "@fine2012" });
  writeSubset(dir, join(dir, "refs.bib"), join(dir, "out.bib"));
  assert.deepEqual([...parseEntries(readFileSync(join(dir, "out.bib"), "utf8")).keys()], [
    "fine2012",
    "correia2012",
    "cup",
    "series",
  ]);
});

test("F015: only explicit cite() keys are reported missing; refs, emails, and raw text are not", () => {
  const dir = fixture({
    "refs.bib": BIB,
    "main.typ": "@intro @fig:one `@raw2020key` me\\@example.org. #cite(<ghost1999>) #cite(label(\"ghost2000\"))",
  });
  const result = writeSubset(dir, join(dir, "refs.bib"), join(dir, "out.bib"));
  assert.deepEqual(result.missing, ["ghost1999", "ghost2000"]);
  assert.deepEqual([...explicitCitations('#cite(<a>) cite( label( "b" ) )')], ["a", "b"]);
});

test("F019: a cited duplicate key fails; an uncited one is reported", () => {
  const bib = `${BIB}\n\n@book{sosa2007,\n  title = {Second Definition}\n}`;
  const cited = fixture({ "refs.bib": bib, "main.typ": "@sosa2007" });
  assert.throws(() => writeSubset(cited, join(cited, "refs.bib"), join(cited, "out.bib")), /more than once: sosa2007/);
  const uncited = fixture({ "refs.bib": bib, "main.typ": "@fine2012" });
  assert.deepEqual(writeSubset(uncited, join(uncited, "refs.bib"), join(uncited, "out.bib")).duplicates, ["sosa2007"]);
});

test("F011: dot-entries, node_modules, and dangling symlinks are skipped", () => {
  const dir = fixture({
    "src/main.typ": "",
    "src/notes.md": "",
    "src/.hidden.typ": "",
    ".git/x.typ": "",
    "node_modules/pkg/y.typ": "",
    "src/image.png": "",
  });
  symlinkSync(join(dir, "missing.typ"), join(dir, "src", "dangling.typ"));
  symlinkSync(join(dir, "src", "main.typ"), join(dir, "src", "linked.typ"));
  assert.deepEqual(sourceFiles(dir).map((file) => file.slice(dir.length + 1)), [
    "src/linked.typ",
    "src/main.typ",
    "src/notes.md",
  ]);
});

test("F025: the generated header names the bibliography relative to the output", () => {
  const dir = fixture({ "lit/refs.bib": BIB, "projects/p/main.typ": "@sosa2007" });
  writeSubset(join(dir, "projects/p"), join(dir, "lit/refs.bib"), join(dir, "projects/p/out.bib"));
  const header = readFileSync(join(dir, "projects/p/out.bib"), "utf8").split("\n")[0];
  assert.equal(header, "% Generated by thesis-toolkit from ../../lit/refs.bib");
});

test("referencedTokens trims trailing sentence punctuation but keeps inner dots and colons", () => {
  const tokens = referencedTokens("@a.b. @c:d: <e> label(\"f\")");
  for (const token of ["a.b", "c:d", "e", "f"]) {
    assert.ok(tokens.has(token), token);
  }
});
