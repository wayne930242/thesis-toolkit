import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** Create a temp directory populated with `files` (relative path → content). */
export function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "thesis-toolkit-"));
  for (const [path, content] of Object.entries(files)) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return root;
}
