import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { citedKeys, parseEntries, writeSubset } from "../src/bibliography.ts";
import { fixture } from "./helpers.ts";

test("citedKeys reads @key and cite(<key>) but skips comments, strings, and plain labels", () => {
  const source = [
    "As @fine1994essence argues, #cite(<rosen2010metaphysical>, form: \"prose\").",
    "// @commented2000out",
    "/* @blocked2001out */",
    "#link(\"mailto:someone@example.com\")",
    "= Intro <introduction>",
  ].join("\n");
  assert.deepEqual([...citedKeys(source)].sort(), ["fine1994essence", "rosen2010metaphysical"]);
});

test("parseEntries keeps each entry verbatim", () => {
  const bib = "@book{a2000x,\n  title = {A},\n  note = {{nested}}\n}\n\n@article{b2001y,\n  title = {B}\n}\n";
  const entries = parseEntries(bib);
  assert.equal(entries.get("a2000x"), "@book{a2000x,\n  title = {A},\n  note = {{nested}}\n}");
  assert.equal(entries.size, 2);
});

test("writeSubset writes sorted cited entries and reports missing keys", () => {
  const dir = fixture({
    "refs.bib": "@book{b2001y,\n  title = {B}\n}\n\n@book{a2000x,\n  title = {A}\n}\n\n@book{unused,\n  title = {U}\n}\n",
    "src/main.typ": "@b2001y and @a2000x and @ghost1999",
    "src/chapters/one.typ": "#cite(<a2000x>)",
  });
  const output = join(dir, "out/subset.bib");
  const result = writeSubset(join(dir, "src"), join(dir, "refs.bib"), output);
  assert.deepEqual(result, { kept: 2, total: 3, missing: ["ghost1999"] });
  const written = readFileSync(output, "utf8");
  assert.ok(written.indexOf("a2000x") < written.indexOf("b2001y"));
  assert.ok(!written.includes("unused"));
});
