# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Turn the `#print`ed definitions of a Lean file into a Typst fragment.

The fragment holds one section per definition: the formula in Typst math and
the Lean body in a code block. Include it in a chapter with `#include`.

Usage: uv run scripts/lean_to_typst.py <file.lean> [-o out.typ]
"""

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

LEAN_DIR = Path(__file__).resolve().parents[1] / "lean"

# Lean header line of a `#print`ed definition: `def Namespace.name.{u} : type :=`.
DEF_HEADER = re.compile(r"^(?:@\[[^\]]*\]\s*)?def\s+(?P<name>[^\s:]+)")
UNIVERSES = re.compile(r"\.\{[^}]*\}$")
LAMBDA_PREFIX = re.compile(r"^fun\b.*?(?:↦|=>)\s*")
# A qualified constructor (`Formula.box`, `LO.Modal.Formula.imp`) stays one token; other dots
# start a method. Notation symbols are tokens of their own, so `□p` splits into `□` and `p`.
TOKEN = re.compile(
    r"\s*(?:(?P<ctor>(?:LO\.Modal\.)?Formula\.\w+)|(?P<punct>[().□◇∼➝⋏⋎⭤])|(?P<ident>[^\s().□◇∼➝⋏⋎⭤]+))"
)

# Formula constructors written as methods (`p.box`, `p.imp q`) and their Typst math.
UNARY = {"box": "square", "dia": "diamond", "neg": "not", "not": "not"}
BINARY = {"imp": "->", "and": "and", "or": "or", "iff": "<->"}
# The same connectives in Foundation's notation, should Lean print them.
NOTATION_UNARY = {"□": "box", "◇": "dia", "∼": "neg"}
NOTATION_BINARY = {"➝": "imp", "⋏": "and", "⋎": "or", "⭤": "iff"}


class LeanParseError(ValueError):
    """The definition body is outside the supported term grammar."""


# Parsed terms: ("atom", name) | ("unary", op, term) | ("binary", op, left, right) | ("app", fn, args)
Term = tuple


class TermParser:
    """Recursive descent over `#print` bodies: atoms, parentheses, method chains, application."""

    def __init__(self, text: str) -> None:
        self.tokens: list[str] = []
        position = 0
        text = text.strip()
        while position < len(text):
            match = TOKEN.match(text, position)
            if not match or match.end() == position:
                raise LeanParseError(f"cannot tokenize at {text[position:]!r}")
            self.tokens.append(match["ctor"] or match["punct"] or match["ident"])
            position = match.end()
        self.index = 0

    def peek(self) -> str | None:
        return self.tokens[self.index] if self.index < len(self.tokens) else None

    def take(self) -> str:
        token = self.peek()
        if token is None:
            raise LeanParseError("unexpected end of term")
        self.index += 1
        return token

    def parse(self) -> Term:
        term = self.binary()
        if self.peek() is not None:
            raise LeanParseError(f"unexpected {self.peek()!r}")
        return term

    def binary(self) -> Term:
        left = self.application()
        if self.peek() in NOTATION_BINARY:
            op = NOTATION_BINARY[self.take()]
            # Foundation's connectives are right-associative.
            return ("binary", op, left, self.binary())
        return left

    def application(self) -> Term:
        head = self.postfix()
        args: list[Term] = []
        while self.peek() not in (None, ")") and self.peek() not in NOTATION_BINARY:
            args.append(self.postfix())
        return ("app", head, args) if args else head

    def postfix(self) -> Term:
        term = self.primary()
        while self.peek() == ".":
            self.take()
            method = self.take()
            if method in UNARY:
                term = ("unary", method, term)
            elif method in BINARY:
                term = ("binary", method, term, self.postfix())
            else:
                raise LeanParseError(f"unsupported method .{method}")
        return term

    def primary(self) -> Term:
        token = self.take()
        if token == "(":
            term = self.binary()
            if self.take() != ")":
                raise LeanParseError("unbalanced parentheses")
            return term
        if token in NOTATION_UNARY:
            return ("unary", NOTATION_UNARY[token], self.postfix())
        constructor = re.fullmatch(r"(?:LO\.Modal\.)?Formula\.(\w+)", token)
        if constructor and constructor[1] in UNARY:
            return ("unary", constructor[1], self.postfix())
        if constructor and constructor[1] in BINARY:
            return ("binary", constructor[1], self.postfix(), self.postfix())
        return ("atom", token)


def render(term: Term, nested: bool = False) -> str:
    kind = term[0]
    if kind == "atom":
        name = term[1]
        return name if len(name) == 1 else f'"{name}"'
    if kind == "unary":
        return f"{UNARY[term[1]]} {render(term[2], nested=True)}"
    if kind == "app":
        return f"{render(term[1], nested=True)}({', '.join(render(arg) for arg in term[2])})"
    text = f"{render(term[2], nested=True)} {BINARY[term[1]]} {render(term[3], nested=True)}"
    return f"({text})" if nested else text


def to_typst_math(body: str) -> str:
    return render(TermParser(LAMBDA_PREFIX.sub("", body.strip(), count=1)).parse())


# Section titles and glosses for definitions in lean/latexExport.lean.
DESCRIPTIONS: dict[str, tuple[str, str]] = {
    "K_axiom": ("K Axiom (Distribution)", "Necessity distributes over implication."),
    "T_axiom": ("T Axiom (Reflexivity)", "What is necessary is true."),
    "S4_axiom": ("S4 Axiom (Transitivity)", "What is necessary is necessarily necessary."),
    "S5_axiom": ("S5 Axiom (Euclidean)", "What is possible is necessarily possible."),
    "Knowledge": ("Knowledge Operator", "Knowledge is modelled as necessity."),
    "Belief": ("Belief Operator", "Belief is modelled as possibility."),
    "knowledge_implies_truth": ("Knowledge Implies Truth", "Knowledge implies truth."),
    "knowledge_closure": ("Knowledge Closure", "Knowledge is closed under implication."),
}


class LeanError(RuntimeError):
    """Lean could not elaborate the input file."""


@dataclass(frozen=True)
class Definition:
    name: str
    body: str

    @property
    def math(self) -> str:
        return to_typst_math(self.body)


def parse_definitions(lean_output: str) -> list[Definition]:
    """Collect `#print` output: a `def` header line followed by its body lines."""
    definitions: list[Definition] = []
    lines = lean_output.splitlines()
    for index, line in enumerate(lines):
        header = DEF_HEADER.match(line.strip())
        if not header:
            continue
        body_lines: list[str] = []
        for following in lines[index + 1 :]:
            if not following.strip() or DEF_HEADER.match(following.strip()):
                break
            body_lines.append(following.strip())
        if body_lines:
            name = UNIVERSES.sub("", header["name"]).split(".")[-1]
            definitions.append(Definition(name=name, body=" ".join(body_lines)))
    return definitions


def render_document(definitions: list[Definition], source: Path) -> str:
    sections = [f"// Generated by lean-to-typst from {source.name}; edit the Lean file instead.\n"]
    for definition in definitions:
        title, gloss = DESCRIPTIONS.get(
            definition.name, (definition.name.replace("_", " ").title(), "")
        )
        sections.append(
            f"""== {title}

{gloss}

$ {definition.math} $

#block(fill: luma(240), inset: 8pt, radius: 4pt)[
  ```lean
  {definition.body}
  ```
]
"""
        )
    return "\n".join(sections)


def run_lean(source: Path) -> str:
    result = subprocess.run(
        ["lake", "lean", str(source)],
        capture_output=True,
        text=True,
        cwd=LEAN_DIR,
        check=False,
    )
    if result.returncode != 0:
        raise LeanError(result.stdout + result.stderr)
    return result.stdout


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("source", type=Path, help="Lean file with #print commands")
    parser.add_argument("-o", "--output", type=Path, help="default: <source stem>.typ in the current directory")
    args = parser.parse_args()

    source = args.source.resolve()
    if not source.is_file():
        parser.error(f"file not found: {args.source}")

    try:
        definitions = parse_definitions(run_lean(source))
    except LeanError as error:
        sys.exit(f"Lean failed on {source}:\n{error}")
    if not definitions:
        sys.exit(f"no #print definitions found in {source}")

    try:
        document = render_document(definitions, source)
    except LeanParseError as error:
        sys.exit(f"cannot convert a definition in {source}: {error}")
    output = args.output or Path(f"{source.stem}.typ")
    output.write_text(document, encoding="utf-8")
    print(f"wrote {len(definitions)} definitions to {output}")


if __name__ == "__main__":
    main()
