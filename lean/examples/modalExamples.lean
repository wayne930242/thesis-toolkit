/-
# Modal Logic Examples

This file contains practical examples of modal logic proofs,
demonstrating philosophical applications and common reasoning patterns.

Author: PhD Dissertation Project
-/

import Foundation.Modal.Hilbert.KP

namespace ModalLogic.Examples

open LO.Modal.Hilbert
open LO.Modal

variable {α : Type*} [DecidableEq α] [Inhabited α]

-- Example 1: Basic formula construction
def example_formula : Formula α := Formula.atom (default : α)
def example_box_formula : Formula α := Formula.box example_formula
def example_dia_formula : Formula α := Formula.dia example_formula

-- Example 2: Basic axiom schemas (defined locally)
def K_axiom_schema (p q : Formula α) : Formula α :=
  (Formula.box (p.imp q)).imp ((Formula.box p).imp (Formula.box q))

def T_axiom_schema (p : Formula α) : Formula α :=
  (Formula.box p).imp p

-- Example 3: Philosophical applications - Knowledge and belief
def Knowledge (p : Formula α) : Formula α := Formula.box p  -- Simplified model
def Belief (p : Formula α) : Formula α := Formula.dia p     -- Simplified model

-- Example 4: Modal reasoning about identity
def self_identity (a : α) : Formula α :=
  (Formula.atom a).imp (Formula.atom a)

-- Example 5: Temporal interpretation
def Always (p : Formula α) : Formula α := Formula.box p
def Eventually (p : Formula α) : Formula α := Formula.dia p

-- Example 6: Deontic logic interpretation
def Obligatory (p : Formula α) : Formula α := Formula.box p
def Permitted (p : Formula α) : Formula α := Formula.dia p

-- Type checking examples
#check example_formula
#check example_box_formula
#check Knowledge
#check Always
#check Obligatory

-- Verification that our modal schemas are well-formed
#check K_axiom_schema
#check T_axiom_schema

end ModalLogic.Examples
