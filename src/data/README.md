# Authoritative category data

These files drive the **official GCP category** assignment in the published manifest (so e.g. BigQuery → **Databases and analytics**). They are read at build time by `generate.data.ts`.

- **`icon-to-category.json`** — Maps each icon key to a category key (e.g. `"bigquery-512-color": "databases-and-analytics"`). Category keys and assignments follow [Google Cloud’s product categories](https://cloud.google.com/products). Update this when adding new icons or when Google’s categorization changes.

- **`category-names.json`** — Maps category key to display name (e.g. `"databases-and-analytics": "Databases and analytics"`). Matches the [Browse by category](https://cloud.google.com/products) list on cloud.google.com/products.
