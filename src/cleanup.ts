/**
 * GCP Icons: process extracted temp dir — filter to SVGs only, copy to dist/icons with kebab-case names.
 * Expects .gcp-icons-temp to exist (run download.ts first). Does not modify SVG contents.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectSvgPaths,
  copyFile,
  ensureDir,
  writeFileUtf8,
} from './lib/io.ts';
import {
  baseNameWithoutExt,
  getCategoryFromRelativePath,
  lastPathSegment,
  resolveOutputEntries,
} from './lib/pure.ts';

/** Metadata for one icon: key, path, and category so consumers can go from product → category → icons in that category. */
export type IconMetadataEntry = {
  key: string;
  source: 'category' | 'core-products';
  categoryKey: string;
  categoryName: string;
};

/**
 * Traverses tempDir, collects SVG paths (excluding __MACOSX, .DS_Store, non-SVG),
 * copies files to iconsDir with standardized kebab-case filenames. SVG contents are not modified.
 * Writes icons-metadata.json (source + folder-derived category per icon) next to iconsDir; generate.data
 * uses it together with src/data/icon-to-category.json to build official categories and iconToCategory.
 */
export async function processToDist(
  tempDir: string,
  iconsDir: string,
): Promise<void> {
  const collected = await collectSvgPaths(tempDir);
  // Normalize path separators so resolveOutputEntries works the same on Windows and Unix.
  const entriesForResolve = collected.map(({ relativePath }) => ({
    baseName: baseNameWithoutExt(lastPathSegment(relativePath)),
    relativePath: relativePath.replace(/\\/g, '/'),
  }));
  const resolved = resolveOutputEntries(entriesForResolve);

  await ensureDir(iconsDir);
  // resolved is in the same order as collected (resolveOutputEntries preserves index), so we zip by position.
  const copyTasks = resolved.map((r, i) =>
    copyFile(collected[i].absolutePath, join(iconsDir, r.outputFileName)),
  );
  await Promise.all(copyTasks);

  const metadata: IconMetadataEntry[] = resolved.map((r, i) => {
    const { source, categoryKey, categoryName } = getCategoryFromRelativePath(
      collected[i].relativePath,
    );
    return { key: r.key, source, categoryKey, categoryName };
  });
  const metadataPath = join(iconsDir, '..', 'icons-metadata.json');
  await writeFileUtf8(metadataPath, JSON.stringify(metadata, null, 2));

  console.info(
    `Copied ${resolved.length} SVGs to ${iconsDir}; wrote ${metadataPath}`,
  );
}

const TEMP_DIR = join(process.cwd(), '.gcp-icons-temp');
const ICONS_DIR = join(process.cwd(), 'dist', 'icons');

async function main(): Promise<void> {
  await processToDist(TEMP_DIR, ICONS_DIR);
  console.info('Cleanup complete. Run generate:data next.');
}

// Only run when executed as a script; skip when imported by build.ts.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
