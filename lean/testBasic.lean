/-
# Basic Test for Foundation Library

This file tests if the Foundation library is properly accessible.
-/

import Foundation.Modal.Hilbert.KP

namespace TestBasic

open LO.Modal.Hilbert

-- Test basic formula construction
def test_formula : LO.Modal.Formula String := LO.Modal.Formula.atom "p"
def test_box_formula : LO.Modal.Formula String := LO.Modal.Formula.box (LO.Modal.Formula.atom "p")

-- Test that we can check types
#check test_formula
#check test_box_formula

-- Simple test
example : LO.Modal.Formula String := LO.Modal.Formula.atom "test"

end TestBasic
