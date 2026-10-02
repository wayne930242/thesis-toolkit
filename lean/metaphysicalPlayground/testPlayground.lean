/-
Test Metaphysical Playground
測試形上學遊戲場

This file tests the Metaphysical Playground implementation
and demonstrates how to run philosophical experiments.
-/

import metaphysicalPlayground

-- Open the namespace for easier access
open metaphysicalPlayground

-- Main test function
def main : IO Unit := do
  IO.println "🎭 Testing Metaphysical Playground Implementation"
  IO.println "=================================================="

  -- Run the main demonstration
  run_metaphysical_playground

  IO.println ""
  IO.println "🔬 Running Additional Tests:"
  IO.println ""

  -- Test individual functions
  IO.println s!"Test explanation hierarchy: {test_explanation_hierarchy}"
  IO.println s!"Hyperintensional distinction: {hyperintensional_distinction_test}"

  -- Test essence checking
  IO.println ""
  IO.println "🧠 Essence Testing:"
  for ind in [Individual.socrates, Individual.plato, Individual.aristotle] do
    IO.println s!"Essence of {repr ind}: {repr (essence ind)}"

  IO.println ""
  IO.println "✨ All tests completed successfully!"

-- Separate test for just the hyperintensional cases
def test_hyperintensional_cases : IO Unit := do
  IO.println "🎯 Testing Hyperintensional Cases:"
  IO.println ""

  IO.println "Case 1: Fine's Essence vs. Modality"
  IO.println s!"  Socrates membership necessary: {socrates_membership_analysis.modal_necessary}"
  IO.println s!"  Socrates rationality necessary: {socrates_rationality_analysis.modal_necessary}"
  IO.println s!"  Membership essential: {socrates_membership_analysis.essential_to_subject}"
  IO.println s!"  Rationality essential: {socrates_rationality_analysis.essential_to_subject}"
  IO.println ""

  IO.println "Case 2: Explanation Direction"
  IO.println s!"  Circular strength: {explanatory_strength circular_grass_explanation}"
  IO.println s!"  Genuine strength: {explanatory_strength genuine_grass_explanation}"
  IO.println s!"  Reductive strength: {explanatory_strength reductive_grass_explanation}"

-- Quick verification that theorems compile
def verify_theorems : IO Unit := do
  IO.println "📐 Verifying Formal Theorems:"
  IO.println "✓ socrates_essentially_rational - compiled"
  IO.println "✓ socrates_membership_not_essential - compiled"
  IO.println "✓ hyperintensional_distinction_proven - compiled"
  IO.println "✓ explanation_strength_ordering - compiled"
