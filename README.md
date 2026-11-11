# thesis-toolkit

Typst dissertation templates, fonts, a writing-project compiler, and a launcher for the
research-hub MCP server. The writing itself (chapters, notes) lives in your own repository;
this package supplies the tooling through `npx`.

## Install

Requirements: Node 20+, [Typst](https://github.com/typst/typst) 0.15+, and
[uv](https://docs.astral.sh/uv/) for the MCP server. macOS (Apple silicon) and Linux x64,
including WSL.

```bash
npm install --save-dev --save-exact thesis-toolkit
npx thesis-toolkit link     # once per install, for editor preview
```

Add `thesis-toolkit.json` beside `package.json`; paths are relative to it:

```json
{ "root": "..", "projectsDir": "projects", "bibliography": "../literature/references/bibliography.bib" }
```

- `root` is Typst's `--root`; root-anchored paths such as `/literature/...` resolve against it.
- `projectsDir` holds writing projects laid out as `<project>/src/<target>/main.typ`.
- `bibliography` is the shared BibTeX file.

## Commands

```bash
npx thesis-toolkit compile thesis thesis       # projects/thesis/src/thesis/main.typ → main.pdf
npx thesis-toolkit compile thesis outline -w   # watch
npx thesis-toolkit compile some/file.typ       # one file
npx thesis-toolkit compile thesis thesis --output /tmp/preview.pdf  # write the PDF elsewhere
npx thesis-toolkit new-project grounding-essay "On Grounding and Essence"
npx thesis-toolkit new-project my-paper "論文題目" --template journal  # Markdown body, zh-journal layout
npx thesis-toolkit link                        # expose @local packages to editors
npx thesis-toolkit mcp research-hub            # MCP server over stdio
```

`compile <project> <target>` writes `<project>/references.generated.bib` with the entries the
project's `.typ` and `.md` files reference (`@key`, `<key>`, `label("key")`, plus their `crossref`
parents and every `@string`) and passes it to Typst as `--input bib-path=<root-relative path>`.
It always passes the bundled fonts and Typst packages, so documents need no font or template
paths of their own.

## The ntu-thesis template

`templates/ntu-thesis` is the Typst package `@local/ntu-thesis:0.1.1` (see its README). Its version
changes only when the template changes, so a toolkit upgrade does not touch your imports.

```typst
#import "@local/ntu-thesis:0.1.1": setup, chapter-bib as ntu-chapter-bib
```

Create the bibliography path in your project, not in the package, so it resolves against your root:

```typst
// projects/thesis/src/thesis/bib.typ
#import "@local/ntu-thesis:0.1.1": chapter-bib as ntu-chapter-bib
#let chapter-bib = ntu-chapter-bib.with(path(sys.inputs.at("bib-path", default: "/references.bib")))
```

## The anonymous-essay template

`templates/anonymous-essay` is the Typst package `@local/anonymous-essay:0.1.1`, for blind review
(competitions, journal submissions). The page shows only the title, an optional word count, the
abstract and the body, and the PDF metadata carries the title alone: no author, keywords or date.
See `templates/anonymous-essay/example.typ`.

```typst
#import "@local/anonymous-essay:0.1.1": essay, references
#show: essay.with(title: [My Title], abstract: [...])
```

## The zh-journal template

`templates/zh-journal` is the Typst package `@local/zh-journal:0.1.2`: a generic Taiwanese (TSSCI)
humanities journal article with Chinese and English titles and abstracts, 壹／一／（一） headings,
footnotes, author-date citations, and an anonymous blind-review mode (see its README).

```typst
#import "@local/zh-journal:0.1.2": article
#show: article.with(title: [論文題目], bib: path(sys.inputs.at("bib-path", default: "/references.bib")))
```

## research-hub MCP server

`mcp research-hub` downloads the pinned
[research_hub_mcp](https://github.com/wayne930242/research_hub_mcp) release binary (SHA-256 verified)
and the pinned [paper-search-mcp](https://github.com/openags/paper-search-mcp) source into the user
cache, then runs research-hub over stdio. `RSH_*` variables pass through:

```json
{
  "mcpServers": {
    "research-hub": {
      "command": "npx",
      "args": ["-y", "thesis-toolkit@0.1.6", "mcp", "research-hub"],
      "env": { "RSH_LIBRARY_API_URL": "https://…", "RSH_DOWNLOAD_DIRECTORY": "/abs/path/downloads" }
    }
  }
}
```

`save_papers_to_library` also needs `RSH_LIBRARY_ADMIN_TOKEN`, the library's admin credential. Supply it
from the launching environment rather than the committed `env` block.

research-hub keeps a `.metadata_cache/` directory in the directory it is started from, so add that
name to the `.gitignore` of the repository your MCP client runs in.

## Repository-only tools

`lean/` holds Lean 4 proofs on Foundation; `scripts/lean` builds, checks, and runs them, and
`scripts/lean_to_typst.py` turns `#print`ed definitions into a Typst fragment. Neither ships in the
npm package. See [lean/README.md](lean/README.md).

## License

MIT for the code and templates; fonts are under the SIL Open Font License (see `fonts/README.md`).
research-hub is GPL-3.0 and paper-search-mcp MIT; both are downloaded from their own repositories.
