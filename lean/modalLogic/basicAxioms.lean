/-
# Modal Logic Basic Axioms

This file contains basic definitions and structure for modal logic axioms.
We use Foundation library for formal verification.

Author: PhD Dissertation Project
-/

import Foundation.Modal.Hilbert.KP

namespace ModalLogic.BasicAxioms

open LO.Modal.Hilbert
open LO.Modal

variable {α : Type*} [DecidableEq α] [Inhabited α]

-- Basic formula examples
def example_atom : Formula α := Formula.atom (default : α)
def example_box : Formula α := Formula.box example_atom
def example_dia : Formula α := Formula.dia example_atom

-- Type checks to verify Foundation is working
#check Formula α
#check LO.Modal.Hilbert α
#check Deduction

-- Basic modal logic properties (to be proven later)
section ModalProperties

variable (H : LO.Modal.Hilbert α)

-- K axiom schema: □(p → q) → (□p → □q)
def K_axiom_schema (p q : Formula α) : Formula α :=
  (Formula.box (p.imp q)).imp ((Formula.box p).imp (Formula.box q))

-- T axiom schema: □p → p
def T_axiom_schema (p : Formula α) : Formula α :=
  (Formula.box p).imp p

-- S4 axiom schema: □p → □□p
def S4_axiom_schema (p : Formula α) : Formula α :=
  (Formula.box p).imp (Formula.box (Formula.box p))

-- S5 axiom schema: ◇p → □◇p
def S5_axiom_schema (p : Formula α) : Formula α :=
  (Formula.dia p).imp (Formula.box (Formula.dia p))

end ModalProperties

-- Verification that our definitions are well-formed
#check K_axiom_schema
#check T_axiom_schema
#check S4_axiom_schema
#check S5_axiom_schema

end ModalLogic.BasicAxioms
