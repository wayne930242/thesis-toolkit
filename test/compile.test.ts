import assert from "node:assert/strict";
import { test } from "node:test";
import { rootRelative } from "../src/commands/compile.ts";

test("F018: rootRelative accepts directories whose name starts with .. and rejects real escapes", () => {
  assert.equal(rootRelative("/kb", "/kb/..drafts/p/references.generated.bib"), "/..drafts/p/references.generated.bib");
  assert.throws(() => rootRelative("/kb", "/kb/../elsewhere/x.bib"), /outside the Typst root/);
  assert.throws(() => rootRelative("/kb/sub", "/kb"), /outside the Typst root/);
});
