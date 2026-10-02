# Lean 4 proofs

Formal experiments for the dissertation, built on
[Foundation](https://github.com/iehality/lean4-logic) (which pulls in Mathlib).
Run everything through `scripts/lean` from the repository root. Lean is not part of the npm package.

| Path | Content |
|---|---|
| `modalLogic/basicAxioms.lean` | K, T, S4, S5 axioms |
| `modalLogicDemo.lean`, `runModalLogicDemo.lean` | Modal logic demo and its executable |
| `metaphysicalPlayground/` | Individuals, properties, and grounding experiments; see its README |
| `runMetaphysicalPlayground.lean` | Executable for the playground |
| `lewisModalRealism/` | Lewis's modal realism and a check against Foundation |
| `metaphysicalDDD/` | Metaphysical system model |
| `examples/` | Modal and philosophical application examples |
| `latexExport.lean` | `#print`ed definitions for `scripts/lean_to_typst.py` |
| `phdProofs.lean`, `simpleTest.lean`, `testBasic.lean` | Scratch files |

```bash
scripts/lean build                 # fetch the Mathlib cache, then lake build
scripts/lean check examples/modalExamples.lean
scripts/lean run modal             # or: metaphysical, or any name from scripts/lean list
scripts/lean stats                 # theorems, definitions, examples, and sorry per file
uv run scripts/lean_to_typst.py lean/latexExport.lean -o latex-export.typ
```
