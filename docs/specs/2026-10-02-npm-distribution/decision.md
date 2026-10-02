# Decision: distribute thesis-toolkit through npm

## Outcome

`thesis-toolkit` is a public npm package. From `knowledge-base/phd-essay`, `npx thesis-toolkit …`
compiles writing projects with the bundled templates and fonts, scaffolds new projects, and starts
the research MCP servers (research-hub wrapping paper-search-mcp) that `literature/tools/` hosts today.
The writing (chapters, notes, prompts) stays in knowledge-base.

Actors: the author compiling and writing; Pi sessions in knowledge-base calling `research-hub` through `.mcp.json`.

## Scope

In: CLI (`compile`, `new-project`, `link`, `mcp research-hub`), Typst templates as a local Typst
package, used fonts, bibliography subsetting, MCP launch, npm packaging and release, the knowledge-base
switch-over (phd-essay, `.mcp.json`, literature docs and skills, removal of the moved files and submodules).

Out: changing research-hub or paper-search behavior; bib-manager (stays at `phd-essay/bib-manager`);
the Neon/R2 data flow; Lean proofs as an npm feature (they stay in the repo with dev-only scripts).

## Scenarios

1. `npx thesis-toolkit compile thesis thesis` in `phd-essay/` writes `projects/thesis/src/thesis/main.pdf`, identical in pages and text to today's output.
2. `npx thesis-toolkit new-project grounding-essay "On Grounding"` creates `projects/grounding-essay/`, which compiles with target `main`.
3. Tinymist preview of a chapter resolves `@local/ntu-thesis` after `npx thesis-toolkit link`.
4. A Pi session in knowledge-base starts `research-hub` from `.mcp.json` via the toolkit and can search, save, and download as before, with PDFs landing in the same downloads location contract.
5. A fresh machine with Node, uv, and Typst (no Rust, no submodules) gets all of the above.

## Decisions

| Question | Answer | Basis | Status |
|---|---|---|---|
| Package and repo name | `thesis-toolkit`, public GitHub repo, `docs/history/` dropped | user | confirmed |
| Consumer install | `npx`, used from `phd-essay` | user | confirmed |
| Integrate MCP tools | yes | user | confirmed |
| CLI implementation | TypeScript compiled to ESM JS, Node ≥ 20, no runtime dependencies | npx needs a Node bin; bib subsetting in Node removes the cross-repo Python script dependency | grounded |
| Template import | Typst local package `@local/ntu-thesis:<version>` passed via `--package-path`; `link` symlinks it into Typst's user package dir for editors | `typst compile --package-path`; relative imports cannot reach an npx cache | grounded |
| Fonts shipped | Noto Serif TC and Noto Sans TC only (~27 MB); the other three are referenced only in a comment | `rg` over templates and projects | grounded |
| Bibliography subset | Toolkit implements it; `literature/scripts/subset_bib.py` is left untouched | removes `python3 literature/...` coupling | grounded |
| Consumer config | `phd-essay/thesis-toolkit.json` names projects dir, Typst root, and shared bib; `phd-essay/package.json` pins the exact version | reproducible, one bump point | grounded |
| paper-search-mcp version | Keep the pinned upstream rev `808e462`; PyPI 0.1.4 lacks 39 commits of fixes (PDF validation, arXiv rate limits, orphan exit). Toolkit caches that rev and sets `RSH_PAPER_SEARCH_PROJECT_DIR` | `git log v0.1.4..HEAD`, `src/integrations.rs` | grounded |
| Lean proofs | Stay in the repo, excluded from the npm tarball; `scripts/lean.sh` and `lean-to-typst` are repo-dev tools | Lake needs a writable project dir | grounded |
| research-hub source and binaries | research_hub_mcp stays its own repo; a tag-triggered workflow publishes darwin-arm64 and linux-x64 binaries as a GitHub Release; the toolkit downloads and caches the pinned release | user | confirmed |
| First npm publish and release path | 0.1.0 published manually by the author after `npm login`; then npm trusted publishing from a `v*` tag workflow gated on CI | user | confirmed |
| Remove `literature/tools/*` submodules after switch-over | remove both; downloads move to `literature/downloads/` (gitignored); research-hub development uses a separate clone | user | confirmed |

## Core rules readiness

Applied rules: `~/.claude/rules/typescript.md`, `shell.md`, `python.md`, `git-safety.md`, `dependencies.md` (latest stable versions, official docs), `deployment.md` (tests before publish); knowledge-base `AGENTS.md` (Git and submodule handling, verification). No open rows remain.
