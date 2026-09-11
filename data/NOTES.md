# /data

All catalog and site content lives here as static JSON. Pages fetch these with `fetchJSON()` from [/shared/utils.js](../shared/utils.js) — nothing is hardcoded into the HTML.

## Files

- **legacy-cakes.json** — array of Legacy/Traditional Cakes products. Each item: `id, name, category, prices, flavor, description, occasion[], featured`. `prices` is `{ "1lb": number, "2lb": number, "3lb": number }` — all cakes are priced per pound, in PKR, with no separate currency field (the whole site assumes PKR — see `formatPrice()` in [/shared/utils.js](../shared/utils.js)). Consumed by [/pages/legacy-cakes](../pages/legacy-cakes/NOTES.md), [/pages/cake-detail](../pages/cake-detail/NOTES.md), [/pages/home](../pages/home/NOTES.md) (featured items), [/pages/gallery](../pages/gallery/NOTES.md).
- **modern-cakes.json** — same shape as legacy-cakes.json, for Modern/trending cakes. `occasion[]` powers the filter on [/pages/modern-cakes](../pages/modern-cakes/NOTES.md).
- **custom-cakes.json** — NOT a product list. Custom cakes are made-to-order, so this holds the *options* used to build the request form on [/pages/custom-cakes](../pages/custom-cakes/NOTES.md): `occasions[], sizes[], flavors[], budgetRanges[], leadTimeDays, leadTimeNote`.
- **testimonials.json** — array of `{ name, quote, rating }`, rendered on the homepage.

## Adding a new cake

Add an object to `legacy-cakes.json` or `modern-cakes.json` following the existing shape. `id` must be unique across both files (it's the value used in `cake.html?id=...`). Set `featured: true` to have it appear in the homepage's featured section.

The easiest way to add/edit/delete cakes (and it's the intended way for the site owner) is the admin panel at **`/admin/`** — see [/pages/admin/NOTES.md](../pages/admin/NOTES.md). It commits directly to these JSON files via the GitHub API, which is what actually publishes changes on a static host like GitHub Pages/Netlify (editing the files locally only changes your own copy until you push).

## Images

There are no real product photos yet. Every page renders a deterministic gradient + emoji placeholder via `cakeThumbStyle(id)` in [/shared/utils.js](../shared/utils.js) instead of an `image` field. When real photos exist, add an `images: []` array of paths per cake and update the render functions in each page's JS to use them.
