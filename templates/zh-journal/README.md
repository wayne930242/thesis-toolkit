# zh-journal

Typst 套件 `@local/zh-journal:0.1.2`：臺灣 TSSCI 人文期刊常見的投稿格式，不對應特定期刊。投稿前仍要對照目標期刊的〈撰稿體例〉調整。

版面依序是中文題目與副題、作者（服務單位與 email 列為星號附註）、中文摘要與關鍵詞、正文、參考文獻，最後是英文題目與摘要。正文標題依「壹、／一、／（一）／1.／(1)」五層編號，腳註從 1 起連續編號，引註採作者—年代制（預設 `chicago-author-date`）。

## 使用

`thesis-toolkit compile` 會提供本套件；在編輯器預覽前先執行一次 `thesis-toolkit link`。

```typst
#import "@local/zh-journal:0.1.2": article

#show: article.with(
  title: [論文題目],
  title-en: [English Title],
  authors: ((name: "王小明", name-en: "Xiao-Ming Wang",
             affiliation: "某大學哲學系博士生", affiliation-en: "…", email: "…"),),
  abstract: [中文摘要……],
  keywords: ("關鍵詞一", "關鍵詞二"),
  abstract-en: [English abstract …],
  keywords-en: ("keyword one", "keyword two"),
  bib: path(sys.inputs.at("bib-path", default: "/references.bib")),
)

= 前言

內文……@sosa2007[23]
```

`bib` 必須是在你自己專案裡建立的 `path(...)`，寫成字串會被解析到套件目錄裡。

## 參數

| 參數 | 預設 | 說明 |
|---|---|---|
| `title`、`subtitle` | 必填、`none` | 中文題目與副題 |
| `title-en`、`subtitle-en` | `none` | 英文題目與副題 |
| `authors` | `()` | 每位作者一個字典：`name` 必填，另可給 `name-en`、`affiliation`、`affiliation-en`、`email` |
| `thanks` | `none` | 題目上的誌謝附註 |
| `abstract`、`keywords` | `none`、`()` | 中文摘要與關鍵詞；關鍵詞是字串陣列，以「、」連接，也寫入 PDF metadata |
| `abstract-en`、`keywords-en` | `none`、`()` | 英文摘要與關鍵詞 |
| `english-position` | `"end"` | `"end"` 把英文題目與摘要放在參考文獻之後另起一頁，`"front"` 放在中文摘要之後 |
| `anonymous` | `false` | 匿名審查稿：不印作者、誌謝，PDF metadata 也不含作者 |
| `running-head` | 題目 | 第 2 頁起的頁眉 |
| `bib`、`bib-style`、`bib-title` | `none`、`"chicago-author-date"`、`[參考文獻]` | 參考文獻來源、CSL 樣式與標題 |
| `paper`、`font-size` | `"a4"`、`12pt` | 紙張與正文字級 |

套件另外匯出 `zh-heading-numbering`（標題編號函式）、`zh-upper`（1–99 的「壹、貳、參」大寫數字）、`zh-join-lines`、`md-cites` 與 `strip-frontmatter`（見下節）。

## 用 Markdown 寫正文

不想直接寫 Typst 時，正文與摘要可以寫成 Markdown，用任何 Markdown 編輯器編輯（例如 MyGitNotes），版面仍由本套件排。建立這種專案：

```bash
npx thesis-toolkit new-project my-paper "論文題目" --template journal
npx thesis-toolkit compile my-paper main
```

專案根目錄的 `body.md`、`abstract.md`、`abstract-en.md` 是正文與摘要；`src/main/main.typ` 只放題目、作者、關鍵詞與 `anonymous` 開關。Markdown 透過 [`@preview/cmarker`](https://typst.app/universe/package/cmarker/) 轉成 Typst，第一次編譯會從網路下載它。

| Markdown | 排出來 |
|---|---|
| `#`、`##`、`###` | 壹、／一、／（一） |
| `[@sosa2007]` | (Sosa 2007)，並列入參考文獻 |
| `[@sosa2007, 23]` 或 `[23][@sosa2007]` | (Sosa 2007, 23) |
| `[@fine2012; @sosa2007, 23]` | (Fine 2012; Sosa 2007, 23) |
| `[-@sosa2007]` | (2007) |
| `@sosa2007 指出`、`@sosa2007 [23] 指出` | Sosa (2007) 指出、Sosa (2007, 23) 指出 |
| `[^1]` 與另起一行的 `[^1]: 內容` | 頁尾腳註 |
| `![說明](figures/圖一.png)` | 圖片，路徑相對於專案根目錄 |

同一段落裡的換行，只要換行處的一側是中日韓文字或全形標點，`zh-join-lines` 就會把兩行接起來，不會在中文字之間多出空格；標題、條列、引文、表格、程式碼與硬換行（行尾兩個空格或 `\`）不受影響。

引註用 Pandoc 的寫法（Zotero 的 Better BibTeX 與多數 Markdown 外掛產生的就是這種），由 `md-cites` 在交給 cmarker 前轉成 Typst 引註。限制：敘述式的 `@key` 後面要接空格或標點，`@sosa2007指出` 會把「指出」當成 key 的一部分；方括號裡不能在 `@` 前寫文字（`[參見 @sosa2007]`），請寫成 `參見 [@sosa2007]`；`[-@key]` 要單獨一組。行內程式碼、程式碼區塊、email 與網址裡的 `@` 不受影響。

編譯時，toolkit 從 `.md` 與 `.typ` 檔找出引用的 key，只把這些條目從 `thesis-toolkit.json` 的 `bibliography` 抄進專案的 `references.generated.bib`，文末的參考文獻就由這份清單排出。

編輯器寫在檔首的 YAML 前置資料（`---` 包起來的 `created`、`updated` 等）由 `strip-frontmatter` 去掉，不會印出來。

在 MyGitNotes 的即時預覽裡，`[@sosa2007]` 會照原樣顯示，存檔時也一字不改。


## 已知限制

- 參考文獻只有一份清單，依 CSL 規則排序，不會自動分成「中文在前、西文在後」或依筆畫排序。
- 整份參考文獻沿用 CSL 的 zh-TW 語系：中文篇名用「」而非〈〉《》，西文條目也會印成中文用語（「收入」「編輯」「及」「卷」、篇名用「」）。期刊要求西文條目用 In、edited by、Vol. 或要求〈〉《》時，需要換用自訂 CSL（`bib-style` 可給 CSL 檔的 `path(...)`）。
- Typst 會把中文句子中間的換行排成一個空格，中文段落請寫成一行，不要在字與字之間斷行。

`example.typ` 是完整示範；在 thesis-toolkit repository 內以 `node dist/cli.js compile templates/zh-journal/example.typ` 編譯。
