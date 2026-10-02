# 形上學遊戲場 (Metaphysical Playground)

A codifiable framework for testing hyperintensional philosophical distinctions in Lean 4.

## 概述

形上學遊戲場是一個用 Lean 4 實現的可編程哲學工具，專門用於分析超內涵性（hyperintensional）哲學問題。它將抽象的形上學概念轉化為可操作、可驗證的程式模組。

## 文件結構

```
metaphysical-playground/
├── MetaphysicalPlayground.lean  # 核心實現
├── TestPlayground.lean          # 測試和演示
└── README.md                    # 此說明文檔
```

## 核心功能

### 1. 本質 vs. 模態區分 (Kit Fine's Case)
- 實現個體本質的正式定義
- 區分必然真理與本質歸屬
- 驗證「蘇格拉底屬於{蘇格拉底}」案例

### 2. 解釋關係的方向性
- 建模不同類型的解釋關係
- 量化解釋力強度
- 證明解釋的非對稱性

### 3. 超內涵分析框架
- 統一的分析結構
- 多維度的哲學區分
- 可驗證的理論定理

## 如何運行

### 從主項目運行
```bash
# 在 toolkit 根目錄
scripts/lean run runMetaphysicalPlayground
```

### 獨立測試（需要配置）
```bash
# 在 metaphysical-playground 目錄中
# 需要先設置獨立的 lake 項目
lake exe TestPlayground
```

### 編譯檢查
```bash
# 在 toolkit 根目錄
scripts/lean build
```

## 代碼結構

### 核心型別
- `Individual`: 哲學個體（蘇格拉底、柏拉圖等）
- `BasicProperty`: 基本屬性（理性、動物、必朽等）
- `ExplanationType`: 解釋類型（循環、真正、還原性等）

### 主要函數
- `essence`: 定義個體的本質屬性
- `isEssential`: 檢查屬性是否為本質
- `explanatory_strength`: 計算解釋力強度
- `hyperintensional_distinction_test`: 驗證超內涵區分

### 形式定理
- `socrates_essentially_rational`: 理性是蘇格拉底的本質
- `socrates_membership_not_essential`: 成員關係不是蘇格拉底的本質
- `hyperintensional_distinction_proven`: 超內涵區分成立
- `explanation_strength_ordering`: 解釋力排序

## 預期輸出

運行後你會看到類似這樣的輸出：

```
=== 形上學遊戲場 (Metaphysical Playground) ===

📚 Kit Fine's Essence vs. Modality Case:
Essential properties of Socrates: [BasicProperty.rational, BasicProperty.animal, BasicProperty.mortal]
Is rationality essential to Socrates? true
Is membership essential to Socrates? false

🔄 Explanation Direction Case:
Circular explanation strength: 0
Genuine explanation strength: 5
Reductive explanation strength: 8
Explanation hierarchy holds: true

🎯 Hyperintensional Analysis:
Socrates membership analysis: { statement := "Socrates belongs to {Socrates}", modal_necessary := true, essential_to_subject := false, grounded_in_essence := false, explanation_type := "set-theoretic" }
Socrates rationality analysis: { statement := "Socrates is rational", modal_necessary := true, essential_to_subject := true, grounded_in_essence := true, explanation_type := "essential" }
Hyperintensional distinction verified: true

✅ All philosophical distinctions successfully codified!
```

## 理論意義

這個實現展示了：

1. **可編程的哲學**：抽象概念可以被精確建模
2. **可驗證的論證**：哲學論證可以被形式化證明
3. **超內涵的處理**：標準邏輯無法區分的概念可以被精細分析
4. **跨領域應用**：框架可以擴展到其他哲學問題

## 擴展性

這個框架可以進一步擴展來處理：
- 更複雜的模態邏輯
- 不可能世界語義學
- 其他超內涵案例
- 科學哲學應用
- 倫理學問題

## 依賴項目

- Lean 4
- FormalizedFormalLogic Foundation library
- Mathlib (通過主項目的 lakefile.toml)

## 與主項目的整合

這個模組被整合到主 PhD 項目中：
- 從 `PhDProofs.lean` 導入
- 可以通過主項目的可執行文件運行
- 共享依賴項目和配置 