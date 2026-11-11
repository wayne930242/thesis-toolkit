import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { requireConfig } from "../config.ts";
import { ProjectError, ToolkitError } from "../errors.ts";
import { articleTemplateDir, journalSkeletonDir } from "../paths.ts";

export const newProjectUsage = `thesis-toolkit new-project <slug> "<Title>" [--template article|journal]

  Create <projectsDir>/<slug>/ from a skeleton with the title filled in.
    article  (default) a Typst article with chapters/section1.typ
    journal  a zh-journal article whose body.md, abstract.md, and abstract-en.md are Markdown
  <slug> is lowercase kebab-case. Compile it with: thesis-toolkit compile <slug> main`;

/** Skeleton directories by `--template` name. */
const SKELETONS: Readonly<Record<string, string>> = { article: articleTemplateDir, journal: journalSkeletonDir };

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
/** The skeleton's title, as the string literal it must stay: markup would interpret a title's `$`, `*`, `#`, `@`, `<`, `//`. */
const TITLE_LITERAL = '"{Article Title}"';

/** Escape text for the inside of a Typst string literal: backslash and double quote. */
export function escapeTypst(text: string): string {
  return text.replace(/[\\"]/g, (char) => `\\${char}`);
}

/** Split `--template <name>` (or `--template=<name>`) from the positional arguments. */
function parseArgs(args: string[]): { positional: string[]; template: string } {
  const positional: string[] = [];
  let template = "article";
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (arg === "--template") {
      const value = args[++i];
      if (value === undefined) {
        throw new ToolkitError(`--template needs a name\nusage:\n${newProjectUsage}`);
      }
      template = value;
    } else if (arg.startsWith("--template=")) {
      template = arg.slice("--template=".length);
    } else {
      positional.push(arg);
    }
  }
  return { positional, template };
}

export function newProject(args: string[], cwd: string): number {
  const { positional, template } = parseArgs(args);
  const [slug, title] = positional;
  if (positional.length !== 2 || !slug || !title) {
    throw new ToolkitError(`usage:\n${newProjectUsage}`);
  }
  const skeleton = Object.hasOwn(SKELETONS, template) ? SKELETONS[template] : undefined;
  if (skeleton === undefined) {
    throw new ProjectError(`unknown template: ${template} (choose ${Object.keys(SKELETONS).join(" or ")})`);
  }
  if (!SLUG.test(slug)) {
    throw new ProjectError(`slug must be lowercase kebab-case: ${slug}`);
  }
  const { projectsDir } = requireConfig(cwd);
  if (!existsSync(projectsDir)) {
    throw new ProjectError(`projects directory not found: ${projectsDir}`);
  }
  const target = join(projectsDir, slug);
  if (existsSync(target)) {
    throw new ProjectError(`${target} already exists`);
  }

  cpSync(skeleton, target, { recursive: true });
  rmSync(join(target, "README.md"), { force: true });
  const main = join(target, "src", "main", "main.typ");
  // A function replacer: in a replacement string, `$&` and `$1` in the title would expand.
  writeFileSync(main, readFileSync(main, "utf8").replaceAll(TITLE_LITERAL, () => `"${escapeTypst(title)}"`));

  console.log(`created ${target}`);
  console.log(`compile with: thesis-toolkit compile ${slug} main`);
  return 0;
}
