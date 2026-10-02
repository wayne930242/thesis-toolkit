# 國立臺灣大學模組化論文模板

基於 NCKU 優秀設計理念，重新打造的台大碩博士論文 Typst 模板。

## 🌟 特色

- **模組化設計**：參考 NCKU 模板的優秀架構，採用函數式初始化
- **嚴格格式規範**：完全符合台大官方論文格式要求  
- **智慧參數驗證**：使用 `assert()` 檢查輸入參數
- **語言切換支援**：自動調整中英文排版設定
- **浮水印背景**：支援自訂浮水印檔案
- **完整頁面元件**：封面、審定書、摘要、致謝、目錄、參考文獻

## 📁 目錄結構

```
ntu-thesis/
├── typst.toml           # Typst 套件資訊（@local/ntu-thesis）
├── lib.typ              # 進入點，並重新匯出字體、版面與 chapter-bib
├── chapter-bib.typ      # 主檔與單章共用的參考文獻
├── assets/watermark.svg # 浮水印
├── font-config.typ      # 字體配置
├── layouts/             # 佈局模組
│   ├── whole.typ        # 全域設定
│   └── mainmatter.typ   # 正文佈局
├── pages/               # 頁面模組
│   ├── cover.typ        # 封面
│   ├── verification.typ # 口試委員審定書
│   ├── abstract.typ     # 中英文摘要
│   ├── acknowledgement.typ # 致謝
│   ├── outline.typ      # 目錄
│   └── ref.typ          # 參考文獻
├── utils/               # 工具模組
│   └── page-numbering.typ # 頁碼工具
├── example.typ          # 完整使用範例
└── README.md           # 使用說明
```

## 🚀 快速開始

`thesis-toolkit compile` 會以 `--package-path` 提供本模板；editor 預覽前執行一次 `thesis-toolkit link`。

### 參考文獻

`chapter-bib` 的書目來源要在專案檔案裡以 `path()` 建立，否則路徑會被解析到套件內：

```typst
// 專案內的 bib.typ
#import "@local/ntu-thesis:0.1.0": chapter-bib as ntu-chapter-bib
#let chapter-bib = ntu-chapter-bib.with(path(sys.inputs.at("bib-path", default: "/references.bib")))
```

主檔呼叫 `#chapter-bib(main: true)`，各章呼叫 `#chapter-bib()`。

### 1. 初始化模板

```typst
#import "@local/ntu-thesis:0.1.0": setup

#let (
  // 頁面元件
  make-cover,
  make-verification,
  make-abstract-zh,
  make-abstract-en,
  make-acknowledgement,
  make-outline,
  make-ref,
  
  // 佈局元件
  whole,
  mainmatter,
  
  // 工具函數
  begin-roman-numbering,
  begin-arabic-numbering,
) = setup(
  // 基本設定
  university: "國立臺灣大學",
  college: "工學院",
  institute: "工業工程學研究所",
  
  // 學位設定
  degree: (master: true, doctor: false),
  
  // 個人資訊
  title: (
    zh: "論文中文題目",
    en: "English Thesis Title"
  ),
  author: (
    zh: "作者中文姓名",
    en: "Author English Name"
  ),
  advisor: (
    zh: "指導教授中文姓名",
    en: "Advisor English Name"
  ),
  student-id: "R12345678",
  
  // 日期設定
  date: "2024-06-01",
  oral-date: "2024-06-15",
  
  // 語言設定
  main-lang: (zh: true, en: false),
)
```

### 2. 撰寫論文

```typst
// 套用全域設定
#show: whole

// 封面
#make-cover()

// 開始羅馬數字頁碼
#show: begin-roman-numbering

// 前置頁面
#make-verification()
#make-acknowledgement[致謝內容...]
#make-abstract-zh(keywords: ("關鍵字1", "關鍵字2"))[中文摘要內容...]
#make-abstract-en(keywords: ("keyword1", "keyword2"))[English abstract...]
#make-outline()

// 開始阿拉伯數字頁碼
#show: begin-arabic-numbering
#show: mainmatter

// 正文章節
= 緒論
內容...

= 文獻探討
內容...

// 參考文獻
#make-ref[
  #bibliography("references.bib", style: "ieee")
]
```

## ⚙️ 配置選項

### 基本設定

| 參數 | 說明 | 預設值 |
|------|------|--------|
| `university` | 大學名稱 | "國立臺灣大學" |
| `university-en` | 大學英文名稱 | "National Taiwan University" |
| `college` | 學院名稱 | "工學院" |
| `institute` | 研究所名稱 | **必填** |

### 學位設定

| 參數 | 說明 | 可選值 |
|------|------|--------|
| `degree` | 學位類型 | `(master: true, doctor: false)` 或 `(master: false, doctor: true)` |

### 個人資訊

| 參數 | 說明 | 格式 |
|------|------|------|
| `title` | 論文題目 | `(zh: "中文題目", en: "English Title")` |
| `author` | 作者姓名 | `(zh: "中文姓名", en: "English Name")` |
| `advisor` | 指導教授 | `(zh: "中文姓名", en: "English Name")` |
| `co-advisor` | 共同指導教授 | 陣列，可為空 `()` |

### 語言設定

| 參數 | 說明 | 可選值 |
|------|------|--------|
| `main-lang` | 主要語言 | `(zh: true, en: false)` 或 `(zh: false, en: true)` |

## 🎨 浮水印設定

模板以本目錄的 `assets/watermark.svg` 作為封面與內文的背景浮水印；要換圖就替換該檔，或修改 `pages/cover.typ` 與 `layouts/whole.typ` 中的路徑。

## 📝 使用範例

詳細的使用範例請參考 `example.typ` 檔案，包含完整的論文結構和各種功能示範。

## 🔧 自訂修改

### 修改字體

編輯 `font-config.typ` 檔案來調整字體設定。

### 修改格式

各模組檔案都有清楚的註解，可根據需要進行調整：

- `layouts/whole.typ`：全域設定
- `pages/*.typ`：各頁面格式
- `utils/*.typ`：工具函數

## 📋 參數驗證

模板內建完整的參數驗證機制，會檢查：

- 學位類型是否正確設定
- 必要欄位是否填寫
- 語言設定是否合理
- 中英文資訊是否完整

## 🆚 與原版差異

相較於原始 NTU 模板的改進：

1. **函數式設計**：更清潔的使用介面
2. **參數驗證**：自動檢查設定錯誤  
3. **模組分離**：更好的代碼組織
4. **語言切換**：智慧的中英文排版
5. **浮水印支援**：內建背景圖片功能

## 🤝 貢獻

歡迎提出 Issues 和 Pull Requests 來改進這個模板！ 