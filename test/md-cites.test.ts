import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { packageRoot } from "../src/paths.ts";
import { fixture } from "./helpers.ts";

const raw = (code: string): string => `<!--raw-typst${code}-->`;

// [input, expected] pairs for zh-journal's md-cites, checked by Typst itself.
const cite = (key: string, opts = ""): string => `#cite(label("${key}")${opts});`;
const ZWSP = "\u200B";

const cases: [string, string][] = [
  ["甲 [@a]。", `甲 ${raw(cite("a"))}。`],
  ["甲 [@a; @b, 23]", `甲 ${raw(cite("a") + cite("b", ', supplement: "23"'))}`],
  ["甲 [@a, 頁 23] 乙", `甲 ${raw(cite("a", ', supplement: "頁 23"'))} 乙`],
  ["甲 [@a,]", `甲 ${raw(cite("a"))}`],
  ["甲 [-@a]", `甲 ${raw(`(${cite("a", ', form: "year"')})`)}`],
  ["丁 @fine2012 說", `丁 ${raw(cite("fine2012", ', form: "prose"'))} 說`],
  ["如@a.", `如${raw(cite("a", ', form: "prose"'))}.`],
  ["所說，@a [45] 也", `所說，${raw(cite("a", ', supplement: "45", form: "prose"'))} 也`],
  ["甲 @a(2007) 乙", `甲 ${raw(cite("a", ', form: "prose"'))}(2007) 乙`],
  ["甲 @a [連結](http://x.org) 乙", `甲 ${raw(cite("a", ', form: "prose"'))} [連結](http://x.org) 乙`],
  ["[23][@a]", "[23][@a]"],
  ["me@example.org", "me@example.org"],
  ["[mail me@x.org]", "[mail me@x.org]"],
  ["https://x.org/@user", "https://x.org/@user"],
  ["`@a` 與 [@王2020]", `\`@a\` 與 ${raw(cite("王2020"))}`],
  ["``code ` @a`` 後 @b 說", `\`\`code \` @a\`\` 後 ${raw(cite("b", ', form: "prose"'))} 說`],
  ["孤 ` 號 @b 說", `孤 \` 號 ${raw(cite("b", ', form: "prose"'))} 說`],
  ["```\n@a\n```", "```\n@a\n```"],
  ["段落\n\n    code @a", "段落\n\n    code @a"],
  ["[^1] 與 [^1]: 註", "[^1] 與 [^1]: 註"],
  ["[@a](https://x)", "[@a](https://x)"],
  ["[@a][ref]", "[@a][ref]"],
  ["[@a]: https://x", "[@a]: https://x"],
  ["\\@a", "\\@a"],
  ["<!-- 先拿掉 [@a] 備註 @b -->後 @c 說", `<!-- 先拿掉 [@a] 備註 @b -->後 ${raw(cite("c", ', form: "prose"'))} 說`],
  ["<!-- 跨行\n@b 還在註解 -->\n@c 說", `<!-- 跨行\n@b 還在註解 -->\n${ZWSP}${raw(cite("c", ', form: "prose"'))} 說`],
  ["@a 指出", `${ZWSP}${raw(cite("a", ', form: "prose"'))} 指出`],
  ["[@a] 主張", `${ZWSP}${raw(cite("a"))} 主張`],
  ["- @a 指出", `- ${ZWSP}${raw(cite("a", ', form: "prose"'))} 指出`],
  ["> [@a] 主張", `> ${ZWSP}${raw(cite("a"))} 主張`],
  ["a\n@b", `a\n${ZWSP}${raw(cite("b", ', form: "prose"'))}`],
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
    ["[see @a, p. 3]", "write text outside the citation brackets"],
  ];
  for (const [input, message] of failures) {
    const result = typst(`#md-cites(${JSON.stringify(input)})`);
    assert.notEqual(result.status, 0, input);
    assert.match(String(result.stderr), new RegExp(message.replace(/[.*+?^${}()|[\]\\`]/g, "\\$&")), input);
  }
});
