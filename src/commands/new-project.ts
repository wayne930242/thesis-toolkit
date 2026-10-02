import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { requireConfig } from "../config.ts";
import { ProjectError, ToolkitError } from "../errors.ts";
import { articleTemplateDir } from "../paths.ts";

export const newProjectUsage = `thesis-toolkit new-project <slug> "<Title>"

  Create <projectsDir>/<slug>/ from the article skeleton with the title filled in.
  <slug> is lowercase kebab-case. Compile it with: thesis-toolkit compile <slug> main`;

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const PLACEHOLDER = "{Article Title}";

/** Escape for both a Typst string literal and markup: backslash and double quote. */
export function escapeTypst(text: string): string {
  return text.replace(/[\\"]/g, (char) => `\\${char}`);
}

export function newProject(args: string[], cwd: string): number {
  const [slug, title] = args;
  if (args.length !== 2 || !slug || !title) {
    throw new ToolkitError(`usage:\n${newProjectUsage}`);
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

  cpSync(articleTemplateDir, target, { recursive: true });
  rmSync(join(target, "README.md"), { force: true });
  const main = join(target, "src", "main", "main.typ");
  writeFileSync(main, readFileSync(main, "utf8").replaceAll(PLACEHOLDER, escapeTypst(title)));

  console.log(`created ${target}`);
  console.log(`compile with: thesis-toolkit compile ${slug} main`);
  return 0;
}
