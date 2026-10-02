#!/usr/bin/env bash
# Fail when the npm tarball would ship repository-only files or miss runtime files.
set -euo pipefail

files="$(npm pack --dry-run --json --ignore-scripts | node -e '
  const [pack] = JSON.parse(require("fs").readFileSync(0, "utf8"));
  console.error(`tarball: ${(pack.size / 1e6).toFixed(1)} MB packed, ${(pack.unpackedSize / 1e6).toFixed(1)} MB unpacked, ${pack.files.length} files`);
  for (const file of pack.files) console.log(file.path);
')"

forbidden="$(grep -E '^(lean|docs|scripts|test|src|\.github)/|\.pdf$' <<<"$files" || true)"
if [[ -n "$forbidden" ]]; then
    echo "repository-only files in the tarball:" >&2
    echo "$forbidden" >&2
    exit 1
fi
for required in dist/cli.js templates/ntu-thesis/typst.toml templates/ntu-thesis/lib.typ \
    templates/article/src/main/main.typ fonts/NotoSerifTC-Regular.otf fonts/OFL.txt LICENSE README.md; do
    grep -qx "$required" <<<"$files" || { echo "missing from the tarball: $required" >&2; exit 1; }
done
echo "pack contents ok"
