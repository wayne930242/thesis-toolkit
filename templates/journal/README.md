# journal skeleton

Writing project for a Taiwanese humanities journal article: `thesis-toolkit new-project <slug>
"<Title>" --template journal` copies it to `<projectsDir>/<slug>/` and fills in the title. The body
and abstracts are Markdown files at the project root, rendered through `@preview/cmarker` inside
`@local/zh-journal`; `src/main/main.typ` holds the title, authors, and keywords.
