import { spawn, spawnSync } from "node:child_process";
import { lstatSync, mkdirSync, readFileSync, readlinkSync, renameSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { DependencyError, ToolkitError } from "./errors.ts";
import { cacheDir, fontDir, thesisTemplateDir } from "./paths.ts";

/** `path()` values, which the thesis template's bibliography helper relies on, need Typst 0.15. */
const MIN_TYPST: readonly [number, number] = [0, 15];

export interface TypstPackage {
  namespace: "local";
  name: string;
  version: string;
  dir: string;
}

export function thesisPackage(): TypstPackage {
  const manifest = readFileSync(join(thesisTemplateDir, "typst.toml"), "utf8");
  const field = (key: string): string => {
    const match = manifest.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, "m"));
    if (!match) {
      throw new ToolkitError(`templates/ntu-thesis/typst.toml lacks ${key}`);
    }
    return match[1] as string;
  };
  return { namespace: "local", name: field("name"), version: field("version"), dir: thesisTemplateDir };
}

/** Point `<root>/<namespace>/<name>/<version>` at the package directory, replacing a stale link. */
export function linkPackage(root: string, pkg: TypstPackage): string {
  const link = join(root, pkg.namespace, pkg.name, pkg.version);
  const existing = lstatSync(link, { throwIfNoEntry: false });
  if (existing) {
    if (!existing.isSymbolicLink()) {
      throw new ToolkitError(`${link} exists and is not a symlink; remove it to let thesis-toolkit manage it`);
    }
    if (readlinkSync(link) === pkg.dir) {
      return link;
    }
  }
  mkdirSync(dirname(link), { recursive: true });
  // Create beside the destination and rename so concurrent runs never see a missing link.
  const temp = `${link}.${process.pid}.tmp`;
  rmSync(temp, { force: true });
  symlinkSync(pkg.dir, temp, "dir");
  renameSync(temp, link);
  return link;
}

/** A `--package-path` directory that resolves this toolkit's `@local` packages. */
export function packagePath(): string {
  const root = join(cacheDir(), "typst-packages");
  linkPackage(root, thesisPackage());
  return root;
}

export function requireTypst(): void {
  const result = spawnSync("typst", ["--version"], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new DependencyError("typst is not installed; see https://github.com/typst/typst#installation");
  }
  const match = result.stdout.match(/typst (\d+)\.(\d+)/);
  const major = Number(match?.[1] ?? 0);
  const minor = Number(match?.[2] ?? 0);
  if (major < MIN_TYPST[0] || (major === MIN_TYPST[0] && minor < MIN_TYPST[1])) {
    throw new DependencyError(`typst ${MIN_TYPST.join(".")} or newer is required; found: ${result.stdout.trim()}`);
  }
}

export interface TypstRun {
  watch: boolean;
  input: string;
  output: string;
  root: string;
  inputs: Record<string, string>;
}

/** Run `typst compile|watch` with the toolkit's fonts and packages; resolves to the exit code. */
export function runTypst(run: TypstRun): Promise<number> {
  const args = [
    run.watch ? "watch" : "compile",
    run.input,
    run.output,
    "--root",
    run.root,
    "--font-path",
    fontDir,
    "--package-path",
    packagePath(),
  ];
  for (const [key, value] of Object.entries(run.inputs)) {
    args.push("--input", `${key}=${value}`);
  }
  return new Promise((resolvePromise, reject) => {
    const child = spawn("typst", args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => resolvePromise(code ?? (signal ? 1 : 0)));
  });
}
