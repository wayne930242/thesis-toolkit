// Generic Taiwanese (TSSCI) humanities journal article.
//
// Layout: Chinese title, authors (affiliations as starred notes), Chinese abstract and
// keywords, body with 壹、一、（一）、1.、(1) headings and numbered footnotes, author-date
// citations with a 參考文獻 list, then the English title and abstract (at the end by default,
// or after the Chinese abstract). `anonymous: true` drops every author detail for blind review.
//
// `bib` must be a `path(...)` (or bytes) created in the consumer's project: a path string would
// be resolved inside this package.

#let body-fonts = ("Libertinus Serif", "Noto Serif TC")
#let heading-fonts = ("Libertinus Serif", "Noto Serif TC")

#let _zh-upper-digits = ("零", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖")

/// Traditional Chinese financial numeral for 1–99: 壹、貳、…、拾、拾壹、貳拾.
#let zh-upper(n) = {
  assert(type(n) == int and n >= 1 and n <= 99, message: "zh-upper supports 1–99, got " + repr(n))
  let tens = calc.quo(n, 10)
  let ones = calc.rem(n, 10)
  let head = if tens == 0 { "" } else if tens == 1 { "拾" } else { _zh-upper-digits.at(tens) + "拾" }
  head + if ones == 0 { "" } else { _zh-upper-digits.at(ones) }
}

/// Heading numbers: 壹、 / 一、 / （一） / 1. / (1). Deeper levels repeat (1).
#let zh-heading-numbering(..nums) = {
  let n = nums.pos()
  let last = n.last()
  if n.len() == 1 { zh-upper(last) + "、" }
  else if n.len() == 2 { numbering("一", last) + "、" }
  else if n.len() == 3 { "（" + numbering("一", last) + "）" }
  else if n.len() == 4 { str(last) + ". " }
  else { "(" + str(last) + ") " }
}

#let _cjk = regex("[\p{Han}\p{Hiragana}\p{Katakana}\p{Hangul}\u{3000}-\u{303F}\u{FF00}-\u{FFEF}]")

/// Drop a YAML front matter block (`---` on the first line, up to the next `---` or `...`
/// line), which editors such as MyGitNotes write and cmarker would print as text. Run it
/// first: `md-cites(zh-join-lines(strip-frontmatter(read("body.md"))))`.
#let strip-frontmatter(source) = {
  // As in Pandoc, the line after the opening `---` is not blank, so a document that opens with
  // a thematic break keeps its text. An empty block (`---` then `---`) is still front matter.
  let close = "(?:---|\.\.\.)[ \t]*(?:\r?\n|$)"
  let m = source.match(regex(
    "^\u{FEFF}?---[ \t]*\r?\n(?:" + close + "|[^\r\n]*\S[^\r\n]*\r?\n(?:[\s\S]*?\r?\n)??" + close + ")",
  ))
  if m == none { source } else { source.slice(m.end) }
}

#let _fence-open = regex("^ {0,3}(`{3,}|~{3,})")
#let _indented = regex("^( {4}|\t)")
#let _list-item = regex("^ {0,3}([-*+]|\d+[.)])(\s|$)")
// A line no following line can continue: an ATX heading, HTML (a comment's first or last line),
// a thematic break, or a setext underline.
#let _closed-line = regex("^ {0,3}(#|<)|-->[ \t]*$|^ {0,3}(=+|-+|([-*_][ \t]*){3,})[ \t]*$")
// A line that starts its own block, or ends the paragraph above it: list items, quotes,
// headings, HTML, setext underlines and thematic breaks, fences, blank lines, and footnote
// or link reference definitions.
// Any indentation: a nested list item indented by a tab or four spaces still starts a block.
#let _block-start = regex("^[ \t]*([-*+>#<=_]|\d+[.)]|```|~~~|$|\[[^\]]+\]:)")
// An unescaped `|`: the line may be a table row, with or without leading pipes.
#let _pipe = regex("(^|[^\\\\])\|")

/// Classify each Markdown line as "fence" (inside or delimiting fenced code), "code"
/// (indented code), "blank", or "text".
#let _line-kinds(lines) = {
  let kinds = ()
  let fence = none
  let prev = "blank"
  let in-list = false
  for line in lines {
    let kind = if fence != none {
      if line.match(regex("^ {0,3}" + fence.at(0) + "{" + str(fence.at(1)) + ",}\s*$")) != none {
        fence = none
      }
      "fence"
    } else if line.match(_fence-open) != none {
      let run = line.match(_fence-open).captures.at(0)
      fence = (if run.starts-with("`") { "`" } else { "~" }, run.len())
      "fence"
    } else if line.trim() == "" {
      "blank"
    } else if line.match(_indented) != none and (prev == "code" or (prev == "blank" and not in-list)) {
      "code"
    } else {
      if line.match(_indented) == none { in-list = line.match(_list-item) != none }
      "text"
    }
    kinds.push(kind)
    prev = kind
  }
  kinds
}

/// Join Markdown lines that continue one paragraph when either side of the break is CJK, so
/// a wrapped Chinese sentence gets no stray space. Headings, lists, quotes, tables, code
/// blocks, footnote definitions, and hard breaks (two trailing spaces or `\`) keep their
/// newlines, and so do breaks between Latin words. Pass Markdown text read in your project:
/// `render(zh-join-lines(read("body.md")))`.
#let zh-join-lines(source) = {
  let lines = source.split("\n")
  let kinds = _line-kinds(lines)
  let parts = ()
  let joined = false
  for (i, line) in lines.enumerate() {
    let next = lines.at(i + 1, default: none)
    // A continuation line's indentation is not content; drop it where the lines meet.
    let text = if joined { line.trim(at: start) } else { line }
    let join = (
      next != none and kinds.at(i) == "text" and kinds.at(i + 1) == "text"
        and line.match(_closed-line) == none
        and next.match(_block-start) == none
        and line.match(_pipe) == none and next.match(_pipe) == none
        and not line.ends-with("  ") and not line.ends-with("\\")
        and (line.trim().clusters().last().match(_cjk) != none
          or next.trim().clusters().first().match(_cjk) != none)
    )
    parts.push(if join { text.trim(at: end) } else { text })
    if next != none { parts.push(if join { "" } else { "\n" }) }
    joined = join
  }
  parts.join(default: "")
}

// A Pandoc citation key: starts with a letter, digit, or `_`; inner `:./-` allowed; trailing
// punctuation ends it, so `@sosa2007.` cites `sosa2007`.
#let _key = "[\p{L}\p{N}_](?:[\p{L}\p{N}_:./-]*[\p{L}\p{N}_])?"
// Characters that make an `@` part of an email, URL, or word instead of a citation.
#let _word-char = "A-Za-z0-9._\\\\@/:=?&%+-"
#let _cite-pattern = regex(
  // 1-2: cmarker's own `[locator][@key]`, left as it is.
  "\[([^\[\]]*)\]\[@(" + _key + ")\]"
  // 3: a bracketed group `[@a; @b, 23]` or `[-@a]`.
  + "|\[(\s*-?@" + _key + "[^\[\]]*)\]"
  // 4: brackets with text before the `@`, such as `[see @a]`.
  + "|\[([^\[\]@]*[^\s\[\]@][^\[\]@]*@" + _key + "[^\[\]]*)\]"
  // 5-7: a narrative `@key`, optionally `@key [23]`; not inside an email or URL.
  + "|(^|[^" + _word-char + "\[\]])@(" + _key + ")(?:\s*\[([^\[\]@^]*)\])?",
)
#let _cite-item = regex("^\s*(-?)@(" + _key + ")\s*(?:,\s*(.*?))?\s*$")

#let _cite-call(key, locator: none, form: none) = {
  if locator != none and locator.contains("-->") {
    panic("zh-journal: a citation locator must not contain `-->`: " + locator)
  }
  "#cite(label(" + repr(key) + ")"
  if locator != none { ", supplement: " + repr(locator) }
  if form != none { ", form: " + repr(form) }
  // `;` ends the expression, so a `(` or `[` right after the citation stays text.
  ");"
}

#let _locator(text) = if text == none or text.trim() == "" { none } else { text.trim() }

#let _cite-group(group) = {
  let items = group.split(";").map(item => {
    let m = item.match(_cite-item)
    if m == none {
      panic(
        "zh-journal: cannot read the citation [" + group + "]; write each item as @key or "
          + "@key, locator, separated by `;` (text before @ is not supported)",
      )
    }
    (suppress: m.captures.at(0) == "-", key: m.captures.at(1), locator: _locator(m.captures.at(2)))
  })
  if items.any(i => i.suppress) {
    if items.len() > 1 {
      panic("zh-journal: -@key (year only) must stand alone in its brackets: [" + group + "]")
    }
    let i = items.first()
    // Typst's year form drops a supplement, so the locator follows as a string (never markup).
    let locator = if i.locator == none { "" } else {
      if i.locator.contains("-->") {
        panic("zh-journal: a citation locator must not contain `-->`: " + i.locator)
      }
      "#" + repr(", " + i.locator) + ";"
    }
    "(" + _cite-call(i.key, form: "year") + locator + ")"
  } else {
    items.map(i => _cite-call(i.key, locator: i.locator)).join()
  }
}

#let _raw(code) = "<!--raw-typst" + code + "-->"

/// Rewrite the citations in `text`, a piece of one line outside code spans and comments.
#let _cites-in-text(text) = {
  let out = ""
  let cursor = 0
  for m in text.matches(_cite-pattern) {
    let c = m.captures
    // A `(` or `[` right after `]` makes the brackets a link's text.
    let after = text.slice(m.end).clusters().at(0, default: "")
    let link = after == "(" or after == "["
    out += text.slice(cursor, m.start)
    cursor = m.end
    out += if c.at(0) != none or c.at(1) != none {
      m.text
    } else if c.at(2) != none {
      // `[@a]: url` at the start of a line is a link reference definition.
      if link or (after == ":" and text.slice(0, m.start).trim() == "") { m.text } else { _raw(_cite-group(c.at(2))) }
    } else if c.at(3) != none {
      let before = c.at(3).split("@").first().clusters().at(-1, default: "")
      if link or before.match(regex("[" + _word-char + "]")) != none {
        m.text
      } else {
        panic(
          "zh-journal: write text outside the citation brackets, as `參見 [@key]`, not `[" + c.at(3) + "]`",
        )
      }
    } else {
      let key = c.at(5)
      let head = c.at(4) + "@" + key
      if c.at(6) != none and link {
        // `@a [text](url)`: the brackets belong to the link, so the citation takes no locator.
        c.at(4) + _raw(_cite-call(key, form: "prose")) + m.text.slice(head.len())
      } else {
        c.at(4) + _raw(_cite-call(key, locator: _locator(c.at(6)), form: "prose"))
      }
    }
  }
  let rest = text.slice(cursor)
  if rest.match(regex("\[\s*-?@" + _key + "[^\[\]]*$")) != none {
    panic("zh-journal: keep a bracketed citation on one line: " + rest.trim())
  }
  out + rest
}

#let _inline-token = regex("<!--|-->|`+")
// A line whose content would start with our `<!--`: CommonMark reads that as an HTML block.
#let _html-start = regex("^([ \t]*(?:(?:[-*+]|\d+[.)])[ \t]+|>[ \t]?|\[\^[^\]]+\]:[ \t]*)*)<!--raw-typst")

/// Rewrite one text line, skipping code spans and HTML comments; returns the new line and
/// whether a comment is still open at its end.
#let _cites-in-line(line, in-comment) = {
  let tokens = line.matches(_inline-token)
  let out = ""
  let cursor = 0
  let code = none
  for (k, t) in tokens.enumerate() {
    if in-comment {
      if t.text == "-->" {
        in-comment = false
        out += line.slice(cursor, t.end)
        cursor = t.end
      }
    } else if code != none {
      if t.text == code {
        code = none
        out += line.slice(cursor, t.end)
        cursor = t.end
      }
    } else if t.text == "<!--" {
      out += _cites-in-text(line.slice(cursor, t.start))
      cursor = t.start
      in-comment = true
    } else if t.text.starts-with("`") and tokens.slice(k + 1).any(u => u.text == t.text) {
      // A backtick run opens a code span only when a run of the same length closes it.
      out += _cites-in-text(line.slice(cursor, t.start))
      cursor = t.start
      code = t.text
    }
  }
  let rest = line.slice(cursor)
  out += if in-comment { rest } else { _cites-in-text(rest) }
  (out.replace(_html-start, m => m.captures.at(0) + "\u{200B}<!--raw-typst", count: 1), in-comment)
}

/// Rewrite Pandoc citations in Markdown into Typst citations that cmarker passes through:
/// `[@a]` and `[@a; @b]` give (A 2001; B 2002), `[@a, 23]` gives (A 2001, 23), `[-@a]` gives
/// (2001), and a bare `@a` (or `@a [23]`) gives A (2001). cmarker's own `[23][@a]` keeps
/// working. Code spans, fenced and indented code, HTML comments, links, and `@` inside an
/// email or URL are left alone. End a bare `@key` with a space or punctuation before CJK text
/// (`@a 指出`, not `@a指出`), keep a bracketed group on one line, and write text outside the
/// brackets (`參見 [@a]`).
#let md-cites(source) = {
  let lines = source.split("\n")
  let kinds = _line-kinds(lines)
  let in-comment = false
  let out = ()
  for (i, line) in lines.enumerate() {
    if kinds.at(i) == "text" or in-comment {
      let (rewritten, open) = _cites-in-line(line, in-comment)
      in-comment = open
      out.push(rewritten)
    } else {
      out.push(line)
    }
  }
  out.join("\n")
}

#let _keyword-line(label, items, sep) = if items.len() > 0 {
  par(first-line-indent: 0pt)[#text(weight: "bold")[#label]#items.join(sep)]
}

#let _abstract-block(heading-text, content, keyword-label, keywords, sep) = if content != none {
  v(1.2em)
  align(center, text(size: 13pt, weight: "bold", heading-text))
  v(0.4em)
  block(inset: (x: 2em), {
    set text(size: 11pt)
    content
    v(0.6em)
    _keyword-line(keyword-label, keywords, sep)
  })
}

#let _author-notes(authors, en: false) = {
  let name-key = if en { "name-en" } else { "name" }
  let aff-key = if en { "affiliation-en" } else { "affiliation" }
  let named = authors.filter(a => a.at(name-key, default: none) != none)
  if named.len() == 0 { return }
  align(center, text(size: 12pt, named.map(a => {
    let note = (a.at(aff-key, default: none), a.at("email", default: none)).filter(x => x != none)
    if note.len() > 0 and not en {
      [#a.at(name-key)#footnote(numbering: "*", note.join("，"))]
    } else {
      a.at(name-key)
    }
  }).join("　")))
  if en {
    let affs = named.map(a => a.at(aff-key, default: none)).filter(x => x != none)
    if affs.len() > 0 { align(center, text(size: 10.5pt, style: "italic", affs.join("; "))) }
  }
}

#let _english-part(title-en, subtitle-en, authors, anonymous, abstract-en, keywords-en) = {
  if title-en != none {
    v(1em)
    align(center, text(size: 15pt, weight: "bold", title-en))
    if subtitle-en != none { align(center, text(size: 12.5pt, subtitle-en)) }
  }
  if not anonymous { v(0.4em); _author-notes(authors, en: true) }
  {
    set text(lang: "en", region: none)
    set par(first-line-indent: 0pt)
    _abstract-block([Abstract], abstract-en, [Keywords: ], keywords-en, [, ])
  }
}

/// Journal article layout. Use as `#show: article.with(...)`.
///
/// - authors: array of dictionaries with `name`, and optional `name-en`, `affiliation`,
///   `affiliation-en`, `email`.
/// - english-position: "end" (after 參考文獻, the usual placement) or "front".
/// - anonymous: blind-review copy; hides authors, `thanks`, and author metadata.
/// - bib: a `path(...)` or bytes from the consumer project, or none for no reference list.
#let article(
  title: none,
  subtitle: none,
  title-en: none,
  subtitle-en: none,
  authors: (),
  thanks: none,
  abstract: none,
  keywords: (),
  abstract-en: none,
  keywords-en: (),
  english-position: "end",
  anonymous: false,
  running-head: none,
  bib: none,
  bib-style: "chicago-author-date",
  bib-title: [參考文獻],
  paper: "a4",
  font-size: 12pt,
  body,
) = {
  assert(title != none, message: "zh-journal: title is required")
  assert(english-position in ("end", "front"), message: "zh-journal: english-position must be \"end\" or \"front\"")
  assert(type(authors) == array, message: "zh-journal: authors must be an array of dictionaries")
  for a in authors {
    assert(type(a) == dictionary and "name" in a, message: "zh-journal: each author needs a name")
  }
  assert(type(keywords) == array and type(keywords-en) == array, message: "zh-journal: keywords must be arrays")
  assert(keywords.all(k => type(k) == str), message: "zh-journal: keywords must be strings (they also go into the PDF metadata)")

  set document(
    title: title,
    author: if anonymous { () } else { authors.map(a => a.name) },
    keywords: keywords,
  )

  set page(
    paper: paper,
    margin: (top: 2.8cm, bottom: 2.5cm, x: 2.8cm),
    header: context if counter(page).get().first() > 1 {
      set text(size: 9pt)
      align(right, if running-head != none { running-head } else { title })
      v(-0.6em)
      line(length: 100%, stroke: 0.4pt)
    },
    footer: context align(center, text(size: 10pt, counter(page).display("1"))),
  )

  set text(font: body-fonts, size: font-size, lang: "zh", region: "TW")
  set par(leading: 0.95em, spacing: 0.95em, justify: true, first-line-indent: (amount: 2em, all: true))

  set heading(numbering: zh-heading-numbering)
  show heading: it => {
    let size = if it.level == 1 { 14pt } else { font-size }
    set text(font: heading-fonts, size: size, weight: "bold")
    set par(first-line-indent: 0pt, justify: false)
    let above = if it.level == 1 { 1.6em } else { 1.2em }
    block(above: above, below: 0.9em, sticky: true, {
      if it.numbering != none { counter(heading).display(it.numbering) }
      it.body
    })
  }

  set footnote.entry(separator: line(length: 30%, stroke: 0.5pt), gap: 0.5em, indent: 0pt)
  show footnote.entry: set text(size: 10pt)
  show footnote.entry: set par(leading: 0.65em, first-line-indent: 0pt, hanging-indent: 1.2em)

  show quote.where(block: true): it => {
    set text(size: font-size - 1pt)
    set par(first-line-indent: 0pt)
    block(inset: (left: 2em, right: 2em), above: 1.2em, below: 1.2em, {
      it.body
      if it.attribution != none { align(right, [——#it.attribution]) }
    })
  }

  show figure.where(kind: table): set figure.caption(position: top)
  show figure.caption: set text(size: 10.5pt)
  set table(stroke: (x, y) => if y == 0 { (top: 0.8pt, bottom: 0.5pt) } else { none })
  // Three-line table: the stroke rule above draws the top and header rules; close it with a bottom rule.
  show table: it => {
    let fields = it.fields()
    let cells = fields.remove("children")
    // The rebuilt table matches this rule again; the closing hline marks it as done.
    if cells.len() > 0 and cells.last().func() == table.hline { it } else {
      table(..fields, ..cells, table.hline(stroke: 0.8pt))
    }
  }

  // Title block.
  align(center, {
    text(size: 18pt, weight: "bold", font: heading-fonts, title)
    if not anonymous and thanks != none { footnote(numbering: "*", thanks) }
    if subtitle != none { linebreak(); text(size: 14pt, subtitle) }
  })
  if not anonymous {
    v(0.6em)
    _author-notes(authors)
  }
  // Title-page notes use *, †, ‡; footnotes from the abstract on start again at 1.
  counter(footnote).update(0)
  if english-position == "front" {
    _abstract-block([摘要], abstract, [關鍵詞：], keywords, [、])
    _english-part(title-en, subtitle-en, authors, anonymous, abstract-en, keywords-en)
  } else {
    _abstract-block([摘要], abstract, [關鍵詞：], keywords, [、])
  }
  v(1.5em)

  body

  if bib != none {
    show bibliography: set par(first-line-indent: 0pt, hanging-indent: 2em)
    heading(numbering: none, bib-title)
    bibliography(bib, title: none, style: bib-style)
  }

  if english-position == "end" and (title-en != none or abstract-en != none) {
    pagebreak()
    _english-part(title-en, subtitle-en, authors, anonymous, abstract-en, keywords-en)
  }
}
