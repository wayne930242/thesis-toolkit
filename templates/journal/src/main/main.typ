// 期刊稿主檔：題目、作者與關鍵詞寫在這裡，正文與摘要寫在專案根目錄的 Markdown 檔
// （body.md、abstract.md、abstract-en.md），用任何 Markdown 編輯器編輯即可。
// 編譯：thesis-toolkit compile <專案> main
//
// Markdown 寫法：
// - 標題 # / ## / ### 依序排成「壹、」「一、」「（一）」
// - 引註 [@key]，帶頁碼 [@key, 23]，多筆 [@a; @b]，只印年 [-@key]，敘述式 @key 指出（key 後空一格）
//   文末參考文獻自動產生
// - 腳註 [^1]，並在文中另起一行寫 [^1]: 腳註內容
// - 圖片路徑相對於專案根目錄，例如 ![說明](figures/圖一.png)
#import "@local/zh-journal:0.1.2": article, md-cites, strip-frontmatter, zh-join-lines
#import "@preview/cmarker:0.1.10": render

// 以專案根目錄為基準讀 Markdown 與其中的圖片。
#let md(file) = render(
  md-cites(zh-join-lines(strip-frontmatter(read("../../" + file)))),
  scope: (
    image: (source, alt: none, format: auto) => image(
      if source.starts-with("/") { source } else { "../../" + source },
      alt: alt,
      format: format,
    ),
  ),
)

#show: article.with(
  title: "{Article Title}",
  title-en: "English Title",
  authors: (
    (
      name: "作者姓名",
      name-en: "Author Name",
      affiliation: "服務單位與職稱",
      affiliation-en: "Position, Affiliation",
      email: "author@example.edu",
    ),
  ),
  abstract: md("abstract.md"),
  keywords: ("關鍵詞一", "關鍵詞二", "關鍵詞三"),
  abstract-en: md("abstract-en.md"),
  keywords-en: ("keyword one", "keyword two", "keyword three"),
  // 匿名審查稿改成 true：不印作者、誌謝，PDF 資訊也不含作者。
  anonymous: false,
  bib: path(sys.inputs.at("bib-path", default: "/references.bib")),
)

#md("body.md")
