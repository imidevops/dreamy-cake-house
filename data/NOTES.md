# /data

All catalog and site content lives here as static JSON. Pages fetch these with `fetchJSON()` from [/shared/utils.js](../shared/utils.js) — nothing is hardcoded into the HTML.

## Files

- **legacy-cakes.json** — array of Legacy/Traditional Cakes products. Each item: `id, name, category, price, currency, flavor, description, occasion[], featured`. Consumed by [/pages/legacy-cakes](../pages/legacy-cakes/NOTES.md), [/pages/cake-detail](../pages/cake-detail/NOTES.md), [/pages/home](../pages/home/NOTES.md) (featured items), [/pages/gallery](../pages/gallery/NOTES.md).
- **modern-cakes.json** — same shape as legacy-cakes.json, for Modern/trending cakes. `occasion[]` powers the filter on [/pages/modern-cakes](../pages/modern-cakes/NOTES.md).
- **custom-cakes.json** — NOT a product list. Custom cakes are made-to-order, so this holds the *options* used to build the request form on [/pages/custom-cakes](../pages/custom-cakes/NOTES.md): `occasions[], sizes[], flavors[], budgetRanges[], leadTimeDays, leadTimeNote`.
- **testimonials.json** — array of `{ name, quote, rating }`, rendered on the homepage.

## Adding a new cake

Add an object to `legacy-cakes.json` or `modern-cakes.json` following the existing shape. `id` must be unique across both files (it's the value used in `cake.html?id=...`). Set `featured: true` to have it appear in the homepage's featured section.

## Images

There are no real product photos yet. Every page renders a deterministic gradient + emoji placeholder via `cakeThumbStyle(id)` in [/shared/utils.js](../shared/utils.js) instead of an `image` field. When real photos exist, add an `images: []` array of paths per cake and update the render functions in each page's JS to use them.
