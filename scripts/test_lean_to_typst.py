"""Run with: python3 -m unittest scripts/test_lean_to_typst.py"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from lean_to_typst import LeanParseError, parse_definitions, to_typst_math  # noqa: E402

# `#print` output from lean/latexExport.lean with Foundation 9f3bca0.
PRINT_OUTPUT = """def LaTeXExport.K_axiom.{u_1} : {α : Type u_1} → Formula α → Formula α → Formula α :=
fun {α} p q ↦ (p.imp q).box.imp (p.box.imp q.box)
def LaTeXExport.Knowledge.{u_1} : {α : Type u_1} → Formula α → Formula α :=
fun {α} p ↦ p.box
"""


class ToTypstMathTest(unittest.TestCase):
    def test_method_chains(self) -> None:
        self.assertEqual(
            to_typst_math("fun {α} p q ↦ (p.imp q).box.imp (p.box.imp q.box)"),
            "square (p -> q) -> (square p -> square q)",
        )

    def test_application_and_constructors(self) -> None:
        self.assertEqual(to_typst_math("fun {α} p ↦ (Knowledge p).imp p"), '"Knowledge"(p) -> p')
        self.assertEqual(to_typst_math("fun {α} p q ↦ LO.Modal.Formula.imp (Formula.box p) q"), "square p -> q")

    def test_notation(self) -> None:
        self.assertEqual(to_typst_math("fun {α} p ↦ □p ➝ □□p"), "square p -> square square p")
        self.assertEqual(to_typst_math("fun {α} p ↦ ∼p ⋏ ◇p"), "not p and diamond p")

    def test_unsupported_method(self) -> None:
        with self.assertRaises(LeanParseError):
            to_typst_math("fun {α} p ↦ p.subst q")


class ParseDefinitionsTest(unittest.TestCase):
    def test_print_output(self) -> None:
        definitions = parse_definitions(PRINT_OUTPUT)
        self.assertEqual([d.name for d in definitions], ["K_axiom", "Knowledge"])
        self.assertEqual(definitions[1].math, "square p")


if __name__ == "__main__":
    unittest.main()
