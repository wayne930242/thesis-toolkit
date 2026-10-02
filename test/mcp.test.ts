import assert from "node:assert/strict";
import { test } from "node:test";
import { PAPER_SEARCH, RESEARCH_HUB, platformKey } from "../src/commands/mcp.ts";

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
