import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Root of the installed package (the directory holding package.json). */
export const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export const fontDir = join(packageRoot, "fonts");
export const articleTemplateDir = join(packageRoot, "templates", "article");
export const thesisTemplateDir = join(packageRoot, "templates", "ntu-thesis");

/** Per-user cache for downloaded binaries, sources, and the generated Typst package tree. */
export function cacheDir(env: NodeJS.ProcessEnv = process.env): string {
  if (env.XDG_CACHE_HOME) {
    return join(env.XDG_CACHE_HOME, "thesis-toolkit");
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Caches", "thesis-toolkit");
  }
  return join(homedir(), ".cache", "thesis-toolkit");
}

/** Typst's per-user local package directory (the one `@local/...` imports search by default). */
export function typstUserPackageDir(env: NodeJS.ProcessEnv = process.env): string {
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "typst", "packages");
  }
  return join(env.XDG_DATA_HOME ?? join(homedir(), ".local", "share"), "typst", "packages");
}
