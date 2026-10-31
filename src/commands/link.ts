import { fontDir, typstUserPackageDir } from "../paths.ts";
import { linkPackage, toolkitPackages } from "../typst.ts";

export const linkUsage = `thesis-toolkit link

  Symlink the toolkit's Typst packages into Typst's user package directory so editors
  (Tinymist) and plain \`typst\` resolve @local/ntu-thesis and @local/anonymous-essay, and print the font directory
  to put in the editor's font paths. Rerun after upgrading thesis-toolkit.`;

export function link(): number {
  for (const pkg of toolkitPackages()) {
    const target = linkPackage(typstUserPackageDir(), pkg);
    console.log(`@${pkg.namespace}/${pkg.name}:${pkg.version} → ${target}`);
  }
  console.log(`font path: ${fontDir}`);
  return 0;
}
