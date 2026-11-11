import { fontDir, typstUserPackageDir } from "../paths.ts";
import { linkPackage, pruneStaleLinks, toolkitPackages } from "../typst.ts";

export const linkUsage = `thesis-toolkit link

  Symlink the toolkit's Typst packages into Typst's user package directory so editors
  (Tinymist) and plain \`typst\` resolve @local/ntu-thesis, @local/anonymous-essay, and
  @local/zh-journal, and print the font directory to put in the editor's font paths. Rerun after
  upgrading thesis-toolkit: it removes its links at package versions the upgrade replaced.`;

export function link(): number {
  const root = typstUserPackageDir();
  for (const pkg of toolkitPackages()) {
    const id = `@${pkg.namespace}/${pkg.name}`;
    const target = linkPackage(root, pkg);
    console.log(`${id}:${pkg.version} → ${target}`);
    for (const version of pruneStaleLinks(root, pkg)) {
      console.log(`  removed stale link ${id}:${version}; update imports to ${id}:${pkg.version}`);
    }
  }
  console.log(`font path: ${fontDir}`);
  return 0;
}
