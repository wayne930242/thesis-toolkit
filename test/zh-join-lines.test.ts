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
  ["[^1]: 註一內容\n[^2]: 註二內容", "[^1]: 註一內容\n[^2]: 註二內容"],
  ["正文甲[^1]。\n[^1]: 註一內容", "正文甲[^1]。\n[^1]: 註一內容"],
  ["[^1]: 註一\n續寫", "[^1]: 註一續寫"],
  ["甲 | 乙\n---|---\n一 | 二", "甲 | 乙\n---|---\n一 | 二"],
  ["標題一\n===", "標題一\n==="],
  ["標題二\n---", "標題二\n---"],
  ["段落\n\n    程式\n    碼", "段落\n\n    程式\n    碼"],
  ["~~~~\n中\n```\n文\n~~~~\n甲\n乙", "~~~~\n中\n```\n文\n~~~~\n甲乙"],
  ["- 項目\n\n    第二段\n    續行", "- 項目\n\n    第二段續行"],
  ["- 甲項\n    - 乙巢狀\n\t- 丙巢狀", "- 甲項\n    - 乙巢狀\n\t- 丙巢狀"],
  ["1. 一項\n    1. 二巢狀", "1. 一項\n    1. 二巢狀"],
  ["<!-- 備註 -->\n中文段落", "<!-- 備註 -->\n中文段落"],
  ["<!-- 多行\n備註 -->\n中文段落", "<!-- 多行\n備註 -->\n中文段落"],
  ["---\n分隔線後", "---\n分隔線後"],
  ["***\n星號線後", "***\n星號線後"],
  ["標題乙\n===\n其後段落", "標題乙\n===\n其後段落"],
  ["最早見於 @a\n的著作", "最早見於 @a\n的著作"],
  ["<!-- 多行\r\n註解 -->\r\n註解後", "<!-- 多行\n註解 -->\n註解後"],
  ["硬換行  \r\n下一行", "硬換行  \n下一行"],
  ["[^1]: 一段。\n\n    第二段\n    續行", "[^1]: 一段。\n\n    第二段續行"],
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
