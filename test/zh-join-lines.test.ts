import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { packageRoot } from "../src/paths.ts";
import { fixture } from "./helpers.ts";

// [input, expected] pairs for zh-journal's zh-join-lines, checked by Typst itself.
const cases: [string, string][] = [
  ["第一行中文\n第二行中文", "第一行中文第二行中文"],
  ["中文，\nEnglish\nwords", "中文，English\nwords"],
  ["Last\n中文", "Last中文"],
  ["# 標題\n緊接標題", "# 標題\n緊接標題"],
  ["中文\n# 標題", "中文\n# 標題"],
  ["中文\n- 條列\n- 第二\n延續", "中文\n- 條列\n- 第二延續"],
  ["中文\n1. 項", "中文\n1. 項"],
  ["中文\n> 引", "中文\n> 引"],
  ["中文結尾  \n硬換行", "中文結尾  \n硬換行"],
  ["中文\\\n硬換行", "中文\\\n硬換行"],
  ["```\n程式\n碼\n```", "```\n程式\n碼\n```"],
  ["| 表 |\n| 格 |", "| 表 |\n| 格 |"],
  ["段一\n\n段二", "段一\n\n段二"],
  ["中文 \n中文", "中文中文"],
  ["結尾\n", "結尾\n"],
  ["", ""],
];

test("zh-join-lines joins wrapped CJK paragraph lines and keeps Markdown structure", () => {
  const lib = join(packageRoot, "templates", "zh-journal", "lib.typ");
  const checks = cases
    .map(([input, want]) => `#assert.eq(zh-join-lines(${JSON.stringify(input)}), ${JSON.stringify(want)}, message: ${JSON.stringify(JSON.stringify(input))})`)
    .join("\n");
  const dir = fixture({ "check.typ": `#import ${JSON.stringify(lib)}: zh-join-lines\n${checks}\nok\n` });
  const result = spawnSync("typst", ["compile", "--root", "/", join(dir, "check.typ"), join(dir, "check.pdf")], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
});
