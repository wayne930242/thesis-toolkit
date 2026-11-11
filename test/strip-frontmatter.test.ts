import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { packageRoot } from "../src/paths.ts";
import { fixture } from "./helpers.ts";

// [input, expected] pairs for zh-journal's strip-frontmatter, checked by Typst itself.
const cases: [string, string][] = [
  ["---\ncreated: 2026-11-11\nupdated: 改了\n---\n\n# 前言\n", "\n# 前言\n"],
  ["---\r\ntitle: x\r\n...\r\n正文", "正文"],
  ["---\n---\n正文", "正文"],
  ["# 前言\n\n---\n\n正文", "# 前言\n\n---\n\n正文"],
  ["正文\n---\na: b\n---\n", "正文\n---\na: b\n---\n"],
  ["---\na: b\n---", ""],
  ["", ""],
  ["---\n\n第一段。\n\n---\n\n第二段。", "---\n\n第一段。\n\n---\n\n第二段。"],
  ["\uFEFF---\ntitle: x\n---\n正文", "正文"],
];

test("strip-frontmatter drops a leading YAML block and nothing else", () => {
  const lib = join(packageRoot, "templates", "zh-journal", "lib.typ");
  const checks = cases
    .map(([input, want]) => `#assert.eq(strip-frontmatter(${JSON.stringify(input)}), ${JSON.stringify(want)}, message: ${JSON.stringify(JSON.stringify(input))})`)
    .join("\n");
  const dir = fixture({ "check.typ": `#import ${JSON.stringify(lib)}: strip-frontmatter\n${checks}\nok\n` });
  const result = spawnSync("typst", ["compile", "--root", "/", join(dir, "check.typ"), join(dir, "check.pdf")], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
});
