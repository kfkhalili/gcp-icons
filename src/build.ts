/**
 * GCP Icons build pipeline: download → cleanup (copy to dist/icons) → generate manifest.
 * Orchestrates download.ts, cleanup.ts, and generate.data.ts; removes temp dir when done.
 */

import { join } from 'node:path';
import { processToDist } from './cleanup.js';
import { downloadAndExtract } from './download.js';
import { generateManifest } from './generate.data.js';
import { rmRecursive } from './lib/io.js';

const TEMP_DIR = join(process.cwd(), '.gcp-icons-temp');
const DIST_DIR = join(process.cwd(), 'dist');
const ICONS_DIR = join(DIST_DIR, 'icons');

async function run(): Promise<void> {
  await downloadAndExtract(TEMP_DIR);
  try {
    await processToDist(TEMP_DIR, ICONS_DIR);
    await generateManifest(DIST_DIR);
  } finally {
    // Always remove temp dir so we don't leave downloaded ZIP contents on disk.
    await rmRecursive(TEMP_DIR);
    console.info('Removed temp directory.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
