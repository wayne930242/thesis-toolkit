#import "@local/anonymous-essay:0.1.1": essay, references

#show: essay.with(
  title: [On the Example Essay],
  word-count: 42,
  abstract: [This essay shows the template. It argues that an example can be short, that it can
    quote a source, and that its bibliography needs hanging indents.],
)

= 1. Introduction

The template keeps the author out of the page and out of the PDF metadata, so the file can go to a
blind review as it is. Section numbers are written into the headings by hand, as in most
philosophy papers, so the numbering survives a conversion from Markdown.

== 1.1 A quotation

#quote(block: true)[Block quotations are indented on both sides and keep the body's justification.]

Unicode symbols such as ≽, ≻, ∑ and ≤ fall back to Typst's embedded fonts when the body font lacks
them.

#references[
  Author, A. 2020. _A Book_. Oxford: Oxford University Press.

  Author, B. 2021. "A Paper with a Long Title That Runs onto a Second Line." _Journal of
  Examples_ 1 (2): 3–45.
]
