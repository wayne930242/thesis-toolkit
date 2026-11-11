import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DependencyError, DownloadError, ToolkitError } from "../errors.ts";
import { cacheDir } from "../paths.ts";

export const mcpUsage = `thesis-toolkit mcp research-hub

  Start the research-hub MCP server over stdio. Downloads the pinned research-hub binary
  (checksum-verified) and paper-search-mcp source into the cache on first use.
  RSH_* environment variables pass through (e.g. RSH_LIBRARY_API_URL, RSH_DOWNLOAD_DIRECTORY;
  RSH_LIBRARY_ADMIN_TOKEN enables save_papers_to_library).
  Requires uv for paper-search-mcp.`;

export const RESEARCH_HUB = {
  repo: "wayne930242/research_hub_mcp",
  version: "0.6.8",
  /** SHA-256 of each release asset, keyed by `${process.platform}-${process.arch}`. */
  binaries: {
    "darwin-arm64": {
      target: "aarch64-apple-darwin",
      sha256: "75584686d1dfeb799ceaa185b4cb82c3c962bb95660f12f495663dbf1348f0c8",
    },
    "linux-x64": {
      target: "x86_64-unknown-linux-musl",
      sha256: "f58f1b7ff68b1ea447d66e75dfc9e10213b6db1f8b802c10c710fb81c930997f",
    },
  } as Record<string, { target: string; sha256: string }>,
};

export const PAPER_SEARCH = {
  repo: "openags/paper-search-mcp",
  rev: "808e462a824ce6b26fdccbed352b4bf47d7b84cb",
};

/** Progress goes to stderr: stdout carries MCP traffic. */
function log(message: string): void {
  console.error(`thesis-toolkit: ${message}`);
}

/** Fetches one pinned artifact; tests substitute a local source. */
export type Download = (url: string) => Promise<Buffer>;

/** A release asset and the SHA-256 it must have. */
export interface BinaryPin {
  target: string;
  sha256: string;
}

/** Why a fetch failed: Node reports "fetch failed" and keeps the reason (ECONNREFUSED, ENOTFOUND...) in `cause`. */
function failureReason(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const cause: unknown = error.cause;
  const detail = cause instanceof Error ? cause.message || (cause as NodeJS.ErrnoException).code : undefined;
  return detail ? `${error.message} (${detail})` : error.message;
}

/** GET one artifact. No network, a refused connection, a bad status, or a body cut short is a DownloadError. */
export async function download(url: string): Promise<Buffer> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new DownloadError(`GET ${url} failed: ${failureReason(error)}`);
  }
  if (!response.ok) {
    throw new DownloadError(`GET ${url} failed: ${response.status} ${response.statusText}`);
  }
  try {
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw new DownloadError(`GET ${url} failed: ${failureReason(error)}`);
  }
}

export function platformKey(platform: string = process.platform, arch: string = process.arch): string {
  const key = `${platform}-${arch}`;
  if (!RESEARCH_HUB.binaries[key]) {
    throw new ToolkitError(
      `research-hub has no prebuilt binary for ${key}; supported: ${Object.keys(RESEARCH_HUB.binaries).join(", ")}`,
    );
  }
  return key;
}

function currentPin(): BinaryPin {
  return RESEARCH_HUB.binaries[platformKey()] as BinaryPin;
}

function sha256Of(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/** A path beside `path` that no other run uses, to build an artifact before renaming it into place. */
function tempBeside(path: string): string {
  return `${path}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
}

function readIfPresent(file: string): Buffer | undefined {
  try {
    return readFileSync(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

/**
 * The research-hub binary in `cache`, downloaded when it is missing. A cached file counts only
 * while it still has the pinned SHA-256, so a truncated or altered one is replaced, not run.
 */
export async function ensureResearchHub(
  cache: string,
  fetchArtifact: Download = download,
  pin: BinaryPin = currentPin(),
): Promise<string> {
  const { target, sha256 } = pin;
  const binary = join(cache, `research-hub-${RESEARCH_HUB.version}-${target}`);
  const cached = readIfPresent(binary);
  if (cached) {
    if (sha256Of(cached) === sha256) {
      return binary;
    }
    log(`cached research-hub ${RESEARCH_HUB.version} does not match its checksum; replacing it`);
  }
  const url = `https://github.com/${RESEARCH_HUB.repo}/releases/download/v${RESEARCH_HUB.version}/rust-research-mcp-${target}`;
  log(`downloading research-hub ${RESEARCH_HUB.version} (${target})`);
  const data = await fetchArtifact(url);
  const actual = sha256Of(data);
  if (actual !== sha256) {
    throw new DownloadError(`checksum mismatch for ${url}: expected ${sha256 || "(unset)"}, got ${actual}`);
  }
  const temp = tempBeside(binary);
  try {
    writeFileSync(temp, data);
    chmodSync(temp, 0o755);
    // Replaces whatever is there in one step; a concurrent run renames the same bytes.
    renameSync(temp, binary);
  } finally {
    rmSync(temp, { force: true });
  }
  return binary;
}

/**
 * Move an unpacked tree into place. A concurrent run may have installed the same pinned tree
 * first, and its copy is as good as ours. A directory that is there but not `complete` is a
 * leftover no run would have renamed into place, so it is replaced.
 */
function installTree(temp: string, dir: string, complete: () => boolean): void {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      renameSync(temp, dir);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOTEMPTY" && code !== "EEXIST") {
        throw error;
      }
    }
    if (complete()) {
      return;
    }
    rmSync(dir, { recursive: true, force: true });
  }
  throw new DownloadError(`cannot install ${dir}: it keeps reappearing incomplete; remove it and retry`);
}

/** The paper-search-mcp source tree in `cache`, downloaded and unpacked when it is missing or incomplete. */
export async function ensurePaperSearch(cache: string, fetchArtifact: Download = download): Promise<string> {
  const dir = join(cache, `paper-search-mcp-${PAPER_SEARCH.rev}`);
  const complete = (): boolean => existsSync(join(dir, "pyproject.toml"));
  if (complete()) {
    return dir;
  }
  const url = `https://codeload.github.com/${PAPER_SEARCH.repo}/tar.gz/${PAPER_SEARCH.rev}`;
  log(`downloading paper-search-mcp ${PAPER_SEARCH.rev.slice(0, 7)}`);
  const data = await fetchArtifact(url);
  const temp = tempBeside(dir);
  const archive = `${temp}.tar.gz`;
  try {
    writeFileSync(archive, data);
    mkdirSync(temp);
    const tar = spawnSync("tar", ["-xzf", archive, "-C", temp, "--strip-components=1"], { encoding: "utf8" });
    if (tar.status !== 0) {
      throw new DownloadError(`cannot extract ${url}: ${tar.stderr || tar.error?.message}`);
    }
    if (!existsSync(join(temp, "pyproject.toml"))) {
      throw new DownloadError(`${url} has no pyproject.toml`);
    }
    installTree(temp, dir, complete);
  } finally {
    rmSync(archive, { force: true });
    rmSync(temp, { recursive: true, force: true });
  }
  return dir;
}

export async function mcp(args: string[]): Promise<number> {
  if (args.length !== 1 || args[0] !== "research-hub") {
    throw new ToolkitError(`usage:\n${mcpUsage}`);
  }
  if (spawnSync("uv", ["--version"]).status !== 0) {
    throw new DependencyError("uv is not installed; see https://docs.astral.sh/uv/getting-started/installation/");
  }
  const cache = cacheDir();
  mkdirSync(cache, { recursive: true });
  const binary = await ensureResearchHub(cache);
  const paperSearch = await ensurePaperSearch(cache);

  const env = { ...process.env };
  env.RSH_PAPER_SEARCH_PROJECT_DIR ??= paperSearch;
  return new Promise((resolvePromise, reject) => {
    const child = spawn(binary, [], { stdio: "inherit", env });
    for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
      process.on(signal, () => child.kill(signal));
    }
    child.on("error", reject);
    child.on("exit", (code, signal) => resolvePromise(code ?? (signal ? 1 : 0)));
  });
}
