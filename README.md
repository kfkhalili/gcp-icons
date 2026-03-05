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
5. Write `dist/index.js` (and `dist/index.d.ts`) as a manifest mapping icon names to relative paths

Output layout:

```
dist/
  index.js      # manifest: { "icon-name": "icons/icon-name.svg", ... }
  index.d.ts    # TypeScript types for the manifest
  icons/
    *.svg       # all icons, kebab-case filenames
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

const path = icons['compute-engine-512-color-rgb'];
```

**Direct file reference (e.g. in HTML or after copying `dist`):**

```html
<img src="dist/icons/compute-engine-512-color-rgb.svg" alt="Compute Engine" />
```

## Scripts

| Script              | Description                                              |
|---------------------|----------------------------------------------------------|
| `pnpm build`        | Full pipeline: clean → download → cleanup → manifest    |
| `pnpm clean`        | Remove `dist` and `.gcp-icons-temp`                      |
| `pnpm download:icons` | Download both GCP ZIPs into `.gcp-icons-temp`          |
| `pnpm cleanup:icons`  | Copy SVGs from temp to `dist/icons` (kebab-case names) |
| `pnpm generate:data` | Generate `dist/index.js` and `dist/index.d.ts` from icons |
| `pnpm lint`         | Run Biome check                                         |
| `pnpm fmt`          | Run Biome format                                        |

You can run steps individually (e.g. `download:icons` then `cleanup:icons` then `generate:data`) or use `build` to do all at once.

## License

MIT. Icon assets are sourced from [Google Cloud’s official icon library](https://cloud.google.com/icons); refer to that page for current usage guidelines.
