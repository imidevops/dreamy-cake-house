# /data

All catalog and site content lives here as static JSON. Pages fetch these with `fetchJSON()` from [/shared/utils.js](../shared/utils.js) — nothing is hardcoded into the HTML.

## Files

- **legacy-cakes.json** — array of Legacy/Traditional Cakes products. Each item: `id, name, category, prices, flavor, description, occasion[], featured, image`. `prices` is `{ "1lb": number, "2lb": number, "3lb": number }` — all cakes are priced per pound, in PKR, with no separate currency field (the whole site assumes PKR — see `formatPrice()` in [/shared/utils.js](../shared/utils.js)). `image` is a root-relative path like `"assets/img/legacy/legacy-victoria-sponge.jpg"`, or `null` if no photo has been uploaded yet (falls back to a CSS placeholder — see Images below). Consumed by [/pages/legacy-cakes](../pages/legacy-cakes/NOTES.md), [/pages/cake-detail](../pages/cake-detail/NOTES.md), [/pages/home](../pages/home/NOTES.md) (featured items), [/pages/gallery](../pages/gallery/NOTES.md).
- **modern-cakes.json** — same shape as legacy-cakes.json, for Modern/trending cakes. `occasion[]` powers the filter on [/pages/modern-cakes](../pages/modern-cakes/NOTES.md).
- **custom-cakes.json** — NOT a product list. Custom cakes are made-to-order, so this holds the *options* used to build the request form on [/pages/custom-cakes](../pages/custom-cakes/NOTES.md): `occasions[], sizes[], flavors[], budgetRanges[], leadTimeDays, leadTimeNote`.
- **testimonials.json** — array of `{ name, quote, rating }`, rendered on the homepage.

## Adding a new cake

Add an object to `legacy-cakes.json` or `modern-cakes.json` following the existing shape. `id` must be unique across both files (it's the value used in `cake.html?id=...`). Set `featured: true` to have it appear in the homepage's featured section.

The easiest way to add/edit/delete cakes (and it's the intended way for the site owner) is the admin panel at **`/admin/`** — see [/pages/admin/NOTES.md](../pages/admin/NOTES.md). It commits directly to these JSON files via the GitHub API, which is what actually publishes changes on a static host like GitHub Pages/Netlify (editing the files locally only changes your own copy until you push).

## Images

Uploaded via the admin panel (see [/pages/admin/NOTES.md](../pages/admin/NOTES.md)) to `/assets/img/<category>/<id>.<ext>`, referenced by each cake's `image` field. Every card/detail/gallery renderer calls `cakeThumbMarkup(cake, pathPrefix)` in [/shared/utils.js](../shared/utils.js), which renders that photo if present, or falls back to a deterministic gradient + emoji placeholder (`cakeThumbStyle(id)`) if `image` is `null`. `pathPrefix` exists because `/admin/` is one directory deeper than the root pages that fetch this data.
