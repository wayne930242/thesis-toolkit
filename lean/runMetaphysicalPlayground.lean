/-
# Run Metaphysical Playground - 運行形上學遊戲場

Entry point for running the metaphysical playground independently.
-/

import metaphysicalPlayground

-- Main function that just runs the metaphysical playground
def main : IO Unit := do
  metaphysicalPlayground.run_metaphysical_playground
