/-
# LaTeX Export Example

This file demonstrates how to format Lean definitions and axioms
for LaTeX output in academic papers.
-/

import Foundation.Modal.Formula

namespace LaTeXExport

open LO.Modal

variable {α : Type*}

-- Basic modal axiom schemas for LaTeX documentation
def K_axiom (p q : Formula α) : Formula α :=
  (Formula.box (p.imp q)).imp ((Formula.box p).imp (Formula.box q))

def T_axiom (p : Formula α) : Formula α :=
  (Formula.box p).imp p

def S4_axiom (p : Formula α) : Formula α :=
  (Formula.box p).imp (Formula.box (Formula.box p))

def S5_axiom (p : Formula α) : Formula α :=
  (Formula.dia p).imp (Formula.box (Formula.dia p))

-- Philosophical interpretations
def Knowledge (p : Formula α) : Formula α := Formula.box p
def Belief (p : Formula α) : Formula α := Formula.dia p
def Possible (p : Formula α) : Formula α := Formula.dia p
def Necessary (p : Formula α) : Formula α := Formula.box p

-- Example formulas for papers
def knowledge_implies_truth (p : Formula α) : Formula α :=
  (Knowledge p).imp p

def knowledge_closure (p q : Formula α) : Formula α :=
  (Knowledge (p.imp q)).imp ((Knowledge p).imp (Knowledge q))

-- Display information for LaTeX generation
#check K_axiom
#check T_axiom
#check S4_axiom
#check S5_axiom
#check Knowledge
#check Belief
#check knowledge_implies_truth
#check knowledge_closure

-- Print the actual definitions
#print K_axiom
#print T_axiom
#print Knowledge
#print knowledge_implies_truth

end LaTeXExport
