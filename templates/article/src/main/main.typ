#set document(title: "{Article Title}")
#set text(font: "Noto Serif TC", lang: "zh", region: "TW")
#set heading(numbering: "1.")

// Shows the document title above, unnumbered; sections start at 1.
#title()

#include "../../chapters/section1.typ"

// `thesis-toolkit compile` passes bib-path, the subset of your bibliography this project cites.
// The default only serves an editor preview: it is a path from the Typst root, so change it to
// where your bibliography file is.
#bibliography(sys.inputs.at("bib-path", default: "/literature/references/bibliography.bib"), title: "參考文獻", style: "chicago-author-date")
