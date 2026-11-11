import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { packageRoot } from "../src/paths.ts";
import { fixture } from "./helpers.ts";

const raw = (code: string): string => `<!--raw-typst${code}-->`;

// [input, expected] pairs for zh-journal's md-cites, checked by Typst itself.
const cases: [string, string][] = [
  ["甲 [@a]。", `甲 ${raw('#cite(label("a"))')}。`],
  ["[@a; @b, 23]", raw('#cite(label("a"))#cite(label("b"), supplement: "23")')],
  ["[@a, 頁 23] 乙", `${raw('#cite(label("a"), supplement: "頁 23")')} 乙`],
  ["[-@a]", raw('(#cite(label("a"), form: "year"))')],
  ["丁 @fine2012 說", `丁 ${raw('#cite(label("fine2012"), form: "prose")')} 說`],
  ["如@a.", `如${raw('#cite(label("a"), form: "prose")')}.`],
  ["所說，@a [45] 也", `所說，${raw('#cite(label("a"), supplement: "45", form: "prose")')} 也`],
  ["[23][@a]", "[23][@a]"],
  ["me@example.org", "me@example.org"],
  ["https://x.org/@user", "https://x.org/@user"],
  ["`@a` 與 [@王2020]", `\`@a\` 與 ${raw('#cite(label("王2020"))')}`],
  ["```\n@a\n```", "```\n@a\n```"],
  ["[^1] 與 [^1]: 註", "[^1] 與 [^1]: 註"],
  ["[@a](https://x)", "[@a](https://x)"],
  ["\\@a", "\\@a"],
  ["a\n@b", `a\n${raw('#cite(label("b"), form: "prose")')}`],
];

function typst(body: string): ReturnType<typeof spawnSync> {
  const lib = join(packageRoot, "templates", "zh-journal", "lib.typ");
  const dir = fixture({ "check.typ": `#import ${JSON.stringify(lib)}: md-cites\n${body}\nok\n` });
  return spawnSync("typst", ["compile", "--root", "/", join(dir, "check.typ"), join(dir, "check.pdf")], {
    encoding: "utf8",
  });
}

test("md-cites rewrites Pandoc citations and leaves code, emails, URLs, links, and footnotes", () => {
  const checks = cases
    .map(([input, want]) => `#assert.eq(md-cites(${JSON.stringify(input)}), ${JSON.stringify(want)}, message: ${JSON.stringify(JSON.stringify(input))})`)
    .join("\n");
  const result = typst(checks);
  assert.equal(result.status, 0, String(result.stderr));
});

test("md-cites stops with its own message on citation forms it cannot express", () => {
  const failures: [string, string][] = [
    ["[@a; -@b]", "must stand alone"],
    ["[@a, x-->y]", "must not contain `-->`"],
  ];
  for (const [input, message] of failures) {
    const result = typst(`#md-cites(${JSON.stringify(input)})`);
    assert.notEqual(result.status, 0, input);
    assert.match(String(result.stderr), new RegExp(message.replace(/[.*+?^${}()|[\]\\`]/g, "\\$&")), input);
  }
});
