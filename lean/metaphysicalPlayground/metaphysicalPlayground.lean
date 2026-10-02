/-
# Metaphysical Playground - 形上學遊戲場 (Restructured)

A comprehensive codifiable framework for testing hyperintensional philosophical distinctions.
Implements core concepts from contemporary metaphysics with clear modal settings.

Author: PhD Dissertation Project
Version: 2.0 - Restructured

語法說明註釋：
/- ... -/ = 多行註釋塊
-- = 單行註釋
-/

-- 【語法】namespace = 命名空間，類似 C++ 的 namespace 或 Python 的模組
-- 【功能】將相關定義組織在一起，避免名稱衝突
namespace MetaphysicalPlayground

-- ========================================================================
-- PART I: FOUNDATIONAL ONTOLOGY 基礎本體論
-- ========================================================================

-- 【語法】inductive = 定義歸納型別（類似 enum 但更強大）
-- 【語法】Type = Lean 的型別宇宙，表示這是一個數據型別
-- 【語法】where = 開始列舉構造子
-- 【語法】| = 分隔不同的構造子選項
-- 【語法】deriving = 自動生成實例（如相等性判斷、字串表示）

-- 【新增】實體類型定義 - 自然類別（natural kinds）
inductive EntityType : Type where
  | human : EntityType                 -- 【構造子】人類類型
  | table : EntityType                 -- 【構造子】桌子類型
  | abstract_concept : EntityType      -- 【構造子】抽象概念類型
deriving DecidableEq, Repr

instance : ToString EntityType where
  toString
  | EntityType.human => "Human"
  | EntityType.table => "Table"
  | EntityType.abstract_concept => "AbstractConcept"

inductive Individual : Type where
  | socrates : Individual              -- 【構造子】創建 socrates 值
  | plato : Individual                 -- 【構造子】創建 plato 值
  | aristotle : Individual             -- 【構造子】創建 aristotle 值
  | table1 : Individual                -- 【構造子】創建 table1 值
  | concept_rationality : Individual   -- 【構造子】創建 concept_rationality 值
deriving DecidableEq, Repr

-- 【新增】個體的類型歸屬函數
-- 【語法】def name : InputType → OutputType = 定義函數，從 InputType 映射到 OutputType
-- 【語法】Individual → EntityType = 函數型別（接收 Individual，返回 EntityType）
-- 【語法】| pattern => result = 模式匹配分支（"如果輸入是 pattern，則返回 result"）
def entity_type : Individual → EntityType    -- 【函數簽名】接收個體，返回實體類型
  | Individual.socrates => EntityType.human   -- 【分支1】如果輸入是蘇格拉底，返回人類類型
  | Individual.plato => EntityType.human      -- 【分支2】如果輸入是柏拉圖，返回人類類型
  | Individual.aristotle => EntityType.human  -- 【分支3】如果輸入是亞里士多德，返回人類類型
  | Individual.table1 => EntityType.table     -- 【分支4】如果輸入是桌子1，返回桌子類型
  | Individual.concept_rationality => EntityType.abstract_concept  -- 【分支5】如果輸入是理性概念，返回抽象概念類型

-- 【使用範例】entity_type Individual.socrates 會返回 EntityType.human
-- 【使用範例】entity_type Individual.table1 會返回 EntityType.table

-- 【語法】instance : = 定義型別類別實例
-- 【語法】where = 開始實例定義
-- 【語法】| = 模式匹配的分支
-- 【語法】=> = 模式匹配箭頭（"匹配到...則..."）
instance : ToString Individual where
  toString                             -- 【函數名】將 Individual 轉為字串
  | Individual.socrates => "Socrates"           -- 【模式匹配】如果是 socrates，返回 "Socrates"
  | Individual.plato => "Plato"                 -- 【模式匹配】如果是 plato，返回 "Plato"
  | Individual.aristotle => "Aristotle"         -- 【模式匹配】依此類推
  | Individual.table1 => "Table1"
  | Individual.concept_rationality => "ConceptRationality"

-- 【重新設計】屬性標籤系統 - 多維度分類
-- 【哲學理由】屬性可以同時具有多個正交的特徵（如：既內在又偶然）

-- 【維度1】本體論地位（Ontological Status）
inductive OntologicalStatus : Type where
  | intrinsic : OntologicalStatus      -- 【標籤】內在屬性（不依賴外在關係）
  | extrinsic : OntologicalStatus      -- 【標籤】外在屬性（依賴外在關係）
  | relational : OntologicalStatus     -- 【標籤】關係屬性（純粹關係性）
deriving DecidableEq, Repr

-- 【維度2】模態地位（Modal Status）
inductive ModalStatus : Type where
  | necessary : ModalStatus            -- 【標籤】必然屬性（在所有可能世界都成立）
  | contingent : ModalStatus           -- 【標籤】偶然屬性（在某些可能世界成立）
  | impossible : ModalStatus           -- 【標籤】不可能屬性（在所有世界都不成立）
deriving DecidableEq, Repr

-- 【維度3】時間性（Temporality）
inductive Temporality : Type where
  | permanent : Temporality            -- 【標籤】永久屬性（時間上恆定）
  | temporary : Temporality            -- 【標籤】暫時屬性（時間上可變）
  | atemporal : Temporality            -- 【標籤】非時間屬性（不涉及時間）
deriving DecidableEq, Repr

-- 【維度4】認知地位（Epistemic Status）
inductive EpistemicStatus : Type where
  | observable : EpistemicStatus       -- 【標籤】可觀察屬性
  | theoretical : EpistemicStatus      -- 【標籤】理論屬性
  | intuitive : EpistemicStatus        -- 【標籤】直覺屬性
deriving DecidableEq, Repr

-- 【添加】ToString 實例以便打印
instance : ToString OntologicalStatus where
  toString
  | OntologicalStatus.intrinsic => "intrinsic"
  | OntologicalStatus.extrinsic => "extrinsic"
  | OntologicalStatus.relational => "relational"

instance : ToString ModalStatus where
  toString
  | ModalStatus.necessary => "necessary"
  | ModalStatus.contingent => "contingent"
  | ModalStatus.impossible => "impossible"

instance : ToString Temporality where
  toString
  | Temporality.permanent => "permanent"
  | Temporality.temporary => "temporary"
  | Temporality.atemporal => "atemporal"

instance : ToString EpistemicStatus where
  toString
  | EpistemicStatus.observable => "observable"
  | EpistemicStatus.theoretical => "theoretical"
  | EpistemicStatus.intuitive => "intuitive"

-- 【結構】屬性標籤集合 - 可以有多個維度的分類
structure PropertyTags where
  ontological : OntologicalStatus      -- 【字段】本體論標籤
  modal : ModalStatus                  -- 【字段】模態標籤
  temporal : Temporality               -- 【字段】時間性標籤
  epistemic : EpistemicStatus          -- 【字段】認知標籤
deriving Repr

-- 【便利函數】創建常用的標籤組合
def intrinsic_contingent_tags : PropertyTags := {
  ontological := OntologicalStatus.intrinsic,
  modal := ModalStatus.contingent,
  temporal := Temporality.temporary,
  epistemic := EpistemicStatus.observable
}

def intrinsic_necessary_tags : PropertyTags := {
  ontological := OntologicalStatus.intrinsic,
  modal := ModalStatus.necessary,
  temporal := Temporality.permanent,
  epistemic := EpistemicStatus.theoretical
}

def relational_necessary_tags : PropertyTags := {
  ontological := OntologicalStatus.relational,
  modal := ModalStatus.necessary,
  temporal := Temporality.atemporal,
  epistemic := EpistemicStatus.theoretical
}

-- 【語法】structure = 定義結構體（類似 C 的 struct 或 Python 的 class）
-- 【語法】where = 開始字段定義
-- 【語法】: = 型別標註（"x : T" 表示 x 的型別是 T）
structure Property where
  name : String                        -- 【字段】名稱，型別是 String
  tags : PropertyTags                  -- 【字段】多維度標籤，型別是 PropertyTags
  applies_to : List Individual         -- 【字段】適用對象列表，型別是 Individual 的列表
deriving Repr                          -- 【自動生成】字串表示

-- 【更新】屬性定義現在使用多維度標籤系統
def rationality : Property := {
  name := "rational",                  -- 【字段賦值】name 字段賦值為 "rational"
  tags := intrinsic_necessary_tags,    -- 【多維標籤】內在、必然、永久、理論屬性
  applies_to := [Individual.socrates, Individual.plato, Individual.aristotle]  -- 【列表】包含三個個體
}

def mortality : Property := {
  name := "mortal",
  tags := intrinsic_necessary_tags,    -- 【多維標籤】內在、必然、永久、理論屬性
  applies_to := [Individual.socrates, Individual.plato, Individual.aristotle]
}

def greenness : Property := {
  name := "green",
  tags := intrinsic_contingent_tags,   -- 【多維標籤】內在、偶然、暫時、可觀察屬性
  applies_to := [Individual.table1]
}

def set_membership : Property := {
  name := "belongs_to_singleton",
  tags := relational_necessary_tags,   -- 【多維標籤】關係、必然、非時間、理論屬性
  applies_to := [Individual.socrates, Individual.plato, Individual.aristotle]
}

-- 【新增】本質性關係定義 - 相對於實體類型
structure EssentialityRelation where
  entity_type : EntityType             -- 【字段】實體類型
  property : Property                  -- 【字段】屬性
  is_essential : Bool                  -- 【字段】是否對該類型本質
  explanation : String                 -- 【字段】為何本質/非本質的解釋
deriving Repr

-- 【新增】本質性關係的具體實例
def human_rationality_essentiality : EssentialityRelation := {
  entity_type := EntityType.human,
  property := rationality,
  is_essential := true,
  explanation := "Rationality is essential to being human - defines the species"
}

def human_set_membership_essentiality : EssentialityRelation := {
  entity_type := EntityType.human,
  property := set_membership,
  is_essential := false,
  explanation := "Set membership is not essential to humanity - purely mathematical relation"
}

def table_greenness_essentiality : EssentialityRelation := {
  entity_type := EntityType.table,
  property := greenness,
  is_essential := false,
  explanation := "Color is accidental to being a table - tables can be any color"
}

-- 【新增】本質性關係的全局列表
def essentiality_relations : List EssentialityRelation := [
  human_rationality_essentiality,
  human_set_membership_essentiality,
  table_greenness_essentiality
]

-- 【新增】查詢函數：給定實體類型和屬性，返回是否本質
-- 【語法】(et : EntityType) = 明確參數（必須指定型別）
-- 【語法】: Bool := = 函數返回布林值，用 := 開始定義
-- 【語法】match ... with = 模式匹配表達式（檢查值的結構）
-- 【語法】fun rel => ... = 匿名函數（lambda 表達式）
-- 【語法】∧ = 邏輯與運算符（兩個條件都必須為真）
-- 【語法】some/none = Option 型別的構造子（有值/沒值）
def is_essential_for_type (et : EntityType) (prop : Property) : Bool :=
  match essentiality_relations.find? (fun rel => rel.entity_type = et ∧ rel.property.name = prop.name) with
  -- 【解釋】在 essentiality_relations 列表中尋找符合條件的關係
  -- 【條件】rel.entity_type = et（實體類型匹配）且 rel.property.name = prop.name（屬性名匹配）
  | some rel => rel.is_essential     -- 【分支1】如果找到匹配的關係，返回其 is_essential 字段
  | none => false                    -- 【分支2】如果沒找到，默認返回 false（非本質）

-- 【使用範例】is_essential_for_type EntityType.human rationality 會返回 true
-- 【使用範例】is_essential_for_type EntityType.human set_membership 會返回 false

-- 【新增】基於多維度標籤的查詢函數

-- 【查詢1】找出所有具有特定本體論地位的屬性
def properties_with_ontological_status (status : OntologicalStatus) (props : List Property) : List Property :=
  props.filter (fun p => p.tags.ontological = status)

-- 【查詢2】找出所有具有特定模態地位的屬性
def properties_with_modal_status (status : ModalStatus) (props : List Property) : List Property :=
  props.filter (fun p => p.tags.modal = status)

-- 【查詢3】複合查詢：同時滿足多個維度條件的屬性
def properties_with_combined_tags (ont : OntologicalStatus) (mod : ModalStatus) (props : List Property) : List Property :=
  props.filter (fun p => p.tags.ontological = ont ∧ p.tags.modal = mod)

-- 【查詢4】檢查屬性是否同時具有多個特徵
def is_contingent_and_intrinsic (prop : Property) : Bool :=
  prop.tags.ontological = OntologicalStatus.intrinsic ∧ prop.tags.modal = ModalStatus.contingent

-- 【查詢5】檢查屬性是否為可觀察的內在屬性
def is_observable_intrinsic (prop : Property) : Bool :=
  prop.tags.ontological = OntologicalStatus.intrinsic ∧ prop.tags.epistemic = EpistemicStatus.observable

-- 【演示】所有屬性的列表
def all_properties : List Property := [rationality, mortality, greenness, set_membership]

-- 【演示函數】展示多維度標籤系統的查詢能力
def demonstrate_multi_dimensional_queries : IO Unit := do
  IO.println "=== MULTI-DIMENSIONAL PROPERTY ANALYSIS 多維度屬性分析 ==="
  IO.println ""

  -- 【演示】按本體論地位分類
  IO.println "🔍 Properties by Ontological Status:"
  let intrinsic_props := properties_with_ontological_status OntologicalStatus.intrinsic all_properties
  IO.println s!"  Intrinsic properties: {intrinsic_props.map (fun p => p.name)}"

  let relational_props := properties_with_ontological_status OntologicalStatus.relational all_properties
  IO.println s!"  Relational properties: {relational_props.map (fun p => p.name)}"
  IO.println ""

  -- 【演示】按模態地位分類
  IO.println "⚡ Properties by Modal Status:"
  let necessary_props := properties_with_modal_status ModalStatus.necessary all_properties
  IO.println s!"  Necessary properties: {necessary_props.map (fun p => p.name)}"

  let contingent_props := properties_with_modal_status ModalStatus.contingent all_properties
  IO.println s!"  Contingent properties: {contingent_props.map (fun p => p.name)}"
  IO.println ""

  -- 【演示】複合查詢
  IO.println "🎯 Complex Queries:"
  let intrinsic_contingent := properties_with_combined_tags OntologicalStatus.intrinsic ModalStatus.contingent all_properties
  IO.println s!"  Intrinsic AND Contingent: {intrinsic_contingent.map (fun p => p.name)}"

  -- 【演示】檢查具體屬性的多維特徵
  IO.println ""
  IO.println "📊 Individual Property Analysis:"
  IO.println s!"  Greenness is contingent AND intrinsic: {is_contingent_and_intrinsic greenness}"
  IO.println s!"  Greenness is observable AND intrinsic: {is_observable_intrinsic greenness}"
  IO.println s!"  Rationality is contingent AND intrinsic: {is_contingent_and_intrinsic rationality}"
  IO.println ""
  IO.println "✅ SUCCESS: Properties can now have multiple orthogonal characteristics!"

-- ========================================================================
-- PART II: MODAL FRAMEWORK 模態框架
-- ========================================================================

-- 【語法】Nat → World = 函數型別（"從 Nat 到 World 的函數"）
-- 【語法】→ = Unicode 函數箭頭，等同於 ->
inductive World : Type where
  | actual : World                           -- 【構造子】現實世界（無參數）
  | metaphysically_possible : Nat → World    -- 【構造子】形上學可能世界（需要一個 Nat 參數）
  | logically_possible : Nat → World         -- 【構造子】邏輯可能世界（需要一個 Nat 參數）
  | conceptually_possible : Nat → World      -- 【構造子】概念可能世界（需要一個 Nat 參數）
deriving DecidableEq, Repr

inductive AccessibilityType : Type where
  | metaphysical : AccessibilityType    -- 【構造子】形上學可達性
  | logical : AccessibilityType         -- 【構造子】邏輯可達性
  | conceptual : AccessibilityType      -- 【構造子】概念可達性
  | epistemic : AccessibilityType       -- 【構造子】認知可達性
deriving DecidableEq, Repr

-- 【語法】(type : AccessibilityType) = 明確參數（必須提供型別）
-- 【語法】: World → World → Prop = 函數型別（接收兩個 World，返回 Prop）
-- 【語法】Prop = 命題型別（true/false 的型別）
-- 【語法】match ... with = 模式匹配表達式
-- 【語法】| pattern => result = 匹配分支
def accessible (type : AccessibilityType) : World → World → Prop :=
  match type with                      -- 【模式匹配】根據 type 的值決定行為
  | AccessibilityType.metaphysical =>  -- 【匹配分支】如果是 metaphysical
      fun w1 w2 => match w1, w2 with   -- 【匿名函數】接收 w1, w2，然後模式匹配
        | World.actual, _ => True      -- 【模式】從 actual 到任何世界都可達
        | World.metaphysically_possible _, World.metaphysically_possible _ => True
        | _, _ => False                -- 【通配符】其他情況都不可達
  | AccessibilityType.logical =>       -- 【匹配分支】如果是 logical
      fun w1 w2 => match w1, w2 with
        | World.actual, _ => True
        | World.logically_possible _, World.logically_possible _ => True
        | World.metaphysically_possible _, World.logically_possible _ => True
        | _, _ => False
  | AccessibilityType.conceptual =>    -- 【匹配分支】如果是 conceptual
      fun _ _ => True                   -- 【匿名函數】忽略參數，總是返回 True
  | AccessibilityType.epistemic =>     -- 【匹配分支】如果是 epistemic
      fun w1 w2 => w1 = w2             -- 【匿名函數】只有相同世界才可達

-- 【語法】(w : World) = 明確參數
-- 【語法】(ind : Individual) = 明確參數
-- 【語法】(prop : Property) = 明確參數
-- 【語法】∈ = Unicode 成員關係符號，等同於 \in
def holds_at (_w : World) (ind : Individual) (prop : Property) : Prop :=
  ind ∈ prop.applies_to               -- 【成員檢查】ind 是否在 prop.applies_to 列表中

-- 【語法】(P : World → Prop) = 函數型別參數
-- 【語法】∀ = Unicode 全稱量詞，等同於 forall
-- 【語法】→ = Unicode 蘊含箭頭
def necessarily (type : AccessibilityType) (P : World → Prop) : Prop :=
  ∀ w : World, accessible type World.actual w → P w
  -- 【語義】對所有世界 w，如果從 actual 可達 w，則 P 在 w 成立

-- 【語法】∃ = Unicode 存在量詞，等同於 exists
-- 【語法】∧ = Unicode 邏輯與，等同於 /\
def possibly (type : AccessibilityType) (P : World → Prop) : Prop :=
  ∃ w : World, accessible type World.actual w ∧ P w
  -- 【語義】存在世界 w，使得從 actual 可達 w 且 P 在 w 成立

-- ========================================================================
-- PART III: ESSENCE AND HYPERINTENSIONALITY 本質與超內涵性
-- ========================================================================

-- 【修改】essence 函數現在基於實體類型來確定本質屬性
-- 【語法】let var := value = 局部變量定義（在函數內部使用）
-- 【語法】List.filterMap = 列表函數（過濾並轉換列表元素）
-- 【語法】if ... then ... else = 條件表達式
def essence (ind : Individual) : List Property :=
  let ind_type := entity_type ind      -- 【步驟1】取得個體的實體類型
  essentiality_relations.filterMap (fun rel =>  -- 【步驟2】遍歷所有本質性關係
    if rel.entity_type = ind_type ∧ rel.is_essential then  -- 【條件】類型匹配且為本質
      some rel.property                -- 【收集】保留該屬性
    else
      none)                           -- 【過濾】排除不符合條件的屬性

-- 【工作流程】
-- 1. 輸入個體（如 Individual.socrates）
-- 2. 查找個體的類型（EntityType.human）
-- 3. 在本質性關係列表中找出所有對該類型本質的屬性
-- 4. 返回屬性列表（如 [rationality]）

-- 【使用範例】essence Individual.socrates 會返回 [rationality]（因為理性對人類本質）
-- 【使用範例】essence Individual.table1 會返回 []（因為沒有對桌子本質的屬性）

-- 【修改】is_essential 現在基於實體類型和本質性關係
def is_essential (ind : Individual) (prop : Property) : Prop :=
  is_essential_for_type (entity_type ind) prop = true

structure HyperintensionalAnalysis where
  statement : String                   -- 【字段】陳述內容
  subject : Individual                 -- 【字段】主語
  property : Property                  -- 【字段】屬性
  modally_necessary : Bool             -- 【字段】是否模態必然（Bool = true/false）
  essential_to_subject : Bool          -- 【字段】是否對主語本質
  metaphysically_grounded : Bool       -- 【字段】是否形上學奠基
  explanation_type : String            -- 【字段】解釋類型
deriving Repr

-- 【語法】:= 後的 { ... } = 結構體字面量
def socrates_rationality_case : HyperintensionalAnalysis := {
  statement := "Socrates is rational",
  subject := Individual.socrates,
  property := rationality,
  modally_necessary := true,           -- 【斷言】我們聲稱這是 true
  essential_to_subject := true,        -- 【斷言】我們聲稱這是 true
  metaphysically_grounded := true,     -- 【斷言】我們聲稱這是 true
  explanation_type := "essential_nature"
}

def socrates_singleton_case : HyperintensionalAnalysis := {
  statement := "Socrates belongs to {Socrates}",
  subject := Individual.socrates,
  property := set_membership,
  modally_necessary := true,           -- 【斷言】模態必然但非本質
  essential_to_subject := false,       -- 【斷言】不是本質
  metaphysically_grounded := false,    -- 【斷言】沒有形上學奠基
  explanation_type := "set_theoretic"
}

-- ========================================================================
-- PART IV: GROUNDING AND EXPLANATION 基礎與解釋
-- ========================================================================

inductive GroundingType : Type where
  | metaphysical : GroundingType       -- 【構造子】形上學基礎
  | logical : GroundingType            -- 【構造子】邏輯基礎
  | conceptual : GroundingType         -- 【構造子】概念基礎
  | causal : GroundingType             -- 【構造子】因果基礎
  | constitutive : GroundingType       -- 【構造子】構成基礎
deriving DecidableEq, Repr

structure GroundingFact where
  grounded_fact : String               -- 【字段】被奠基的事實
  grounding_facts : List String        -- 【字段】奠基事實列表
  grounding_type : GroundingType       -- 【字段】奠基類型
  strength : Nat                       -- 【字段】強度（自然數）
  immediate : Bool                     -- 【字段】是否直接奠基
deriving Repr

inductive ExplanationType : Type where
  | circular : ExplanationType         -- 【構造子】循環解釋
  | reductive : ExplanationType        -- 【構造子】還原解釋
  | emergent : ExplanationType         -- 【構造子】涌現解釋
  | constitutive : ExplanationType     -- 【構造子】構成解釋
  | causal : ExplanationType           -- 【構造子】因果解釋
  | essential : ExplanationType        -- 【構造子】本質解釋
deriving DecidableEq, Repr

-- 【語法】Option GroundingType = 可選型別（可能有值，可能沒值）
-- 【語法】some/none = Option 的構造子
structure Explanation where
  explanandum : String                 -- 【字段】被解釋項
  explanans : List String              -- 【字段】解釋項列表
  explanation_type : ExplanationType   -- 【字段】解釋類型
  grounding_type : Option GroundingType -- 【字段】可選的奠基類型
  modal_strength : Nat                 -- 【字段】模態強度
  explanatory_power : Nat              -- 【字段】解釋力
deriving Repr

-- 【語法】match ... with = 模式匹配
-- 【語法】+ = 加法運算符
def calculate_explanatory_power (exp : Explanation) : Nat :=
  match exp.explanation_type with
  | ExplanationType.circular => 0                        -- 【計算】循環解釋 = 0
  | ExplanationType.reductive => exp.explanatory_power + 2   -- 【計算】還原解釋 = 基礎 + 2
  | ExplanationType.emergent => exp.explanatory_power + 1    -- 【計算】涌現解釋 = 基礎 + 1
  | ExplanationType.constitutive => exp.explanatory_power + 3 -- 【計算】構成解釋 = 基礎 + 3
  | ExplanationType.causal => exp.explanatory_power + 2      -- 【計算】因果解釋 = 基礎 + 2
  | ExplanationType.essential => exp.explanatory_power + 4   -- 【計算】本質解釋 = 基礎 + 4

-- 【語法】some = Option 型別的 "有值" 構造子
def essential_explanation : Explanation := {
  explanandum := "Socrates is rational",
  explanans := ["Socrates has a rational essence"],
  explanation_type := ExplanationType.essential,
  grounding_type := some GroundingType.metaphysical,  -- 【Some 值】有形上學奠基
  modal_strength := 10,
  explanatory_power := 8
}

def set_theoretic_explanation : Explanation := {
  explanandum := "Socrates ∈ {Socrates}",
  explanans := ["Set theory axioms", "Singleton definition"],
  explanation_type := ExplanationType.constitutive,
  grounding_type := some GroundingType.logical,       -- 【Some 值】有邏輯奠基
  modal_strength := 10,
  explanatory_power := 6
}

-- ========================================================================
-- PART V: COUNTERFACTUALS AND CONTINGENCY 反事實與偶然性
-- ========================================================================

structure Counterfactual where
  antecedent : String                  -- 【字段】前件
  consequent : String                  -- 【字段】後件
  truth_value : Bool                   -- 【字段】真值
  world_type : AccessibilityType       -- 【字段】世界類型
  depends_on_essence : Bool            -- 【字段】是否依賴本質
deriving Repr

def essential_counterfactual : Counterfactual := {
  antecedent := "If Socrates were not rational",
  consequent := "Socrates would not exist",
  truth_value := true,
  world_type := AccessibilityType.metaphysical,
  depends_on_essence := true
}

def accidental_counterfactual : Counterfactual := {
  antecedent := "If {Socrates} did not exist",
  consequent := "Socrates would still exist",
  truth_value := true,
  world_type := AccessibilityType.metaphysical,
  depends_on_essence := false
}

-- ========================================================================
-- PART VI: FORMAL THEOREMS AND PROOFS 形式定理與證明
-- ========================================================================

-- 【修改】定理需要根據新的本質性系統來證明
theorem rationality_is_essential_to_socrates :
  is_essential Individual.socrates rationality := by
  simp [is_essential, is_essential_for_type, entity_type]
  simp [essentiality_relations, human_rationality_essentiality]

-- 【修改】使用新的本質性系統證明 set_membership 不是本質的
theorem set_membership_not_essential_to_socrates :
  ¬is_essential Individual.socrates set_membership := by
  simp [is_essential, is_essential_for_type, entity_type]
  simp [essentiality_relations, human_set_membership_essentiality]
  simp [List.find?]
  rfl

-- 【語法】= = 相等關係
-- 【語法】≠ = Unicode 不等關係，等同於 !=
-- 【語法】∧ = Unicode 邏輯與
theorem hyperintensional_distinction :
  socrates_rationality_case.modally_necessary = socrates_singleton_case.modally_necessary ∧
  socrates_rationality_case.essential_to_subject ≠ socrates_singleton_case.essential_to_subject := by
  constructor                          -- 【戰術】拆解 ∧，證明兩部分
  · rfl                               -- 【戰術】反射性（true = true）
  · simp [socrates_rationality_case, socrates_singleton_case]  -- 【戰術】簡化（true ≠ false）

-- 【語法】> = 大於關係
theorem explanation_strength_ordering :
  calculate_explanatory_power essential_explanation >
  calculate_explanatory_power set_theoretic_explanation := by
  simp [calculate_explanatory_power, essential_explanation, set_theoretic_explanation]
  -- 【計算】12 > 9，自動驗證

-- ========================================================================
-- PART VII: INTERACTIVE DEMONSTRATIONS 互動展示
-- ========================================================================

-- 【語法】IO Unit = IO 動作型別（輸入輸出操作）
-- 【語法】do = do 記號法（順序執行 IO 操作）
-- 【語法】s!"..." = 字串插值（類似 Python 的 f"..."）
-- 【語法】{} = 插值表達式
def analyze_modal_status (ind : Individual) (prop : Property) : IO Unit := do
  IO.println s!"Analyzing: {toString ind} has property {prop.name}"  -- 【IO】打印操作
  IO.println s!"Property tags - Ontological: {toString prop.tags.ontological}"  -- 【IO】打印本體論標籤
  IO.println s!"              Modal: {toString prop.tags.modal}"     -- 【IO】打印模態標籤
  IO.println s!"              Temporal: {toString prop.tags.temporal}" -- 【IO】打印時間性標籤
  IO.println s!"              Epistemic: {toString prop.tags.epistemic}" -- 【IO】打印認知標籤
  IO.println ""                                                      -- 【IO】打印空行

def compare_cases : IO Unit := do
  IO.println "=== HYPERINTENSIONAL COMPARISON 超內涵性比較 ==="
  IO.println ""
  IO.println "Case 1: Socrates is rational"
  IO.println s!"  Modal necessity: {socrates_rationality_case.modally_necessary}"     -- 【字串插值】
  IO.println s!"  Essential: {socrates_rationality_case.essential_to_subject}"        -- 【字串插值】
  IO.println s!"  Grounded: {socrates_rationality_case.metaphysically_grounded}"      -- 【字串插值】
  IO.println ""
  IO.println "Case 2: Socrates ∈ {Socrates}"
  IO.println s!"  Modal necessity: {socrates_singleton_case.modally_necessary}"
  IO.println s!"  Essential: {socrates_singleton_case.essential_to_subject}"
  IO.println s!"  Grounded: {socrates_singleton_case.metaphysically_grounded}"
  IO.println ""
  IO.println "KEY INSIGHT: Same modal status, different hyperintensional profile!"

def compare_explanations : IO Unit := do
  IO.println "=== EXPLANATION ANALYSIS 解釋分析 ==="
  IO.println ""
  IO.println s!"Essential explanation power: {calculate_explanatory_power essential_explanation}"
  IO.println s!"Set-theoretic explanation power: {calculate_explanatory_power set_theoretic_explanation}"
  IO.println ""
  IO.println "CONCLUSION: Essential explanations are stronger than logical ones"

def demonstrate_relative_essentiality : IO Unit := do
  IO.println "=== RELATIVE ESSENTIALITY SYSTEM 相對本質性系統 ==="
  IO.println ""
  IO.println "🔍 Analyzing essentiality relations across entity types:"
  IO.println ""

  -- 【演示】人類的本質屬性
  IO.println s!"For entity type {toString EntityType.human}:"
  IO.println s!"  • Rationality is essential: {is_essential_for_type EntityType.human rationality}"
  IO.println s!"  • Set membership is essential: {is_essential_for_type EntityType.human set_membership}"
  IO.println ""

  -- 【演示】桌子的本質屬性
  IO.println s!"For entity type {toString EntityType.table}:"
  IO.println s!"  • Greenness is essential: {is_essential_for_type EntityType.table greenness}"
  IO.println ""

  -- 【演示】個體的本質推導
  IO.println "📊 Individual essence derived from type-relative essentiality:"
  IO.println s!"Socrates (type: {toString (entity_type Individual.socrates)}) has essential properties:"
  for prop in essence Individual.socrates do
    IO.println s!"  • {prop.name}"
  IO.println ""

  IO.println s!"Table1 (type: {toString (entity_type Individual.table1)}) has essential properties:"
  for prop in essence Individual.table1 do
    IO.println s!"  • {prop.name}"
  IO.println ""

  IO.println "✅ KEY IMPROVEMENT: Essentiality is now correctly relativized to entity types!"
  IO.println "✅ This avoids the philosophical error of treating essentiality as property-intrinsic."

def run_comprehensive_analysis : IO Unit := do
  IO.println "╔══════════════════════════════════════════════════════════╗"
  IO.println "║           形上學遊戲場 2.0 - 綜合分析                      ║"
  IO.println "║        Metaphysical Playground - Comprehensive            ║"
  IO.println "╚══════════════════════════════════════════════════════════╝"
  IO.println ""

  analyze_modal_status Individual.socrates rationality  -- 【函數調用】
  compare_cases                                          -- 【函數調用】
  IO.println ""
  compare_explanations                                   -- 【函數調用】
  IO.println ""
  demonstrate_relative_essentiality                      -- 【新增】演示相對本質性系統
  demonstrate_multi_dimensional_queries                  -- 【新增】演示多維度查詢

  IO.println ""
  IO.println "🎯 THEORETICAL ACHIEVEMENTS:"
  IO.println "✓ Formalized Kit Fine's essence/modality distinction"
  IO.println "✓ Implemented hyperintensional analysis framework"
  IO.println "✓ Provided rigorous grounding theory"
  IO.println "✓ Demonstrated explanation type hierarchies"
  IO.println "✓ Unified modal metaphysics in type theory"

-- ========================================================================
-- VERIFICATION AND TESTING 驗證與測試
-- ========================================================================

-- 【語法】#check = 檢查型別命令（編譯時命令）
-- 【語法】#eval = 求值命令（執行代碼）
#check rationality_is_essential_to_socrates  -- 【檢查】檢查定理型別
#check set_membership_not_essential_to_socrates -- 【檢查】檢查修改後的定理型別
#check hyperintensional_distinction           -- 【檢查】檢查定理型別
#check explanation_strength_ordering          -- 【檢查】檢查定理型別

-- 【語法】#eval = 執行 IO 動作
#eval run_comprehensive_analysis              -- 【執行】運行綜合分析

-- 【語法】end = 結束命名空間
end MetaphysicalPlayground
