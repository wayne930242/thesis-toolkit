#!/usr/bin/env bash
# Fail when the npm tarball would ship repository-only files, miss runtime files, or carry a
# non-executable CLI.
set -euo pipefail

# `npm pack --json` prints an array up to npm 11 and an object keyed by package name from npm 12.
files="$(npm pack --dry-run --json --ignore-scripts | node -e '
  const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
  const pack = Array.isArray(data) ? data[0] : Object.values(data)[0];
  console.error(`tarball: ${(pack.size / 1e6).toFixed(1)} MB packed, ${(pack.unpackedSize / 1e6).toFixed(1)} MB unpacked, ${pack.files.length} files`);
  for (const file of pack.files) {
    const executable = (file.mode & 0o111) !== 0 ? "x" : "-";
    console.log(`${executable} ${file.path}`);
  }
')"
paths="$(cut -c3- <<<"$files")"

forbidden="$(grep -E '^(lean|docs|scripts|test|src|\.github)/|\.pdf$' <<<"$paths" || true)"
if [[ -n "$forbidden" ]]; then
    echo "repository-only files in the tarball:" >&2
    echo "$forbidden" >&2
    exit 1
fi
for required in dist/cli.js templates/ntu-thesis/typst.toml templates/ntu-thesis/lib.typ \
    templates/article/src/main/main.typ fonts/NotoSerifTC-Regular.otf fonts/OFL.txt LICENSE README.md; do
    grep -qx "$required" <<<"$paths" || { echo "missing from the tarball: $required" >&2; exit 1; }
done
grep -qx "x dist/cli.js" <<<"$files" \
    || { echo "dist/cli.js must be executable in the tarball (npm run build sets it)" >&2; exit 1; }
echo "pack contents ok"
