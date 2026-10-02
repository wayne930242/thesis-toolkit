import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { ConfigError } from "./errors.ts";

export const CONFIG_FILE = "thesis-toolkit.json";

/** Resolved consumer configuration; every path is absolute. */
export interface ToolkitConfig {
  file: string;
  /** Typst `--root`; root-anchored paths in documents resolve against it. */
  root: string;
  /** Directory holding `<project>/src/<target>/main.typ`. */
  projectsDir: string;
  /** Shared BibTeX file the per-project subset is cut from. */
  bibliography: string;
}

const KEYS = ["root", "projectsDir", "bibliography"] as const;

/** Find the nearest thesis-toolkit.json at or above `start`. */
export function findConfigFile(start: string): string | undefined {
  let dir = resolve(start);
  for (;;) {
    const candidate = join(dir, CONFIG_FILE);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

export function loadConfig(file: string): ToolkitConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new ConfigError(`cannot read ${file}: ${(error as Error).message}`);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ConfigError(`${file} must contain a JSON object`);
  }
  const record = raw as Record<string, unknown>;
  const base = dirname(file);
  const values: Partial<Record<(typeof KEYS)[number], string>> = {};
  for (const key of KEYS) {
    const value = record[key];
    if (typeof value !== "string" || value === "") {
      throw new ConfigError(`${file}: "${key}" must be a non-empty path string`);
    }
    values[key] = resolve(base, value);
  }
  const unknownKeys = Object.keys(record).filter((key) => !(KEYS as readonly string[]).includes(key));
  if (unknownKeys.length > 0) {
    throw new ConfigError(`${file}: unknown keys ${unknownKeys.join(", ")}`);
  }
  return {
    file,
    root: values.root as string,
    projectsDir: values.projectsDir as string,
    bibliography: values.bibliography as string,
  };
}

/** Load the config governing `cwd`, or fail with a hint on how to create one. */
export function requireConfig(cwd: string): ToolkitConfig {
  const file = findConfigFile(cwd);
  if (!file) {
    throw new ConfigError(
      `no ${CONFIG_FILE} found at or above ${cwd}. Create one, e.g.\n` +
        `{ "root": "..", "projectsDir": "projects", "bibliography": "../literature/references/bibliography.bib" }`,
    );
  }
  return loadConfig(file);
}
