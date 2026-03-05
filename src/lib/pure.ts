/**
 * Pure functions for GCP icon pipeline: naming, filtering, manifest building.
 * No I/O and no mutable state so logic is easy to test and reason about.
 */

const SVG_EXT = '.svg';
// GCP ZIPs sometimes include macOS metadata; we skip these so dist only has real icons.
const EXCLUDED_DIRS = ['__MACOSX'];
const EXCLUDED_BASENAMES = ['.ds_store'];
const EXCLUDED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf'];

/**
 * Converts a string to kebab-case so icon names are URL- and filesystem-safe (e.g. "Compute Engine" → "compute-engine").
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/gi, (ch) =>
      /[a-z0-9]/i.test(ch) ? ch.toLowerCase() : '-',
    )
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Returns true if the file name has a .svg extension (case-insensitive).
 */
export function isSvgFileName(fileName: string): boolean {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return ext === SVG_EXT;
}

/**
 * Returns true if the path segment should be skipped when collecting SVGs (e.g. __MACOSX, .png files).
 */
export function shouldExcludePathSegment(segment: string): boolean {
  const lower = segment.toLowerCase();
  if (EXCLUDED_DIRS.some((d) => lower === d.toLowerCase())) return true;
  if (EXCLUDED_BASENAMES.some((b) => lower === b)) return true;
  const ext = segment.includes('.')
    ? segment.slice(segment.lastIndexOf('.')).toLowerCase()
    : '';
  return EXCLUDED_EXTENSIONS.includes(ext);
}

/**
 * Returns the last segment of a path (file or dir name).
 */
export function lastPathSegment(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1] ?? 'icon';
}

/**
 * Returns the base name without extension for standardization.
 */
export function baseNameWithoutExt(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? fileName : fileName.slice(0, lastDot);
}

/**
 * Assigns unique output file names (kebab-case) and manifest keys. When multiple SVGs share the
 * same base name (e.g. from different ZIPs), we suffix with -2, -3 so nothing is overwritten.
 * Order is preserved so cleanup can zip resolved[i] with collected[i] by index.
 */
export function resolveOutputEntries(
  entries: ReadonlyArray<{ baseName: string; relativePath: string }>,
): Array<{ key: string; outputFileName: string; relativePath: string }> {
  const withKeyAndIndex = entries.map(({ baseName, relativePath }, index) => ({
    key: toKebabCase(baseName) || 'icon',
    relativePath,
    index,
  }));

  // Group by key so we can assign suffixes per group (first keeps key, rest get key-2, key-3, …).
  const grouped = withKeyAndIndex.reduce<
    Record<string, typeof withKeyAndIndex>
  >(
    (acc, e) => ({
      ...acc,
      [e.key]: [...(acc[e.key] ?? []), e],
    }),
    {},
  );

  const withOutput = Object.entries(grouped).flatMap(([key, list]) =>
    list.map((e, i) => ({
      key: i === 0 ? key : `${key}-${i + 1}`,
      outputFileName: i === 0 ? `${key}.svg` : `${key}-${i + 1}.svg`,
      relativePath: e.relativePath,
      index: e.index,
    })),
  );

  // Restore original order so processToDist can pair resolved[i] with collected[i].
  return withOutput
    .sort((a, b) => a.index - b.index)
    .map(({ key, outputFileName, relativePath }) => ({
      key,
      outputFileName,
      relativePath,
    }));
}

/**
 * Builds the manifest: icon key -> relative path (e.g. "compute-engine" -> "icons/compute-engine.svg").
 * Used for dist/index.js so consumers can look up paths by name without hardcoding.
 */
export function buildManifest(
  entries: ReadonlyArray<{ key: string; relativeFilePath: string }>,
): Record<string, string> {
  return entries.reduce<Record<string, string>>(
    (acc, { key, relativeFilePath }) => ({ ...acc, [key]: relativeFilePath }),
    {},
  );
}
