# thesis-toolkit

npm package `thesis-toolkit`: Typst templates, fonts, the `thesis-toolkit` CLI (TypeScript in
`src/`, built to `dist/`), and the research-hub MCP launcher. Consumers keep their writing in their
own repository and call the CLI through `npx`. Read [README.md](README.md) for the commands and
[docs/specs/](docs/specs/) for design decisions.

## Rules

- Documents compile through `thesis-toolkit compile`, never `typst compile` directly: it supplies the
  fonts, `--package-path`, the configured `--root`, and the bibliography subset.
- `templates/ntu-thesis/typst.toml` versions the Typst package independently of `package.json`.
  Bump it only for template changes, and tell consumers to update their `@local/ntu-thesis:<v>` imports.
- A path string inside the package resolves against the package root. Anything that must resolve in
  the consumer's project is passed in as a `path(...)` created there.
- Pins live in `src/commands/mcp.ts`: research-hub version plus per-platform SHA-256, and the
  paper-search-mcp commit. Update the checksums from the release's `.sha256` assets when bumping.
- Lean proofs (`lean/`) and `scripts/` are repository-only. Never end a turn while a Lean build
  runs; it fetches Mathlib and takes several minutes.
- TypeScript: named exports, no `any`, domain errors from `src/errors.ts`. Shell:
  `#!/usr/bin/env bash` with `set -euo pipefail`. Python: type hints.

## Verification

| Change | Check |
|---|---|
| `src/**`, `test/**` | `npm run typecheck && npm test` |
| `templates/**`, `fonts/**` | `npm run build`, then `node dist/cli.js compile templates/ntu-thesis/example.typ` and each affected consumer target |
| `src/commands/mcp.ts` | `node dist/cli.js mcp research-hub` answers MCP `initialize` and `tools/list` |
| `package.json` `files` | `npm pack --dry-run` lists no `lean/`, `docs/`, `scripts/`, or PDFs |
| `lean/**`, `scripts/**` | `scripts/lean build`; `uv run scripts/lean_to_typst.py lean/latexExport.lean -o /tmp/out.typ` |

## Release

CI (`.github/workflows/ci.yml`) runs typecheck, tests, the template compile, and the pack check.
Pushing a `v*` tag whose version matches `package.json` publishes through npm trusted publishing
(`.github/workflows/publish.yml`). Check that the CI run of the tagged commit is green as well.
