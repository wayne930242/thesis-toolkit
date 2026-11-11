import { mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { ProjectError } from "./errors.ts";

// Characters Typst accepts in a label written as `@label`, plus the `/` a Pandoc key may hold
// (zh-journal's md-cites accepts it). A trailing `.` or `:` ends the sentence rather than the
// label, as Typst itself reads it.
const REF = /@([\p{L}\p{N}_\-:./]+)/gu;
const ANGLE = /<([^<>\s]+)>/g;
const LABEL_CALL = /label\(\s*"([^"]+)"\s*\)/g;
// Explicit citations, the only form that cannot be a cross-reference to a heading or figure.
const CITE_CALL = /cite\s*\(\s*(?:<([^<>\s]+)>|label\(\s*"([^"]+)"\s*\))/g;
const CROSSREF = /\b(?:crossref|xdata)\s*=\s*(?:\{([^{}]*)\}|"([^"]*)")/gi;

/** File types whose text may cite: Typst sources and Markdown rendered through cmarker. */
const SOURCE_EXTENSIONS = [".typ", ".md"];
const SKIPPED_DIRS = new Set(["node_modules"]);

export interface BibEntry {
  key: string;
  text: string;
  /** Keys this entry inherits fields from through `crossref` or `xdata`. */
  parents: string[];
}

export interface ParsedBib {
  entries: Map<string, BibEntry>;
  /** `@string` and `@preamble` blocks, which any entry may depend on. */
  shared: string[];
  duplicates: string[];
}

export interface SubsetResult {
  kept: number;
  total: number;
  /** Keys cited with `cite(...)` that the bibliography lacks. */
  missing: string[];
  /** Keys defined more than once and not cited; Typst would reject the full bibliography. */
  duplicates: string[];
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

/** Index just past the `}` or `)` closing the block opened at `open`. */
function blockEnd(bib: string, open: number): number {
  const closer = bib[open] === "(" ? ")" : "}";
  let depth = 0;
  let quoted = false;
  for (let i = open + 1; i < bib.length; i++) {
    const char = bib[i];
    if (char === "\\") {
      i++;
    } else if (char === "{") {
      depth++;
    } else if (char === "}" && depth > 0) {
      depth--;
    } else if (depth === 0 && char === '"') {
      quoted = !quoted;
    } else if (depth === 0 && !quoted && char === closer) {
      return i + 1;
    }
  }
  throw new ProjectError(`bibliography: unterminated entry at line ${lineOf(bib, open)}`);
}

/**
 * Split a BibTeX file into entries by brace depth, so one-line entries, indented closing braces,
 * and fields whose `}` starts a line all parse. Text outside entries is a comment, as in BibTeX.
 */
export function parseBib(bib: string): ParsedBib {
  const entries = new Map<string, BibEntry>();
  const shared: string[] = [];
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const start = /@\s*([A-Za-z]+)\s*([{(])/g;
  let match: RegExpExecArray | null;
  let previousEnd = 0;
  while ((match = start.exec(bib)) !== null) {
    const type = (match[1] as string).toLowerCase();
    const open = match.index + match[0].length - 1;
    const end = blockEnd(bib, open);
    // Only the text since the line's start or the previous entry's end can comment this one out.
    const from = Math.max(bib.lastIndexOf("\n", match.index) + 1, previousEnd);
    if (/(^|[^\\])%/.test(bib.slice(from, match.index))) {
      // A `%` comment (`% old: @book{key, ...}`): BibTeX and Typst skip it, so must we.
      start.lastIndex = match.index + match[0].length;
      continue;
    }
    const text = bib.slice(match.index, end);
    start.lastIndex = end;
    previousEnd = end;
    if (type === "comment") {
      continue;
    }
    if (type === "string" || type === "preamble") {
      shared.push(text);
      continue;
    }
    const body = bib.slice(open + 1, end - 1);
    const comma = body.indexOf(",");
    const key = (comma === -1 ? body : body.slice(0, comma)).trim();
    if (key === "") {
      throw new ProjectError(`bibliography: entry without a key at line ${lineOf(bib, match.index)}`);
    }
    if (seen.has(key)) {
      duplicates.add(key);
      continue;
    }
    seen.add(key);
    const parents: string[] = [];
    for (const ref of body.matchAll(CROSSREF)) {
      for (const parent of (ref[1] ?? ref[2] ?? "").split(",")) {
        if (parent.trim() !== "") {
          parents.push(parent.trim());
        }
      }
    }
    entries.set(key, { key, text, parents });
  }
  return { entries, shared, duplicates: [...duplicates].sort() };
}

/** Each entry's verbatim text by key. */
export function parseEntries(bib: string): Map<string, string> {
  return new Map([...parseBib(bib).entries].map(([key, entry]) => [key, entry.text]));
}

/**
 * Every label-like token in `source`: `@key` (also with the trailing `.` or `:` trimmed),
 * `<key>`, and `label("key")`. Comments and strings are not stripped: an extra entry in the
 * subset is harmless because Typst prints only what is cited, while a dropped one fails the build.
 */
export function referencedTokens(source: string): Set<string> {
  const tokens = new Set<string>();
  for (const match of source.matchAll(REF)) {
    const token = match[1] as string;
    tokens.add(token);
    tokens.add(token.replace(/[.:]+$/, ""));
  }
  for (const pattern of [ANGLE, LABEL_CALL]) {
    for (const match of source.matchAll(pattern)) {
      tokens.add(match[1] as string);
    }
  }
  return tokens;
}

/** Keys cited explicitly with `cite(<key>)` or `cite(label("key"))`. */
export function explicitCitations(source: string): Set<string> {
  const keys = new Set<string>();
  for (const match of source.matchAll(CITE_CALL)) {
    keys.add((match[1] ?? match[2]) as string);
  }
  return keys;
}

/** Source files under `dir`, skipping dot-entries (editor locks, `.git`) and `node_modules`. */
export function sourceFiles(dir: string, visited: Set<string> = new Set()): string[] {
  // Real paths seen so far: a symlink back to an ancestor would otherwise recurse until ELOOP.
  const real = realpathSync(dir);
  if (visited.has(real)) {
    return [];
  }
  visited.add(real);
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIPPED_DIRS.has(entry.name)) {
      continue;
    }
    const path = join(dir, entry.name);
    // Follow symlinks, but skip dangling ones instead of failing the compile.
    const stat = entry.isSymbolicLink() ? statSync(path, { throwIfNoEntry: false }) : entry;
    if (stat?.isDirectory()) {
      files.push(...sourceFiles(path, visited));
    } else if (stat?.isFile() && SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(path);
    }
  }
  return files.sort();
}

/** Add the `crossref`/`xdata` ancestors of `keys`, which the cited entries inherit fields from. */
function withParents(keys: Set<string>, entries: Map<string, BibEntry>): Set<string> {
  const result = new Set<string>();
  const pending = [...keys];
  while (pending.length > 0) {
    const key = pending.pop() as string;
    const entry = entries.get(key);
    if (!entry || result.has(key)) {
      continue;
    }
    result.add(key);
    pending.push(...entry.parents);
  }
  return result;
}

/** Write the entries of `bibliography` referenced anywhere under `sourceDir` to `output`. */
export function writeSubset(sourceDir: string, bibliography: string, output: string): SubsetResult {
  if (!statSync(bibliography, { throwIfNoEntry: false })?.isFile()) {
    throw new ProjectError(`bibliography not found: ${bibliography}`);
  }
  const { entries, shared, duplicates } = parseBib(readFileSync(bibliography, "utf8"));
  const tokens = new Set<string>();
  const cited = new Set<string>();
  for (const file of sourceFiles(sourceDir)) {
    const source = readFileSync(file, "utf8");
    for (const token of referencedTokens(source)) {
      tokens.add(token);
    }
    for (const key of explicitCitations(source)) {
      cited.add(key);
    }
  }
  const ambiguous = duplicates.filter((key) => tokens.has(key));
  if (ambiguous.length > 0) {
    throw new ProjectError(`bibliography defines these cited keys more than once: ${ambiguous.join(", ")}`);
  }
  const direct = new Set([...entries.keys()].filter((key) => tokens.has(key)));
  const wanted = withParents(direct, entries);
  // File order, not key order: BibTeX expects a crossref child before its parent.
  const kept = [...entries.keys()].filter((key) => wanted.has(key));
  const missing = [...cited].filter((key) => !entries.has(key)).sort();

  mkdirSync(dirname(output), { recursive: true });
  const source = relative(dirname(output), bibliography).split(sep).join("/");
  writeFileSync(
    output,
    `% Generated by thesis-toolkit from ${source}\n` +
      `% ${kept.length} of ${entries.size} entries used; do not edit.\n\n` +
      [...shared, ...kept.map((key) => (entries.get(key) as BibEntry).text)].join("\n\n") +
      "\n",
  );
  return { kept: kept.length, total: entries.size, missing, duplicates };
}
