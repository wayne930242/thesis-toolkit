import { spawnSync } from "node:child_process";
import {
  type Dirent,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { runChild } from "./child.ts";
import { DependencyError, ToolkitError } from "./errors.ts";
import {
  cacheDir,
  essayTemplateDir,
  fontDir,
  journalTemplateDir,
  thesisTemplateDir,
  typstPackageDirs,
  typstUserPackageDir,
} from "./paths.ts";

/** `path()` values, which the thesis template's bibliography helper relies on, need Typst 0.15. */
const MIN_TYPST: readonly [number, number] = [0, 15];

export interface TypstPackage {
  namespace: "local";
  name: string;
  version: string;
  dir: string;
}

/** Read a template's name and version from its `typst.toml`. */
export function readPackage(dir: string): TypstPackage {
  const manifest = readFileSync(join(dir, "typst.toml"), "utf8");
  const field = (key: string): string => {
    const match = manifest.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, "m"));
    if (!match) {
      throw new ToolkitError(`${join(dir, "typst.toml")} lacks ${key}`);
    }
    return match[1] as string;
  };
  return { namespace: "local", name: field("name"), version: field("version"), dir };
}

export function thesisPackage(): TypstPackage {
  return readPackage(thesisTemplateDir);
}

export function essayPackage(): TypstPackage {
  return readPackage(essayTemplateDir);
}

export function journalPackage(): TypstPackage {
  return readPackage(journalTemplateDir);
}

/** Every Typst package the toolkit ships, in the order `link` reports them. */
export function toolkitPackages(): TypstPackage[] {
  return typstPackageDirs.map(readPackage);
}

/** Make `link` a symlink to `target`, replacing a link that points elsewhere but never anything else. */
function pointLink(link: string, target: string): void {
  const existing = lstatSync(link, { throwIfNoEntry: false });
  if (existing) {
    if (!existing.isSymbolicLink()) {
      throw new ToolkitError(`${link} exists and is not a symlink; remove it to let thesis-toolkit manage it`);
    }
    if (readlinkSync(link) === target) {
      return;
    }
  }
  mkdirSync(dirname(link), { recursive: true });
  // Create beside the destination and rename so concurrent runs never see a missing link.
  const temp = `${link}.${process.pid}.tmp`;
  rmSync(temp, { force: true });
  symlinkSync(target, temp, "dir");
  renameSync(temp, link);
}

/** Point `<root>/<namespace>/<name>/<version>` at the package directory, replacing a stale link. */
export function linkPackage(root: string, pkg: TypstPackage): string {
  const link = join(root, pkg.namespace, pkg.name, pkg.version);
  pointLink(link, pkg.dir);
  return link;
}

/** A Typst package version, which is also the name of its directory or link. */
const VERSION = /^\d+\.\d+\.\d+$/;

/** The entries of `dir`, or none when it does not exist. */
function entriesOf(dir: string): Dirent[] {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return [];
    }
    throw error;
  }
}

/**
 * Remove the links `linkPackage` left at other versions of this package directory, as happens
 * after a typst.toml bump: such a link resolves the old import to a manifest of another version
 * ("package manifest contains mismatched version"). Only version-named symlinks pointing at this
 * exact directory go; real directories and links to anywhere else stay. Returns the removed versions.
 */
export function pruneStaleLinks(root: string, pkg: TypstPackage): string[] {
  const dir = join(root, pkg.namespace, pkg.name);
  const removed: string[] = [];
  for (const entry of entriesOf(dir)) {
    if (entry.name === pkg.version || !VERSION.test(entry.name) || !entry.isSymbolicLink()) {
      continue;
    }
    const link = join(dir, entry.name);
    try {
      if (readlinkSync(link) !== pkg.dir) {
        continue;
      }
    } catch {
      // A concurrent run removed it first.
      continue;
    }
    rmSync(link, { force: true });
    removed.push(entry.name);
  }
  return removed.sort();
}

/** The visible subdirectories of `dir`, following links; a dangling link or unreadable entry is not one. */
function directoriesIn(dir: string): string[] {
  return entriesOf(dir)
    .map((entry) => entry.name)
    .filter((name) => {
      if (name.startsWith(".")) {
        return false;
      }
      try {
        return statSync(join(dir, name)).isDirectory();
      } catch {
        return false;
      }
    });
}

/**
 * Link every package in Typst's user package directory into the generated tree. Typst searches
 * `--package-path` instead of that directory, not in addition to it, so without this a document
 * compiled here could not import what plain `typst` resolves. The toolkit's own packages win:
 * a user entry is skipped when the toolkit ships that name and version, or when it is a link to
 * one of the toolkit's package directories (what `link` creates, possibly at a version since
 * replaced, which must stay unresolvable).
 */
function mirrorUserPackages(root: string, userDir: string, shipped: readonly TypstPackage[]): void {
  const shippedIds = new Set(shipped.map((pkg) => join(pkg.namespace, pkg.name, pkg.version)));
  const shippedDirs = new Set(shipped.map((pkg) => realpathSync(pkg.dir)));
  for (const namespace of directoriesIn(userDir)) {
    for (const name of directoriesIn(join(userDir, namespace))) {
      for (const version of directoriesIn(join(userDir, namespace, name))) {
        const source = join(userDir, namespace, name, version);
        if (!VERSION.test(version) || shippedIds.has(join(namespace, name, version)) || shippedDirs.has(realpathSync(source))) {
          continue;
        }
        pointLink(join(root, namespace, name, version), source);
      }
    }
  }
}

/**
 * A `--package-path` directory that resolves this toolkit's `@local` packages and the packages in
 * the user's own Typst package directory.
 */
export function packagePath(): string {
  const root = join(cacheDir(), "typst-packages");
  const shipped = toolkitPackages();
  for (const pkg of shipped) {
    linkPackage(root, pkg);
    pruneStaleLinks(root, pkg);
  }
  mirrorUserPackages(root, typstUserPackageDir(), shipped);
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
  return runChild("typst", args);
}
