#import "../font-config.typ": ntu-fonts

// === 參考文獻模板 ===
// `bibliography-content` is a bibliography(...) created by the caller. Its title becomes the
// level-1 heading of the layout (unnumbered, centred), so the title appears once and is in the outline.
// - title: auto keeps the language's default bibliography title; pass content to override it.
#let make-ref(bibliography-content, title: auto) = {
  pagebreak(weak: true)

  set text(size: 12pt, font: ntu-fonts)
  set par(
    leading: 1.0em,   // 2.0倍行距
    spacing: 1.2em,   // 段落間距
    justify: true,
    first-line-indent: 0em  // 參考文獻不縮排
  )
  set bibliography(title: title)

  bibliography-content
}
