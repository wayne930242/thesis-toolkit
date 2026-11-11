import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { findConfigFile, loadConfig, requireConfig } from "../config.ts";
import { writeSubset } from "../bibliography.ts";
import { ProjectError, ToolkitError } from "../errors.ts";
import { requireTypst, runTypst } from "../typst.ts";

export const compileUsage = `thesis-toolkit compile <project> <target> [-w|--watch] [--output <file.pdf>]
thesis-toolkit compile <file.typ> [-w|--watch] [--output <file.pdf>]

  <project> <target>  Compile <projectsDir>/<project>/src/<target>/main.typ to main.pdf beside it.
                      Writes <project>/references.generated.bib with the entries of the configured
                      bibliography that the project's .typ and .md files reference, and passes it as
                      --input bib-path=<root-relative path>.
  <file.typ>          Compile one file to <file>.pdf.
  -w, --watch         Recompile on change (restart after citing a new key).
  --output <file.pdf> Write the PDF there instead (relative to the working directory), for
                      example a preview that must not overwrite main.pdf.`;

interface CompileArgs {
  watch: boolean;
  output: string | undefined;
  positional: string[];
}

function parseArgs(args: string[]): CompileArgs {
  const parsed: CompileArgs = { watch: false, output: undefined, positional: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (arg === "-w" || arg === "--watch") {
      parsed.watch = true;
    } else if (arg === "--output" || arg.startsWith("--output=")) {
      const value = arg === "--output" ? args[++i] : arg.slice("--output=".length);
      if (value === undefined || value === "" || parsed.output !== undefined) {
        throw new ToolkitError(`--output takes one PDF path\nusage:\n${compileUsage}`);
      }
      if (!value.endsWith(".pdf")) {
        throw new ProjectError(`--output must name a .pdf file: ${value}`);
      }
      parsed.output = value;
    } else if (arg.startsWith("-")) {
      throw new ToolkitError(`unknown option: ${arg}\nusage:\n${compileUsage}`);
    } else {
      parsed.positional.push(arg);
    }
  }
  if (parsed.positional.length < 1 || parsed.positional.length > 2) {
    throw new ToolkitError(`usage:\n${compileUsage}`);
  }
  return parsed;
}

/** The PDF path: `--output` resolved against cwd, with its directory created, else `fallback`. */
function outputPath(requested: string | undefined, cwd: string, fallback: string): string {
  if (requested === undefined) {
    return fallback;
  }
  const output = resolve(cwd, requested);
  mkdirSync(dirname(output), { recursive: true });
  return output;
}

function subdirectories(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

function requireDir(dir: string, what: string, parent: string): void {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
    const available = existsSync(parent) ? subdirectories(parent).join(", ") || "none" : "none";
    throw new ProjectError(`${what} not found: ${dir}\navailable: ${available}`);
  }
}

/** Typst resolves a leading "/" against --root, so inputs naming files must be root-relative. */
export function rootRelative(root: string, file: string): string {
  const rel = relative(root, file);
  // `..drafts` is a directory name inside the root, not a step out of it.
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new ProjectError(`${file} is outside the Typst root ${root}`);
  }
  return `/${rel.split(sep).join("/")}`;
}

export async function compile(args: string[], cwd: string): Promise<number> {
  const { watch, output: requested, positional } = parseArgs(args);
  requireTypst();

  if (positional.length === 1) {
    const input = resolve(cwd, positional[0] as string);
    if (!statSync(input, { throwIfNoEntry: false })?.isFile()) {
      throw new ProjectError(`file not found: ${input}`);
    }
    const configFile = findConfigFile(dirname(input));
    const root = configFile ? loadConfig(configFile).root : dirname(input);
    const output = outputPath(requested, cwd, join(dirname(input), `${basename(input, ".typ")}.pdf`));
    return runTypst({ watch, input, output, root, inputs: {} });
  }

  const [project, target] = positional as [string, string];
  const config = requireConfig(cwd);
  requireDir(config.projectsDir, "projects directory", dirname(config.projectsDir));
  const projectDir = join(config.projectsDir, project);
  requireDir(projectDir, `project '${project}'`, config.projectsDir);
  const targetDir = join(projectDir, "src", target);
  requireDir(targetDir, `target '${target}'`, join(projectDir, "src"));
  const input = join(targetDir, "main.typ");
  if (!existsSync(input)) {
    throw new ProjectError(`missing ${input}`);
  }

  const subset = join(projectDir, "references.generated.bib");
  // Check before writing, so a project outside the root leaves no generated file behind.
  const bibPath = rootRelative(config.root, subset);
  // The whole project, not only src/: new-project keeps chapters/ beside src/.
  const result = writeSubset(projectDir, config.bibliography, subset);
  console.error(`bibliography: ${result.kept}/${result.total} entries → ${subset}`);
  if (result.missing.length > 0) {
    console.error(`warning: cited keys missing from ${config.bibliography}: ${result.missing.join(", ")}`);
  }
  if (result.duplicates.length > 0) {
    console.error(`warning: keys defined more than once in ${config.bibliography}: ${result.duplicates.join(", ")}`);
  }

  const output = outputPath(requested, cwd, join(targetDir, "main.pdf"));
  const code = await runTypst({
    watch,
    input,
    output,
    root: config.root,
    inputs: { "bib-path": bibPath },
  });
  if (code === 0 && !watch) {
    console.error(`compiled: ${output}`);
  }
  return code;
}
