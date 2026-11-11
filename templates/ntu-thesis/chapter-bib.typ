// Bibliography shared by a main file and its chapters.
// - The main file calls chapter-bib(source, main: true), registering the bibliography under <main-bib>.
// - Each chapter calls chapter-bib(source); it adds a bibliography only when no <main-bib> exists,
//   so a chapter opened alone in an editor still resolves its citations.
// `title` is the bibliography heading: auto keeps the layout's title (參考文獻 / References), none hides it,
// content replaces it. The heading is unnumbered, so it never prints a chapter label.
// `source` must be a `path(...)` (or bytes) created in the project: a path string would be
// resolved inside this package instead of the project.

#let chapter-bib(source, main: false, style: "chicago-author-date", title: auto) = {
  // Pass `title` only when set: an explicit `auto` would override the layout's default title.
  let extra = if title == auto { (:) } else { (title: title) }
  context if main {
    [#bibliography(source, style: style, ..extra) <main-bib>]
  } else if query(<main-bib>) == () {
    bibliography(source, style: style, ..extra)
  }
}
