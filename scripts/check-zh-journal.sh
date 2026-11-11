#!/usr/bin/env bash
# Render zh-journal variants through the built CLI and check what reaches the PDF:
# a named control copy must show the author (so the leak check is not blind), and anonymous
# copies in both english-position modes must carry no author field in text or metadata.
# Needs `npm run build` first, and pdftotext/pdfinfo (poppler-utils).
set -euo pipefail

for tool in pdftotext pdfinfo; do
    command -v "$tool" >/dev/null || { echo "$tool not found; install poppler-utils" >&2; exit 1; }
done
repo="$(cd "$(dirname "$0")/.." && pwd)"
version="$(sed -n 's/^version = "\(.*\)"$/\1/p' "$repo/templates/zh-journal/typst.toml")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

cat >"$work/refs.bib" <<'BIB'
@book{sosa2007, author = {Sosa, Ernest}, title = {A Virtue Epistemology}, publisher = {Oxford University Press}, year = {2007}}
BIB

# The author fields every anonymous copy must hide.
secrets=("檢查作者甲" "Checker Jia" "檢查大學" "Checker University" "jia@example.edu" "檢查誌謝")

write_doc() { # name anonymous english-position
    cat >"$work/$1.typ" <<DOC
#import "@local/zh-journal:$version": article
#show: article.with(
  title: [檢查題目], title-en: [Check Title],
  authors: ((name: "檢查作者甲", name-en: "Checker Jia", affiliation: "檢查大學",
             affiliation-en: "Checker University", email: "jia@example.edu"),),
  thanks: [檢查誌謝],
  abstract: [摘要內容#footnote[摘要腳註]], keywords: ("甲",),
  abstract-en: [English abstract.], keywords-en: ("a",),
  anonymous: $2, english-position: "$3",
  bib: path("refs.bib"),
)
= 前言
正文 @sosa2007#footnote[正文腳註]
DOC
    node "$repo/dist/cli.js" compile "$work/$1.typ" >/dev/null
}

fail=0
check() { # description, then a command that must succeed
    local what="$1"; shift
    if "$@"; then echo "ok   $what"; else echo "FAIL $what" >&2; fail=1; fi
}
has() { grep -qF -- "$2" <<<"$1"; }
lacks() { ! grep -qF -- "$2" <<<"$1"; }

write_doc named false end
text="$(pdftotext "$work/named.pdf" -)"
meta="$(pdfinfo "$work/named.pdf"; pdfinfo -meta "$work/named.pdf")"
# Every secret must be visible in the named copy, or its absence below would prove nothing.
for secret in "${secrets[@]}"; do
    check "control: named copy shows $secret" has "$text" "$secret"
done
check "control: named copy has author metadata" has "$meta" "檢查作者甲"
check "abstract footnote is 1 after the title notes" has "$text" "1摘要腳註"
check "body footnote continues at 2" has "$text" "2正文腳註"

for position in end front; do
    write_doc "anon-$position" true "$position"
    text="$(pdftotext "$work/anon-$position.pdf" -)"
    meta="$(pdfinfo "$work/anon-$position.pdf"; pdfinfo -meta "$work/anon-$position.pdf")"
    check "anonymous $position: body rendered" has "$text" "壹、前言"
    for secret in "${secrets[@]}"; do
        check "anonymous $position: text hides $secret" lacks "$text" "$secret"
        check "anonymous $position: metadata hides $secret" lacks "$meta" "$secret"
    done
done
check "front: English abstract precedes the body" \
    awk '/English abstract/{a=NR} /壹、前言/{b=NR} END{exit !(a && b && a < b)}' <<<"$(pdftotext "$work/anon-front.pdf" -)"

exit "$fail"
