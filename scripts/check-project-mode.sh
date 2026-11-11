#!/usr/bin/env bash
# Run the documented project flow end to end through the built CLI: new-project, cite in the
# skeleton's chapter file, compile. The citations and the bibliography use forms that once broke
# the subset (sentence punctuation, a URL on the line, prose quotes, @string, one-line entries,
# crossref), and the projects directory is named `..drafts`. Needs `npm run build` and pdftotext.
# Every CLI run gets its own cache and HOME, so nothing touches the user's Typst packages.
set -euo pipefail

command -v pdftotext >/dev/null || { echo "pdftotext not found; install poppler-utils" >&2; exit 1; }
repo="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
tt() { (cd "$work/kb" && HOME="$work/home" XDG_CACHE_HOME="$work/cache" node "$repo/dist/cli.js" "$@"); }

mkdir -p "$work/kb/..drafts" "$work/kb/lit" "$work/home"
printf '%s\n' '{ "root": ".", "projectsDir": "..drafts", "bibliography": "lit/refs.bib" }' >"$work/kb/thesis-toolkit.json"
cat >"$work/kb/lit/refs.bib" <<'BIB'
@string{oup = "Oxford University Press"}

@book{sosa2007, author = {Sosa, Ernest}, title = {A Virtue Epistemology}, publisher = oup, year = {2007}}

@incollection{fine2012,
  author = {Fine, Kit},
  title = {Guide to Ground},
  pages = {37--80},
  crossref = {correia2012}
  }

@book{correia2012,
  editor = {Correia, Fabrice and Schnieder, Benjamin},
  title = {Metaphysical Grounding},
  publisher = {Cambridge University Press},
  year = {2012},
  abstract = {
Spans lines.
},
}

@article{rosen2010, author = {Rosen, Gideon}, title = {Metaphysical Dependence}, journaltitle = {Modality}, year = {2010}}

@book{unused1999, author = {Nobody}, title = {Uncited}, year = {1999}}
BIB

tt new-project essay "On Grounding" >/dev/null
cat >"$work/kb/..drafts/essay/chapters/section1.typ" <<'TYP'
= Section

Knowledge is apt belief @sosa2007. See #link("https://plato.stanford.edu/entries/grounding/")[SEP] and @fine2012: a guide.
He wrote: "dependence is not causation @rosen2010[3] at all".
TYP

log="$(tt compile essay main 2>&1)" || { echo "$log" >&2; echo "FAIL compile" >&2; exit 1; }
generated="$work/kb/..drafts/essay/references.generated.bib"
text="$(pdftotext "$work/kb/..drafts/essay/src/main/main.pdf" -)"

fail=0
check() {
    local what="$1"; shift
    if "$@"; then echo "ok   $what"; else echo "FAIL $what" >&2; fail=1; fi
}
has() { grep -qF -- "$2" <<<"$1"; }
lacks() { ! grep -qF -- "$2" <<<"$1"; }
quiet() { "$@" >/dev/null 2>&1; }

check "subset keeps 4 of 5 entries (crossref parent included)" has "$log" "bibliography: 4/5 entries"
check "no missing-key warning" lacks "$log" "warning"
gen="$(cat "$generated")"
for key in sosa2007 fine2012 correia2012 rosen2010; do
    check "generated bib holds $key" has "$gen" "{$key,"
done
check "generated bib keeps @string" has "$gen" "@string{oup"
check "generated bib drops the uncited entry" lacks "$gen" "unused1999"
check "generated bib names its source relatively" has "$gen" "from ../../lit/refs.bib"
check "PDF cites Sosa" has "$text" "Sosa"
check "PDF lists the crossref parent's book" has "$text" "Metaphysical Grounding"
check "PDF resolves the @string publisher" has "$text" "Oxford University Press"

# The Markdown journal skeleton: Pandoc citations in body.md reach the subset and the PDF, and a
# line wrapped inside a Chinese sentence puts no space between the characters.
tt new-project paper "論德性與知識" --template journal >/dev/null
paper="$work/kb/..drafts/paper"
check "fresh journal skeleton compiles" quiet tt compile paper main
# An editor's front matter (MyGitNotes writes created/updated on save) must not be printed.
{ printf -- '---\ncreated: 2026-11-11\nupdated: 前置資料\n---\n'; cat "$paper/body.md"; } >"$paper/body.tmp" && mv "$paper/body.tmp" "$paper/body.md"
cat >>"$paper/body.md" <<'MD'

# 引註

多筆 [@fine2012; @sosa2007, 23]。只印年 [-@rosen2010]。如 @sosa2007 所說，
德性即能力。

@fine2012 開頭的段落有**粗體**與腳註[^a]，
還有 @rosen2010(2010) 與 @sosa2007 [連結](https://example.org)。
[^a]: 第一個腳註。
[^b]: 第二個腳註。

第二個註在這裡[^b]。<!-- 草稿備註 [@sosa2007] 不該出現 -->

甲欄 | 乙欄
---|---
一 | 二

第三註[^c]。

[^c]: @fine2012 指出，*註中斜體*。

<!-- 註解行 -->
註解下的段落有**註解下粗體**。

- 外層項
    - 四格巢狀項
MD
log="$(tt compile paper main 2>&1)" || { echo "$log" >&2; echo "FAIL compile journal" >&2; exit 1; }
text="$(pdftotext "$paper/src/main/main.pdf" -)"
check "journal subset keeps the three cited entries and the crossref parent" has "$log" "bibliography: 4/5 entries"
check "journal PDF has the title" has "$text" "論德性與知識"
check "journal PDF groups two citations" has "$text" "(Fine 2012; Sosa 2007, 23)"
check "journal PDF prints a year-only citation" has "$text" "(2010)"
check "journal PDF prints a narrative citation" has "$text" "Sosa (2007) 所說"
check "journal PDF joins the wrapped Chinese line" has "$text" "所說，德性即能力"
check "journal PDF numbers the heading" has "$text" "肆、引註"
check "journal PDF omits the front matter" lacks "$text" "前置資料"
check "journal PDF keeps bold and footnotes in a paragraph opening with a citation" lacks "$text" "**粗體**"
check "journal PDF renders a citation-led paragraph's footnote" has "$text" "第一個腳註"
check "journal PDF keeps two adjacent footnote definitions apart" has "$text" "第二個腳註"
check "journal PDF has no literal footnote marker" lacks "$text" "[^"
check "journal PDF keeps an HTML comment hidden" lacks "$text" "草稿備註"
check "journal PDF keeps a link after a narrative citation" lacks "$text" "](https"
check "journal PDF renders a table without leading pipes" lacks "$text" "---|"
check "journal PDF keeps italics in a footnote that opens with a citation" lacks "$text" "*註中斜體*"
check "journal PDF renders the paragraph under a comment line" lacks "$text" "**註解下粗體**"
check "journal PDF keeps a four-space nested list item" lacks "$text" "外層項- 四格"
exit "$fail"
