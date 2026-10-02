#set document(title: "{Article Title}")
#set text(font: "Noto Serif TC", lang: "zh", region: "TW")
#set heading(numbering: "1.")

= {Article Title}

#include "../../chapters/section1.typ"

#bibliography(sys.inputs.at("bib-path", default: "/literature/references/bibliography.bib"), title: "參考文獻", style: "chicago-author-date")
