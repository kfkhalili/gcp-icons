/**
 * I/O boundary: download, extract, traverse, copy, write.
 * All side effects live here; pure naming/filtering logic is in pure.ts.
 */

import type { PathLike } from 'node:fs';
import { createWriteStream, existsSync, promises } from 'node:fs';
import type { RequestOptions } from 'node:https';
import https from 'node:https';
import { join } from 'node:path';
import type { URL } from 'node:url';
import AdmZip from 'adm-zip';
import { isSvgFileName, shouldExcludePathSegment } from './pure.ts';

/** Streams a URL to disk; rejects on non-200 or if the file is missing after the stream finishes. */
export async function downloadFile(
  url: string | RequestOptions | URL,
  filePath: PathLike,
): Promise<void> {
  const writeStream = createWriteStream(filePath);
  return new Promise((resolve, reject) => {
    const req = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        writeStream.destroy();
        response.destroy();
        reject(
          new Error(
            `Failed to download: ${response.statusCode} ${response.statusMessage}`,
          ),
        );
        return;
      }
      response.pipe(writeStream);
      writeStream.on('finish', () => {
        if (!existsSync(filePath))
          reject(new Error(`Downloaded file missing: ${filePath}`));
        else resolve();
      });
      response.on('error', (err) => {
        writeStream.destroy();
        reject(err);
      });
      writeStream.on('error', reject);
    });
    req.on('error', (err) => {
      writeStream.destroy();
      reject(err);
    });
  });
}

/** Extracts a ZIP into destPath (e.g. tempDir/category or tempDir/core-products). */
export function unzipFile(
  zipFilePath: string,
  destPath: string,
): Promise<void> {
  return Promise.resolve().then(() => {
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(destPath, true);
  });
}

export async function ensureDir(dirPath: string): Promise<void> {
  await promises.mkdir(dirPath, { recursive: true });
}

type SvgPathEntry = { absolutePath: string; relativePath: string };

/**
 * Recursively collects SVG file paths under rootDir. Excludes __MACOSX, .DS_Store, and non-SVG
 * so we don't copy junk from the GCP ZIPs into dist. Returns relativePath from rootDir for stable naming.
 */
export async function collectSvgPaths(
  rootDir: string,
): Promise<SvgPathEntry[]> {
  async function walk(dir: string, relDir: string): Promise<SvgPathEntry[]> {
    const entries = await promises.readdir(dir, { withFileTypes: true });
    const valid = entries.filter((e) => !shouldExcludePathSegment(e.name));

    // Reduce instead of mutable array + for-loop: each step returns a new array (functional style).
    return valid.reduce<Promise<SvgPathEntry[]>>(async (accP, entry) => {
      const acc = await accP;
      const absPath = join(dir, entry.name);
      const relPath = join(relDir, entry.name);

      if (entry.isDirectory()) {
        const sub = await walk(absPath, relPath);
        return [...acc, ...sub];
      }
      if (entry.isFile() && isSvgFileName(entry.name)) {
        return [...acc, { absolutePath: absPath, relativePath: relPath }];
      }
      return acc;
    }, Promise.resolve([]));
  }

  return walk(rootDir, '');
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await promises.copyFile(src, dest);
}

export async function writeFileUtf8(
  filePath: string,
  content: string,
): Promise<void> {
  await promises.writeFile(filePath, content, 'utf8');
}

export async function rmRecursive(path: string): Promise<void> {
  await promises.rm(path, { recursive: true, force: true });
}

export async function unlink(path: string): Promise<void> {
  await promises.unlink(path);
}
