/**
 * GCP Icons: generate dist/index.js and dist/index.d.ts from dist/icons + icons-metadata.json.
 * Exposes icons (path map), categories (per-category icon/product keys), and iconToCategory so
 * users can go from a product icon to its category and then to all icons in that category.
 */

import { promises } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileUtf8 } from './lib/io.ts';
import {
  baseNameWithoutExt,
  buildManifest,
  isSvgFileName,
  toKebabCase,
} from './lib/pure.ts';

type IconMetadataEntry = {
  key: string;
  source: 'category' | 'core-products';
  categoryKey: string;
  categoryName: string;
};

type CategoriesMap = Record<
  string,
  { name: string; iconKeys: string[]; productKeys: string[] }
>;

const DATA_DIR = join(process.cwd(), 'src', 'data');

/**
 * Reads dist/icons, icons-metadata.json, and the authoritative icon-to-category mapping (from cloud.google.com/products);
 * writes index.js with official GCP categories so each core product is under its real category (e.g. BigQuery → Databases and analytics).
 */
export async function generateManifest(distDir: string): Promise<void> {
  const iconsDir = join(distDir, 'icons');
  const names = await promises.readdir(iconsDir);
  const svgFiles = names.filter((n) => isSvgFileName(n));

  const entries = svgFiles.map((filename) => ({
    key: baseNameWithoutExt(filename),
    relativeFilePath: `icons/${filename}`,
  }));
  const icons = buildManifest(entries);

  const metadataPath = join(distDir, 'icons-metadata.json');
  let metadata: IconMetadataEntry[] = [];
  try {
    const raw = await promises.readFile(metadataPath, 'utf8');
    metadata = JSON.parse(raw) as IconMetadataEntry[];
  } catch {
    console.warn(
      `No ${metadataPath}; categories and iconToCategory will be empty.`,
    );
  }

  let iconToCategoryMap: Record<string, string> = {};
  let categoryNames: Record<string, string> = {};
  try {
    const mapRaw = await promises.readFile(
      join(DATA_DIR, 'icon-to-category.json'),
      'utf8',
    );
    iconToCategoryMap = JSON.parse(mapRaw) as Record<string, string>;
    const namesRaw = await promises.readFile(
      join(DATA_DIR, 'category-names.json'),
      'utf8',
    );
    categoryNames = JSON.parse(namesRaw) as Record<string, string>;
  } catch (err) {
    console.warn('Could not load icon-to-category or category-names:', err);
  }

  const categories: CategoriesMap = {};
  const iconToCategory: Record<string, string> = {};
  for (const m of metadata) {
    if (!icons[m.key]) continue;
    const officialCategoryKey =
      iconToCategoryMap[m.key] ?? (toKebabCase(m.categoryName) || 'general');
    const displayName =
      categoryNames[officialCategoryKey] ??
      m.categoryName ??
      officialCategoryKey;

    if (!categories[officialCategoryKey]) {
      categories[officialCategoryKey] = {
        name: displayName,
        iconKeys: [],
        productKeys: [],
      };
    }
    if (m.source === 'category') {
      categories[officialCategoryKey].iconKeys.push(m.key);
    } else {
      categories[officialCategoryKey].productKeys.push(m.key);
    }
    iconToCategory[m.key] = officialCategoryKey;
  }

  // Default export = flat icons map (backward compat); .categories and .iconToCategory for navigation.
  const manifestContent = `/**
 * GCP Icons: icon paths, categories, and icon -> category for navigation.
 * Usage: require('gcp-icons')['key'] -> path; .iconToCategory['key'] -> categoryKey; .categories[categoryKey] -> { name, iconKeys, productKeys }; Object.keys(.categories) -> all category keys.
 * Generated; do not edit by hand.
 */
const icons = ${JSON.stringify(icons, null, 2)};
const categories = ${JSON.stringify(categories, null, 2)};
const iconToCategory = ${JSON.stringify(iconToCategory, null, 2)};
module.exports = icons;
module.exports.icons = icons;
module.exports.categories = categories;
module.exports.iconToCategory = iconToCategory;
`;
  await writeFileUtf8(join(distDir, 'index.js'), manifestContent);

  const dtsContent = `/**
 * GCP Icons manifest. Generated; do not edit by hand.
 * Default export is the icons map; also has .icons, .categories, .iconToCategory.
 */
declare const gcpIcons: Record<string, string> & {
  icons: Record<string, string>;
  categories: Record<string, { name: string; iconKeys: string[]; productKeys: string[] }>;
  iconToCategory: Record<string, string>;
};
export = gcpIcons;
`;
  await writeFileUtf8(join(distDir, 'index.d.ts'), dtsContent);

  console.info(
    `Wrote ${join(distDir, 'index.js')} and index.d.ts (${Object.keys(icons).length} icons, ${Object.keys(categories).length} categories).`,
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
