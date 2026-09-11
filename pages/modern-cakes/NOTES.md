# /pages/modern-cakes

Catalog grid for Modern/trending Cakes, filterable by occasion. Backs [/modern-cakes.html](../../modern-cakes.html).

## Files

- **modern-cakes.css** — page hero banner, `.filter-bar`/`.filter-chip` styles; the grid itself reuses `.cake-grid`/`.cake-card` from [/shared/base.css](../../shared/base.css).
- **modern-cakes.js** —
  - `formatOccasion(slug)`: `"baby-shower"` → `"Baby Shower"`.
  - `renderFilterBar(cakes)`: builds an "All" chip plus one chip per unique `occasion` value found in the data.
  - `renderGrid(cakes)`: renders a given cake list into `#catalog-grid`, using `cakeThumbMarkup()` (from [/shared/utils.js](../../shared/utils.js)) for each thumbnail — a real uploaded photo if set, else the placeholder.
  - `applyFilter(occasion)`: filters the in-memory `ALL_CAKES` list and re-renders.
  - `initModernCakesPage()`: loads the data once, then renders the filter bar and full grid. Runs on `DOMContentLoaded`.

## Data source

`/data/modern-cakes.json`. Filtering is done client-side against the already-fetched list, not re-fetched per filter click. See [/data/NOTES.md](../../data/NOTES.md).

## Mount points expected in modern-cakes.html

`#filter-bar`, `#catalog-grid`.
