/**
 * GCP Icons: download category + core-products ZIPs and extract to a temp directory.
 * Run after clean; run cleanup.ts next to copy SVGs to dist/icons.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { downloadFile, ensureDir, unlink, unzipFile } from './lib/io';

// Official GCP icon ZIPs: categories (e.g. Compute, Storage) and core products (e.g. BigQuery, GKE).
const GCP_ZIP_URLS = [
  'https://services.google.com/fh/files/misc/category-icons.zip',
  'https://services.google.com/fh/files/misc/core-products-icons.zip',
] as const;

/**
 * Downloads both GCP icon ZIPs and extracts them into tempDir.
 * Does not delete tempDir; caller (build.ts) removes it so we avoid leaving artifacts on disk.
 */
export async function downloadAndExtract(tempDir: string): Promise<void> {
  await ensureDir(tempDir);

  // Download in parallel so we get both ZIP paths without mutable state.
  const zipPaths = await Promise.all(
    GCP_ZIP_URLS.map(async (url, i) => {
      const zipPath = join(tempDir, `gcp-${i}.zip`);
      await downloadFile(url, zipPath);
      console.info(`Downloaded: ${url}`);
      return zipPath;
    }),
  );

  // Extract all into the same temp dir; adm-zip merges contents (overwrites on collision).
  await Promise.all(
    zipPaths.map(async (zipPath) => {
      await unzipFile(zipPath, tempDir);
      console.info(`Extracted: ${zipPath}`);
    }),
  );

  // Remove ZIPs after extract to save disk; we only need the expanded files for cleanup.
  await Promise.all(zipPaths.map(unlink));
}

const TEMP_DIR = join(process.cwd(), '.gcp-icons-temp');

async function main(): Promise<void> {
  await downloadAndExtract(TEMP_DIR);
  console.info('Download and extract complete. Run cleanup next.');
}

// Only run main when this file is executed directly (e.g. pnpm download:icons), not when imported by build.ts.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
