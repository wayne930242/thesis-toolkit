// Example for @local/zh-journal. Inside a consumer project import the package instead:
//   #import "@local/zh-journal:0.1.1": article
// and pass `bib: path(sys.inputs.at("bib-path", default: "/references.bib"))`.
#import "lib.typ": article

#show: article.with(
  title: [論德性與知識：一份期刊版面示範],
  subtitle: [以中文人文期刊常見體例為例],
  title-en: [On Virtue and Knowledge: A Journal Layout Sample],
  authors: (
    (
      name: "王小明",
      name-en: "Xiao-Ming Wang",
      affiliation: "範例大學哲學系博士生",
      affiliation-en: "PhD Student, Department of Philosophy, Example University",
      email: "author@example.edu",
    ),
  ),
  thanks: [本文初稿曾發表於範例研討會，感謝兩位匿名審查人的意見。],
  abstract: [
    本文示範中文人文期刊的常見版面：中文題目與作者、摘要與關鍵詞、以「壹、一、（一）」編號的標題、腳註、作者—年代引註與文末參考文獻，最後是英文題目與摘要。內容僅供版面示範。
  ],
  keywords: ("德性知識論", "立基", "期刊體例"),
  abstract-en: [
    This sample shows the usual layout of a Taiwanese humanities journal article: Chinese title and
    authors, abstract and keywords, headings numbered in the Chinese style, footnotes, author-date
    citations with a reference list, and the English title and abstract at the end.
  ],
  keywords-en: ("virtue epistemology", "grounding", "journal style"),
  running-head: [論德性與知識],
  bib: path("example.bib"),
)

= 前言

德性知識論主張，知識是出於認知能力的適切信念 @sosa2007[23]。本節示範內文段落：每段首行縮排兩字，標題後的第一段同樣縮排。#footnote[腳註以阿拉伯數字連續編號，作者附註以星號另計。]

形上學中的立基（grounding）問題則另有脈絡 @fine2012。中文文獻同樣以作者—年代引註 @example2020。

= 問題的提出

== 第二層標題

=== 第三層標題

==== 第四層標題

===== 第五層標題

區塊引文縮排並縮小字級：

#quote(block: true, attribution: [Sosa 2007, 23])[
  Knowledge is belief whose correctness is attributable to a competence exercised in its
  appropriate conditions.
]

#figure(
  table(
    columns: 3,
    [立場], [代表人物], [主張],
    [德性可靠論], [Sosa], [適切信念],
    [德性責任論], [Zagzebski], [出於德性動機],
  ),
  caption: [兩種德性知識論],
)

= 結論

本文僅示範版面。
