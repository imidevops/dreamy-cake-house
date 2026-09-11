# /pages/gallery

Visual gallery combining every legacy + modern cake into one grid. Backs [/gallery.html](../../gallery.html).

## Files

- **gallery.css** — responsive tile grid, hover caption overlay.
- **gallery.js** — `renderGallery()`: loads both catalogs, renders every cake as a tile linking to `cake.html?id=<id>`, using `cakeThumbMarkup()` (from [/shared/utils.js](../../shared/utils.js)) — a real uploaded photo if set, else the placeholder. Runs on `DOMContentLoaded`.

## Data source

`/data/legacy-cakes.json`, `/data/modern-cakes.json`. Custom cakes aren't included (no fixed catalog entry) — direct people to [/custom-cakes.html](../../custom-cakes.html) for those.

## Mount points expected in gallery.html

`#gallery-grid`.
