/-
# Run Modal Logic Demo - 運行模態邏輯演示

Entry point for running the modal logic demonstration independently.
-/

import modalLogicDemo

-- Main function that just runs the modal logic demo
def main : IO Unit := do
  modalLogicDemo.run_modal_demo
