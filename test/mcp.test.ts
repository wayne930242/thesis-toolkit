import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { test } from "node:test";
import {
  type BinaryPin,
  type Download,
  PAPER_SEARCH,
  RESEARCH_HUB,
  download,
  ensurePaperSearch,
  ensureResearchHub,
  platformKey,
} from "../src/commands/mcp.ts";
import { DownloadError } from "../src/errors.ts";
import { fixture } from "./helpers.ts";

const BINARY = Buffer.from("#!/bin/sh\necho research-hub stand-in\n");
const PIN: BinaryPin = { target: "test-target", sha256: createHash("sha256").update(BINARY).digest("hex") };
const BINARY_NAME = `research-hub-${RESEARCH_HUB.version}-${PIN.target}`;
const SOURCE_NAME = `paper-search-mcp-${PAPER_SEARCH.rev}`;

/** A tarball shaped like GitHub's: one top-level directory holding the project. */
function sourceArchive(): Buffer {
  const dir = fixture({
    "paper-search-mcp-main/pyproject.toml": '[project]\nname = "paper-search-mcp"\n',
    "paper-search-mcp-main/paper_search_mcp/server.py": "",
  });
  const tar = spawnSync("tar", ["-czf", "-", "-C", dir, "paper-search-mcp-main"]);
  assert.equal(tar.status, 0, String(tar.stderr));
  return tar.stdout;
}

/** A downloader that serves the stand-in artifacts from memory and records what was asked for. */
function localSource(): { fetchArtifact: Download; urls: string[] } {
  const archive = sourceArchive();
  const urls: string[] = [];
  return {
    urls,
    fetchArtifact: async (url) => {
      urls.push(url);
      // Yield first, so every caller that started together is mid-download before any finishes.
      await new Promise((resolve) => setImmediate(resolve));
      return url.includes("/tar.gz/") ? archive : BINARY;
    },
  };
}

async function withServer(handler: Parameters<typeof createServer>[1], body: (origin: string) => Promise<void>): Promise<void> {
  const server: Server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await body(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

test("platformKey accepts supported platforms and names the others", () => {
  assert.equal(platformKey("darwin", "arm64"), "darwin-arm64");
  assert.equal(platformKey("linux", "x64"), "linux-x64");
  assert.throws(() => platformKey("win32", "x64"), /no prebuilt binary for win32-x64/);
});

test("every pinned artifact has a full checksum or commit", () => {
  for (const [key, binary] of Object.entries(RESEARCH_HUB.binaries)) {
    assert.match(binary.sha256, /^[0-9a-f]{64}$/, `research-hub ${key} checksum`);
  }
  assert.match(PAPER_SEARCH.rev, /^[0-9a-f]{40}$/);
});

test("concurrent first runs against an empty cache all succeed and leave one clean cache", async () => {
  const cache = fixture({});
  const { fetchArtifact } = localSource();
  const firstRun = async (): Promise<string[]> => [
    await ensureResearchHub(cache, fetchArtifact, PIN),
    await ensurePaperSearch(cache, fetchArtifact),
  ];
  const runs = await Promise.all([firstRun(), firstRun(), firstRun()]);
  for (const run of runs) {
    assert.deepEqual(run, [join(cache, BINARY_NAME), join(cache, SOURCE_NAME)]);
  }
  assert.deepEqual(readFileSync(join(cache, BINARY_NAME)), BINARY);
  assert.notEqual(statSync(join(cache, BINARY_NAME)).mode & 0o111, 0, "the binary must be executable");
  assert.ok(existsSync(join(cache, SOURCE_NAME, "pyproject.toml")));
  assert.deepEqual(readdirSync(cache).sort(), [SOURCE_NAME, BINARY_NAME].sort(), "temporary files were left behind");
});

test("a cached binary that no longer matches its checksum is downloaded again", async () => {
  const cache = fixture({ [BINARY_NAME]: BINARY.subarray(0, 10).toString() });
  const { fetchArtifact, urls } = localSource();
  const binary = await ensureResearchHub(cache, fetchArtifact, PIN);
  assert.deepEqual(readFileSync(binary), BINARY, "the truncated binary was kept");
  assert.notEqual(statSync(binary).mode & 0o111, 0, "the binary must be executable");
  assert.equal(urls.length, 1);

  await ensureResearchHub(cache, fetchArtifact, PIN);
  assert.equal(urls.length, 1, "an intact cached binary must not be downloaded again");
});

test("a source directory left without pyproject.toml is replaced", async () => {
  const cache = fixture({ [`${SOURCE_NAME}/leftover.txt`]: "partial" });
  const { fetchArtifact } = localSource();
  const dir = await ensurePaperSearch(cache, fetchArtifact);
  assert.ok(existsSync(join(dir, "pyproject.toml")));
  assert.equal(existsSync(join(dir, "leftover.txt")), false);
  assert.deepEqual(readdirSync(cache), [SOURCE_NAME]);
});

test("a download that fails its checksum is rejected and nothing is cached", async () => {
  const cache = fixture({});
  const wrong: Download = async () => Buffer.from("not the pinned binary");
  await assert.rejects(ensureResearchHub(cache, wrong, PIN), (error: unknown) => {
    assert.ok(error instanceof DownloadError);
    assert.match(error.message, /checksum mismatch/);
    return true;
  });
  assert.deepEqual(readdirSync(cache), []);
});

test("download turns every way a fetch can fail into a DownloadError naming the URL", async () => {
  await withServer(
    (request, response) => {
      if (request.url === "/missing") {
        response.writeHead(404).end();
        return;
      }
      // Promise 1000 bytes, send 10, and drop the connection.
      response.writeHead(200, { "Content-Length": "1000" });
      response.write("0123456789", () => response.destroy());
    },
    async (origin) => {
      await assert.rejects(download(`${origin}/missing`), (error: unknown) => {
        assert.ok(error instanceof DownloadError, String(error));
        assert.match(error.message, /\/missing failed: 404/);
        return true;
      });
      await assert.rejects(download(`${origin}/cut-short`), (error: unknown) => {
        assert.ok(error instanceof DownloadError, `not a DownloadError: ${String(error)}`);
        assert.ok(error.message.startsWith(`GET ${origin}/cut-short failed: `), error.message);
        return true;
      });
    },
  );

  // Nothing listens on a port a closed server just released.
  let closed = "";
  await withServer(() => {}, async (origin) => {
    closed = origin;
  });
  await assert.rejects(download(`${closed}/binary`), (error: unknown) => {
    assert.ok(error instanceof DownloadError, `not a DownloadError: ${String(error)}`);
    assert.match(error.message, /^GET http:\/\/127\.0\.0\.1:\d+\/binary failed: .*ECONNREFUSED/);
    return true;
  });
});
