// Anonymised essay for blind review (competitions, journal submissions).
// The page shows only the title, an optional word count, the abstract and the body;
// the PDF metadata carries the title and nothing else (no author, keywords or date).

/// Page and text setup for the whole essay. Use as `#show: essay.with(title: [...], abstract: [...])`.
/// - title: content shown at the top and stored as the PDF title.
/// - abstract: content set as an indented abstract, or none.
/// - word-count: an integer or content printed under the title, or none.
/// - paper, font, size, lang: page size, body font, body size, and hyphenation language.
#let essay(
  title: none,
  abstract: none,
  word-count: none,
  paper: "a4",
  font: "Libertinus Serif",
  size: 11pt,
  lang: "en",
  body,
) = {
  set document(title: title, author: (), keywords: (), date: none)
  set page(paper: paper, margin: (x: 2.6cm, y: 2.6cm), numbering: "1", number-align: center)
  set text(font: font, size: size, lang: lang)
  set par(justify: true, leading: 0.72em, spacing: 1.2em)

  set heading(numbering: none)
  show heading: set block(above: 1.8em, below: 1em)
  show heading.where(level: 1): set text(size: size * 1.18)
  show heading.where(level: 2): set text(size: size * 1.05)
  show heading.where(level: 3): set text(size: size, weight: "regular", style: "italic")

  show quote.where(block: true): it => pad(left: 2em, right: 2em, it.body)
  show link: set text(fill: rgb("#1f3a93"))

  if title != none {
    align(center, block(width: 85%, {
      set par(justify: false)
      text(size: size * 1.45, weight: "bold", hyphenate: false, title)
    }))
  }
  if word-count != none {
    align(center, text(size: size * 0.85, [Word count (excluding the bibliography): #word-count]))
  }
  if abstract != none {
    v(0.6em)
    pad(x: 2.5em, {
      set text(size: size * 0.92)
      [*Abstract.* #abstract]
    })
  }
  v(0.8em)
  body
}

/// A bibliography typed as plain paragraphs (author-date entries), with hanging indents.
#let references(title: [References], body) = {
  heading(level: 1, title)
  set par(hanging-indent: 1.6em, justify: false, spacing: 0.9em)
  body
}

/// Pandoc's Typst writer emits these for thematic breaks; define them so converted bodies compile.
#let horizontalrule = align(center, line(length: 50%, stroke: 0.5pt))
#let divider = horizontalrule
