/-
# PhD Proofs - Main Module

This is the main module file that imports and organizes all proof components
for the PhD dissertation project.

Author: PhD Dissertation Project
-/

-- Import both modules
import metaphysicalPlayground
import modalLogicDemo

-- Main namespace for the PhD proofs
namespace phdProofs

-- Version information
def version : String := "1.0.0"
def description : String := "Formal proofs for PhD dissertation in analytic philosophy"

-- Basic test to verify system is working
def test_foundation : IO Unit := do
  IO.println s!"PhD Proofs v{version}"
  IO.println s!"Description: {description}"
  IO.println "✅ All modules imported successfully!"

-- Information about the proof system
def proof_system_info : IO Unit := do
  IO.println "=== PhD Dissertation Proof System ==="
  IO.println "Available modules:"
  IO.println "  • Metaphysical Playground (形上學遊戲場) - Hyperintensional analysis"
  IO.println "  • Modal Logic Demo (模態邏輯演示) - Modal logic concepts"
  IO.println "  • General PhD Proofs - Main coordination module"
  IO.println ""
  IO.println "Run individual modules:"
  IO.println "  lake exe runMetaphysicalPlayground  # 形上學遊戲場"
  IO.println "  lake exe runModalLogicDemo          # 模態邏輯演示"
  IO.println "  lake exe runPhdProofs               # 主模組 (此文件)"

-- Run both demonstrations
def run_all_demos : IO Unit := do
  IO.println ""
  IO.println "🎭 Running All Demonstrations:"
  IO.println "=================================================="
  IO.println ""

    -- Run Modal Logic Demo
  modalLogicDemo.run_modal_demo
  IO.println ""
  IO.println "--------------------------------------------------"
  IO.println ""

  -- Run Metaphysical Playground
  metaphysicalPlayground.run_metaphysical_playground

end phdProofs

-- Main function - shows overview and available options
def main : IO Unit := do
  phdProofs.test_foundation
  IO.println ""
  phdProofs.proof_system_info
  phdProofs.run_all_demos
