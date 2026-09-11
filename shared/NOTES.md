# /shared

Common building blocks loaded by every page: design tokens, base styles, header/footer, and JS helpers.

## Files

- **variables.css** — CSS custom properties (colors, fonts, spacing, radii, shadows). Change the palette/fonts here once, it propagates everywhere.
- **base.css** — reset, typography, and shared components used across pages: `.site-header`, `.site-footer`, `.btn`, `.cake-card` / `.cake-grid`, `.badge`, form field styles (`.field`, `.form-status`). Page-specific CSS files should only add to this, not redefine it.
- **header.js** — `renderHeader(activePage)`. Builds the sticky nav and injects it into `<div id="site-header">`, highlighting the current page's link. Also wires the mobile hamburger toggle.
- **footer.js** — `renderFooter()`. Injects the footer into `<div id="site-footer">`. Business contact info (phone/address/WhatsApp number) is hardcoded in the `BUSINESS` object at the top of this file — update it there if it changes.
- **utils.js** — shared helpers used by page scripts: `fetchJSON(path)`, `formatPrice(amount)`/`formatPriceRange(prices)` (PKR, per-pound tiers — see [/data/NOTES.md](../data/NOTES.md)), `getQueryParam(name)`, `qs`/`qsa` (querySelector shorthands), `cakeThumbStyle(id)` (gradient+emoji placeholder) and `cakeThumbMarkup(cake, pathPrefix)` (renders a cake's real uploaded photo if it has one, else the placeholder — every card/detail/gallery renderer uses this), `escapeHTML(str)`.

## Load order on every page

```html
<link rel="stylesheet" href="shared/variables.css">
<link rel="stylesheet" href="shared/base.css">
<link rel="stylesheet" href="pages/<feature>/<feature>.css">
...
<div id="site-header"></div>
...page content...
<div id="site-footer"></div>
<script src="shared/utils.js"></script>
<script src="shared/header.js"></script>
<script src="shared/footer.js"></script>
<script src="pages/<feature>/<feature>.js"></script>
```

## Data source

None directly — see [/data/NOTES.md](../data/NOTES.md) for catalog/content data. `utils.js#fetchJSON` is how every page reads it.

## Note on running the site

Pages fetch JSON via `fetch()`, which most browsers block for `file://` pages (CORS). Serve the folder with any static server, e.g. `npx serve .` or `python -m http.server`, then open `http://localhost:.../index.html`.
