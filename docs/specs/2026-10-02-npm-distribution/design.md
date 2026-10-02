# Design: thesis-toolkit on npm

Spec: [spec.md](spec.md). Decisions: [decision.md](decision.md).

## Approach

- **CLI** (`src/cli.ts` → `dist/cli.js`): TypeScript built with `tsc` (TS 7), ESM, Node ≥ 20, no
  runtime dependencies. Commands live in `src/commands/`; shared seams are `config.ts` (find and
  validate `thesis-toolkit.json`), `bibliography.ts` (cited-key subset, a port of
  `literature/scripts/subset_bib.py` with identical key and entry semantics), `typst.ts` (version
  check, `@local` package tree, `typst compile|watch`), and `paths.ts` (package, cache, and Typst
  user package directories). Domain errors in `errors.ts` print without stack traces.
- **Typst package**: `templates/ntu-thesis/` with `typst.toml` (`@local/ntu-thesis`). `compile`
  symlinks it into `<cache>/typst-packages/local/ntu-thesis/<version>` and passes `--package-path`;
  `link` places the same symlink in Typst's user package directory for editors. Links are created
  under a temp name and renamed, and a non-symlink at the destination is never replaced.
- **Bibliography path seam**: Typst 0.15 resolves `path(...)` and path strings in the file that
  calls them, so a package cannot open a project file from a string. `chapter-bib(source, main:)`
  takes the source from the project; the thesis builds it once in `src/thesis/bib.typ`.
- **MCP launcher**: `mcp research-hub` downloads `rust-research-mcp-<target>` from the pinned
  research_hub_mcp release, checks it against the SHA-256 pinned in `src/commands/mcp.ts`, caches
  the pinned paper-search-mcp tarball, sets `RSH_PAPER_SEARCH_PROJECT_DIR`, and execs with inherited
  stdio. Progress goes to stderr.
- **research_hub_mcp release**: reqwest uses rustls only (`default-features = false`), so the Linux
  build targets `x86_64-unknown-linux-musl` and runs on old WSL images; `release.yml` publishes
  binaries plus `.sha256` on `v*` tags.

## Precedent

`pi-roundtable-mcp` for SHA-pinned Actions, CI-gated trusted publishing, and a manual first publish.

## Risks

- TLS backend change in research-hub (native-tls → rustls with webpki roots). Mitigated by the full
  `cargo test` suite and a live `search_papers` call.
- The npm tarball carries ~24 MB of fonts; only the two Noto families the template uses ship.
- `link` points into `phd-essay/node_modules`; rerun it after `npm install` of a new version.

## Friction Notes

- Tried: running `lean_to_typst` on `lean/latexExport.lean` with `lake env lean`.
  Found: the file imports `Foundation.Modal.Hilbert.KP`, which the pinned Foundation no longer has,
  and `lake env lean` does not build imports outside the default targets; switched to `lake lean`
  and fixed that one import. Four other proof files import the same missing module.
  Led by: none
- Tried: the regex symbol substitution in the original converter on real `#print` output.
  Found: Lean prints postfix method chains (`(p.imp q).box`), which substitution cannot reorder;
  replaced it with a small term parser.
  Led by: none
- Tried: deleting untracked build leftovers with `rm -rf` and `git clean -fdX`.
  Found: CC Safety Net blocks both; leftovers are reported to the owner instead.
  Led by: none
- Tried: building research-hub for Linux on GitHub's Ubuntu runner as-is.
  Found: reqwest's default `native-tls` links OpenSSL dynamically, so the binary would need glibc
  2.35 and libssl3, absent on Ubuntu 20.04 WSL.
  Led by: none
