import { homedir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Root of the installed package (the directory holding package.json). */
export const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export const fontDir = join(packageRoot, "fonts");
export const articleTemplateDir = join(packageRoot, "templates", "article");
/** Project skeleton for a zh-journal article whose body and abstracts are Markdown. */
export const journalSkeletonDir = join(packageRoot, "templates", "journal");
export const thesisTemplateDir = join(packageRoot, "templates", "ntu-thesis");
export const essayTemplateDir = join(packageRoot, "templates", "anonymous-essay");
export const journalTemplateDir = join(packageRoot, "templates", "zh-journal");

/** Directories of the Typst packages the toolkit exposes under `@local`, in the order `link` reports them. */
export const typstPackageDirs: readonly string[] = [thesisTemplateDir, essayTemplateDir, journalTemplateDir];

/** `$HOME` as the caller's environment gives it, which is also what Typst reads. */
function homeDir(env: NodeJS.ProcessEnv): string {
  return env.HOME || homedir();
}

/**
 * An XDG base directory counts only when it is an absolute path. The XDG specification says to
 * ignore any other value and Typst does, so a relative one must not send files under the cwd.
 */
function xdgDir(value: string | undefined): string | undefined {
  return value !== undefined && isAbsolute(value) ? value : undefined;
}

/** Per-user cache for downloaded binaries, sources, and the generated Typst package tree. */
export function cacheDir(env: NodeJS.ProcessEnv = process.env, platform: string = process.platform): string {
  const xdgCache = xdgDir(env.XDG_CACHE_HOME);
  if (xdgCache) {
    return join(xdgCache, "thesis-toolkit");
  }
  if (platform === "darwin") {
    return join(homeDir(env), "Library", "Caches", "thesis-toolkit");
  }
  return join(homeDir(env), ".cache", "thesis-toolkit");
}

/** Typst's per-user local package directory (the one `@local/...` imports search by default). */
export function typstUserPackageDir(env: NodeJS.ProcessEnv = process.env, platform: string = process.platform): string {
  if (platform === "darwin") {
    return join(homeDir(env), "Library", "Application Support", "typst", "packages");
  }
  return join(xdgDir(env.XDG_DATA_HOME) ?? join(homeDir(env), ".local", "share"), "typst", "packages");
}
