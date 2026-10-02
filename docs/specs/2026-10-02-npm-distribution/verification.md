# Verification: thesis-toolkit on npm

Spec: [spec.md](spec.md).

| Requirement | Evidence | Result |
|---|---|---|
| `compile <project> <target>` output unchanged | Published 0.1.2 installed in `phd-essay`; `thesis`, `outline`, `writing-direction` → 26/16/31 pages, `pdftotext` identical to the pre-split baseline | pass |
| Bibliography subset matches the previous script | `references.generated.bib` entries identical to `literature/scripts/subset_bib.py` output (13/51) | pass |
| `compile <file.typ>` | `templates/ntu-thesis/example.typ` → 28 pages, locally and in CI | pass |
| `new-project` | Created a project with a quoted title, compiled it, rejected an existing slug and an unknown target; removed afterwards. Unit tests cover slug and escaping | pass |
| `link` for editors | `typst compile` of `chapters/ch1-introduction.typ` without `--package-path` resolved `@local/ntu-thesis` (4 pages) | pass |
| `mcp research-hub` | Through the knowledge-base `.mcp.json` launch line and through `npx -y thesis-toolkit@0.1.2` from `/tmp`: `initialize` → 0.6.7, `tools/list` → 8 tools, `search_papers` returned results; stdout carried only JSON-RPC | pass |
| Checksum-pinned binaries | Release assets' `.sha256` verified with `shasum -c`; the cache holds the pinned darwin-arm64 binary | pass |
| Linux binary on old WSL | `x86_64-unknown-linux-musl` is static-pie and prints `0.6.7` in `ubuntu:20.04` (glibc 2.31) under emulation | pass |
| Unsupported platform message | Unit test `platformKey("win32", "x64")` | pass |
| Tarball contents | `scripts/check-pack.sh` under npm 11 and 12: 45 files, 24.0 MB, no `lean/`, `docs/`, `scripts/`, PDFs; executable `dist/cli.js` | pass |
| CI and trusted publishing | CI green on `dc2dcc9`, `2906967`, `aa23748`; `v0.1.2` published by the Publish workflow over OIDC with a provenance statement | pass |
| No stale references in knowledge-base | `rg` for the removed paths finds only a pre-existing `.gitignore` entry | pass |
| Pi session connects through `.mcp.json` | This session still held the old config; needs `/reload` | unknown |

## Deviations

- `v0.1.1` tag exists without a release: its Publish run failed because npm 12 changed `pack --json`.
  Fixed in 0.1.2; CI now upgrades npm like the publish job.
- Four Lean files import `Foundation.Modal.Hilbert.KP`, removed from the pinned Foundation; they
  were outside `lake build`'s default targets before and after the move. Only `latexExport.lean` was fixed.

## Gaps

- WSL host itself not exercised; the Linux path was checked in an `ubuntu:20.04` container.
- bib-manager's write endpoints accept unauthenticated requests, and its URL is in public repositories. Out of scope here.

## Reflexive

Friction notes are in [design.md](design.md#friction-notes); all four are `gap` (no instruction in use
stated the fact). The Lean import gap and the npm 12 pack format are recorded in this repository's
AGENTS.md through the verification table and release section; the CC Safety Net blocks are covered
by existing memory. No skill change is needed.
