import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
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

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new DownloadError(`GET ${url} failed: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
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

async function ensureResearchHub(cache: string): Promise<string> {
  const { target, sha256 } = RESEARCH_HUB.binaries[platformKey()] as { target: string; sha256: string };
  const binary = join(cache, `research-hub-${RESEARCH_HUB.version}-${target}`);
  if (existsSync(binary)) {
    return binary;
  }
  const url = `https://github.com/${RESEARCH_HUB.repo}/releases/download/v${RESEARCH_HUB.version}/rust-research-mcp-${target}`;
  log(`downloading research-hub ${RESEARCH_HUB.version} (${target})`);
  const data = await download(url);
  const actual = createHash("sha256").update(data).digest("hex");
  if (actual !== sha256) {
    throw new DownloadError(`checksum mismatch for ${url}: expected ${sha256 || "(unset)"}, got ${actual}`);
  }
  const temp = `${binary}.${process.pid}.tmp`;
  writeFileSync(temp, data);
  chmodSync(temp, 0o755);
  renameSync(temp, binary);
  return binary;
}

async function ensurePaperSearch(cache: string): Promise<string> {
  const dir = join(cache, `paper-search-mcp-${PAPER_SEARCH.rev}`);
  if (existsSync(join(dir, "pyproject.toml"))) {
    return dir;
  }
  const url = `https://codeload.github.com/${PAPER_SEARCH.repo}/tar.gz/${PAPER_SEARCH.rev}`;
  log(`downloading paper-search-mcp ${PAPER_SEARCH.rev.slice(0, 7)}`);
  const archive = join(cache, `paper-search-mcp-${process.pid}.tar.gz`);
  const temp = `${dir}.${process.pid}.tmp`;
  writeFileSync(archive, await download(url));
  try {
    mkdirSync(temp, { recursive: true });
    const tar = spawnSync("tar", ["-xzf", archive, "-C", temp, "--strip-components=1"], { encoding: "utf8" });
    if (tar.status !== 0) {
      throw new DownloadError(`cannot extract ${url}: ${tar.stderr || tar.error?.message}`);
    }
    if (!existsSync(join(temp, "pyproject.toml"))) {
      throw new DownloadError(`${url} has no pyproject.toml`);
    }
    renameSync(temp, dir);
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
