import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { findConfigFile, loadConfig, requireConfig } from "../config.ts";
import { writeSubset } from "../bibliography.ts";
import { ProjectError, ToolkitError } from "../errors.ts";
import { requireTypst, runTypst } from "../typst.ts";

export const compileUsage = `thesis-toolkit compile <project> <target> [-w|--watch]
thesis-toolkit compile <file.typ> [-w|--watch]

  <project> <target>  Compile <projectsDir>/<project>/src/<target>/main.typ to main.pdf beside it.
                      Writes <project>/references.generated.bib with only the cited entries of the
                      configured bibliography and passes it as --input bib-path=<root-relative path>.
  <file.typ>          Compile one file to <file>.pdf.
  -w, --watch         Recompile on change (restart after citing a new key).`;

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
  if (rel.startsWith("..") || resolve(root, rel) !== resolve(file)) {
    throw new ProjectError(`${file} is outside the Typst root ${root}`);
  }
  return `/${rel.split(sep).join("/")}`;
}

export async function compile(args: string[], cwd: string): Promise<number> {
  const watch = args.some((arg) => arg === "-w" || arg === "--watch");
  const unknown = args.filter((arg) => arg.startsWith("-") && arg !== "-w" && arg !== "--watch");
  const positional = args.filter((arg) => !arg.startsWith("-"));
  if (unknown.length > 0 || positional.length < 1 || positional.length > 2) {
    throw new ToolkitError(`usage:\n${compileUsage}`);
  }
  requireTypst();

  if (positional.length === 1) {
    const input = resolve(cwd, positional[0] as string);
    if (!statSync(input, { throwIfNoEntry: false })?.isFile()) {
      throw new ProjectError(`file not found: ${input}`);
    }
    const configFile = findConfigFile(dirname(input));
    const root = configFile ? loadConfig(configFile).root : dirname(input);
    const output = join(dirname(input), `${basename(input, ".typ")}.pdf`);
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
  const result = writeSubset(join(projectDir, "src"), config.bibliography, subset);
  console.error(`bibliography: ${result.kept}/${result.total} entries → ${subset}`);
  if (result.missing.length > 0) {
    console.error(`warning: cited keys missing from ${config.bibliography}: ${result.missing.join(", ")}`);
  }

  const output = join(targetDir, "main.pdf");
  const code = await runTypst({
    watch,
    input,
    output,
    root: config.root,
    inputs: { "bib-path": rootRelative(config.root, subset) },
  });
  if (code === 0 && !watch) {
    console.error(`compiled: ${output}`);
  }
  return code;
}
