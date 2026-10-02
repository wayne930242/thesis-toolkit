Status: approved
Approved at: 2026-10-02
Approved from: 「核准」(ask_user reply to the spec summary)

# Spec: thesis-toolkit on npm

Decisions: [decision.md](decision.md).

## Observable behavior

CLI `thesis-toolkit` (npm bin), run from a consumer directory such as `knowledge-base/phd-essay`:

| Command | Behavior |
|---|---|
| `compile <project> <target> [-w]` | Reads `thesis-toolkit.json` found by walking up from the cwd. Writes `<projectsDir>/<project>/src/<target>/main.pdf`; generates `<project>/references.generated.bib` holding only the entries cited under `<project>/src` and passes it as `--input bib-path=<root-relative path>`; passes `--font-path <pkg>/fonts`, `--package-path <pkg>/typst`, `--root <root>`. `-w` runs `typst watch`. |
| `compile <file.typ> [-w]` | Compiles one file to `<file>.pdf` with the same fonts and packages; root from config if found, else the file's directory. |
| `new-project <slug> "<Title>"` | Copies the article skeleton into `<projectsDir>/<slug>/` with the title filled in; refuses an existing slug or a non-kebab-case slug. |
| `link` | Symlinks `@local/ntu-thesis/<version>` into Typst's user package directory so editors resolve it; prints the font directory for editor settings. Idempotent; replaces only its own symlinks. |
| `mcp research-hub` | Ensures the pinned research-hub release binary for the platform and the pinned paper-search-mcp source are cached under `$XDG_CACHE_HOME/thesis-toolkit` (macOS: `~/Library/Caches/thesis-toolkit`), verifies the binary's SHA-256, then execs research-hub over stdio with `RSH_PAPER_SEARCH_PROJECT_DIR` set. Caller-supplied `RSH_*` variables pass through. Nothing but MCP traffic is written to stdout. |
| `--help`, `--version` | Usage and package version. |

Config `thesis-toolkit.json` (paths relative to the file):

```json
{ "root": "..", "projectsDir": "projects", "bibliography": "../literature/references/bibliography.bib" }
```

Typst package `@local/ntu-thesis:0.1.0` exposes the current `templates/ntu-modular` API unchanged (`lib.typ` entrypoint; `chapter-bib.typ`, `font-config.typ`, `layouts/*` importable by path inside the package).

### Edge cases

- Missing config, project, target, `main.typ`, or bibliography: exit non-zero naming the missing path and, for project/target, listing available names.
- A cited key absent from the bibliography: reported as a warning listing the keys; Typst then fails as it does today.
- Unsupported platform for `mcp research-hub` (anything but darwin-arm64, linux-x64): exit non-zero naming the platform. Checksum mismatch or failed download: exit non-zero, cache entry removed.
- Missing `typst` or `uv`: exit non-zero with the install URL.

## Knowledge-base after switch-over

- `phd-essay/` keeps `notes/`, `projects/thesis/` (src, prompts, notes, assets), `.agents/`, `.pi/`, `bib-manager/`, AGENTS.md, a short README; gains `package.json` (exact pin) and `thesis-toolkit.json`. Thesis imports become `@local/ntu-thesis:0.1.0`.
- Removed from knowledge-base: `compile.sh`, `fonts/`, `templates/`, `assets/`, `scripts/`, `projects/_template/`, Lean files under `projects/thesis/`, `docs/agent-system/`, `pyproject.toml`, `uv.lock`, `.python-version`, `zeabur.yaml`, submodules `literature/tools/research_hub_mcp` and `literature/tools/paper-search-mcp`.
- `.mcp.json` starts research-hub through the pinned toolkit with `RSH_DOWNLOAD_DIRECTORY=<root>/literature/downloads`; `RSH_LIBRARY_API_URL` unchanged.
- Docs and skills that name moved paths are updated: root and phd-essay AGENTS.md, literature AGENTS.md/README, `drafting-sections`, `writing-assistant`, literature skills mentioning cargo or `tools/`.

## Repositories

- `thesis-toolkit`: public; contains CLI source, `typst/`, `fonts/` (Noto only, plus `LICENSES.md`), article skeleton, `lean/` and dev scripts (not in the tarball), CI (typecheck, tests, `npm pack` content check, template compile), release workflow (trusted publishing on `v*`).
- `research_hub_mcp`: gains a release workflow building `rust-research-mcp` for darwin-arm64 and linux-x64 on `v*` tags, with SHA-256 files; first release `v0.6.7`.

## Non-goals

Windows-native support; changing research-hub or paper-search behavior; bib-manager; editor settings files (untracked, local).

## Applied standards

TypeScript rules (no `any`, named exports, `tsc --noEmit`); shell rules for dev scripts; dependency rule (latest stable Typst/Node tooling, official docs); deployment rule (tests before publish); git-safety (stage by name, no force push); knowledge-base submodule order (toolkit/research-hub first, then knowledge-base).

## Reality anchor

1. Thesis targets `thesis`, `outline`, `writing-direction` compiled via the installed package from `phd-essay`: page counts 26/16/31 and `pdftotext` output identical to `/tmp/tk-baseline`.
2. `new-project` round trip compiles, then is removed.
3. `typst compile` of a chapter-importing file with only `link` applied (no `--package-path`) succeeds.
4. `.mcp.json` research-hub started through the toolkit answers MCP `initialize` and `tools/list`, and a `search_papers` call returns results (exercises paper-search).
5. `npm pack --dry-run` lists no `lean/`, no unused fonts, no specs; tarball size reported.
6. `rg` finds no stale references to removed paths in knowledge-base.

Checkpoint: anchors 1–6 run against a locally packed tarball before the first publish; anchor 1 and 4 rerun against the published version.
