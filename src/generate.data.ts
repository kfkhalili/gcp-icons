/**
 * GCP Icons: generate dist/index.js and dist/index.d.ts manifest from dist/icons.
 * Run after cleanup.ts. Maps each icon filename (kebab-case base name) to "icons/<filename>.svg".
 */

import { promises } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileUtf8 } from './lib/io';
import {
  baseNameWithoutExt,
  buildManifest,
  isSvgFileName,
} from './lib/pure';

/**
 * Reads icons from dist/icons and writes the manifest (index.js + index.d.ts) into distDir.
 * Can be run standalone after a manual copy to dist/icons, or as the final build step.
 */
export async function generateManifest(distDir: string): Promise<void> {
  const iconsDir = join(distDir, 'icons');
  const names = await promises.readdir(iconsDir);
  // Ignore any non-SVG files that might have been dropped into icons (e.g. README).
  const svgFiles = names.filter((n) => isSvgFileName(n));

  const entries = svgFiles.map((filename) => ({
    key: baseNameWithoutExt(filename),
    relativeFilePath: `icons/${filename}`,
  }));
  const manifest = buildManifest(entries);

  // CommonJS so bundlers and Node can require('gcp-icons') without "type": "module".
  const manifestContent = `/**
 * GCP Icons manifest: standardized icon name -> relative path.
 * Generated; do not edit by hand.
 */
module.exports = ${JSON.stringify(manifest, null, 2)};
`;
  await writeFileUtf8(join(distDir, 'index.js'), manifestContent);

  // TypeScript declaration for the manifest so consumers get typed icon paths.
  const dtsContent = `/**
 * GCP Icons manifest: standardized icon name -> relative path.
 * Generated; do not edit by hand.
 */
declare const icons: Record<string, string>;
export = icons;
`;
  await writeFileUtf8(join(distDir, 'index.d.ts'), dtsContent);

  console.info(
    `Wrote ${join(distDir, 'index.js')} and index.d.ts (${Object.keys(manifest).length} icons).`,
  );
}

const DIST_DIR = join(process.cwd(), 'dist');

async function main(): Promise<void> {
  await generateManifest(DIST_DIR);
}

// Only run when executed as a script (e.g. pnpm generate:data); skip when imported by build.ts.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
