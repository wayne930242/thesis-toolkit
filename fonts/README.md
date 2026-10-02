# Fonts

`thesis-toolkit compile` passes this directory to Typst with `--font-path`; `thesis-toolkit link`
prints it for editor font settings.

| File | Family | License |
|---|---|---|
| `NotoSerifTC-{Regular,Bold}.otf` | Noto Serif TC | SIL Open Font License 1.1, © Adobe and Google ([OFL.txt](OFL.txt)) |
| `NotoSansTC-{Regular,Bold}.otf` | Noto Sans TC | SIL Open Font License 1.1, © Adobe and Google ([OFL.txt](OFL.txt)) |

`templates/ntu-thesis/font-config.typ` uses Noto Serif TC for body text and headings and Noto Sans TC
as fallback; Latin, math, and monospace text use Typst's embedded Libertinus Serif, New Computer
Modern (Math), and DejaVu Sans Mono.
