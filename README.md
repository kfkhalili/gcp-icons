# GCP Icons

Static asset library for **Google Cloud Platform (GCP) icons** — official SVG set, unmodified.

- **Homepage:** [gcp-icons.vercel.app](https://gcp-icons.vercel.app/)
- **Repository:** [github.com/kfkhalili/gcp-icons](https://github.com/kfkhalili/gcp-icons)
- **npm:** [gcp-icons](https://www.npmjs.com/package/gcp-icons)

Icons are sourced from Google’s official assets:

- [Category Icons](https://services.google.com/fh/files/misc/category-icons.zip)
- [Core Products Icons](https://services.google.com/fh/files/misc/core-products-icons.zip)

SVG files are **not** optimized or altered (no SVGO); brand assets stay unchanged.

## Build

```bash
pnpm install
pnpm build
```

This will:

1. Download the two ZIP files into a temporary directory
2. Extract and traverse the contents
3. Filter to `.svg` only (excludes `.png`, `__MACOSX`, `.DS_Store`, etc.)
4. Copy SVGs into `dist/icons/` with **kebab-case** file names
5. Write `dist/index.js` and `dist/index.d.ts`: icon key → path, plus `categories` and `iconToCategory` (official GCP categories from `src/data/icon-to-category.json`)

Output layout:

```
dist/
  index.js           # default = icon key → path; also .icons, .categories, .iconToCategory
  index.d.ts         # TypeScript types
  icons-metadata.json # source + category per icon (optional for tooling)
  icons/
    *.svg            # all icons, kebab-case filenames
```

## Usage

**Manifest (static import paths):**

```js
const icons = require('gcp-icons');

// Use the path for your bundler or server
const bigQueryPath = icons['bigquery-512-color']; // "icons/bigquery-512-color.svg"
```

**TypeScript:**

```ts
import icons from 'gcp-icons';

const path = icons['computeengine-512-color-rgb'];
```

**From a product icon to its category and sibling icons:**

The package exposes `categories` and `iconToCategory` so you can navigate from a product icon to the icons in its category (e.g. the category tile plus all products in that category). Category assignment follows [Google Cloud’s official product categories](https://cloud.google.com/products) (e.g. BigQuery → **Databases and analytics**); the mapping is maintained in `src/data/icon-to-category.json`.

```js
const gcp = require('gcp-icons');

// 1) Get the path for a product icon (e.g. BigQuery)
const bigQueryPath = gcp['bigquery-512-color']; // "icons/bigquery-512-color.svg"

// 2) Get the category that product belongs to (official GCP category)
const categoryKey = gcp.iconToCategory['bigquery-512-color']; // "databases-and-analytics"

// 3) Get the category display name and all icons in that category
const { name, iconKeys, productKeys } = gcp.categories[categoryKey];
// name === "Databases and analytics"
// iconKeys === ["businessintelligence-512-color", "dataanalytics-512-color", "databases-512-color"]  (category tiles)
// productKeys === ["alloydb-512-color", "bigquery-512-color", "cloudsql-512-color", "cloudspanner-512-color", "looker-512-color"]

// 4) Resolve paths for all products in the same category (e.g. for a category page or dropdown)
const productPathsInCategory = productKeys.map((key) => ({
  key,
  path: gcp[key],
}));
// [{ key: "alloydb-512-color", path: "icons/alloydb-512-color.svg" }, ...]

// 5) Get all categories (e.g. for a category nav or filter)
const allCategoryKeys = Object.keys(gcp.categories);
const allCategories = Object.entries(gcp.categories).map(([key, { name, iconKeys, productKeys }]) => ({
  key,
  name,
  iconKeys,
  productKeys,
}));
// [{ key: "ai-ml", name: "AI/ML", iconKeys: [...], productKeys: [...] }, ...]
```

**Direct file reference (e.g. in HTML or after copying `dist`):**

```html
<img src="dist/icons/computeengine-512-color-rgb.svg" alt="Compute Engine" />
```

## Scripts

| Script              | Description                                              |
|---------------------|----------------------------------------------------------|
| `pnpm build`        | Full pipeline: clean → download → cleanup → manifest    |
| `pnpm clean`        | Remove `dist` and `.gcp-icons-temp`                      |
| `pnpm download:icons` | Download both GCP ZIPs into `.gcp-icons-temp`          |
| `pnpm cleanup:icons`  | Copy SVGs from temp to `dist/icons` (kebab-case names) |
| `pnpm generate:data` | Generate `dist/index.js` and `dist/index.d.ts` from icons, metadata, and icon-to-category mapping |
| `pnpm lint`         | Run Biome check                                         |
| `pnpm fmt`          | Run Biome format                                        |

You can run steps individually (e.g. `download:icons` then `cleanup:icons` then `generate:data`) or use `build` to do all at once.

## License

MIT. Icon assets are sourced from [Google Cloud’s official icon library](https://cloud.google.com/icons); refer to that page for current usage guidelines.
