# /pages/legacy-cakes

Catalog grid for Legacy/Traditional Cakes. Backs [/legacy-cakes.html](../../legacy-cakes.html).

## Files

- **legacy-cakes.css** — page hero banner; the catalog grid itself reuses `.cake-grid`/`.cake-card` from [/shared/base.css](../../shared/base.css).
- **legacy-cakes.js** — `renderCatalog()`: loads all legacy cakes and renders each as a card linking to `cake.html?id=<id>`, using `cakeThumbMarkup()` (from [/shared/utils.js](../../shared/utils.js)) for the thumbnail — a real uploaded photo if the admin panel has set one, else the placeholder. Runs on `DOMContentLoaded`.

## Data source

`/data/legacy-cakes.json` (full list, no filtering). See [/data/NOTES.md](../../data/NOTES.md).

## Mount points expected in legacy-cakes.html

`#catalog-grid`.
