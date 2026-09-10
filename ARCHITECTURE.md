# Architecture — Dreamy Cake House

Plain HTML/CSS/vanilla JS site, no build step. Root `*.html` files are thin shells: they load `/shared` (design tokens, header, footer, helpers) plus one `/pages/<feature>` CSS+JS pair, and render content from `/data/*.json`.

**Check this table first** when working on any feature — it maps what you're touching to where the code lives and its NOTES.md for details.

| Feature | Folder | NOTES.md |
|---|---|---|
| Shared layout, header/footer, design tokens, JS helpers | [/shared](shared) | [shared/NOTES.md](shared/NOTES.md) |
| Cake catalog & content data (legacy, modern, custom-cake form options, testimonials) | [/data](data) | [data/NOTES.md](data/NOTES.md) |
| Homepage (hero, featured cakes, testimonials, CTA) — [index.html](index.html) | [/pages/home](pages/home) | [pages/home/NOTES.md](pages/home/NOTES.md) |
| Custom cake request form — [custom-cakes.html](custom-cakes.html) | [/pages/custom-cakes](pages/custom-cakes) | [pages/custom-cakes/NOTES.md](pages/custom-cakes/NOTES.md) |
| Legacy/Traditional cakes catalog — [legacy-cakes.html](legacy-cakes.html) | [/pages/legacy-cakes](pages/legacy-cakes) | [pages/legacy-cakes/NOTES.md](pages/legacy-cakes/NOTES.md) |
| Modern cakes catalog + occasion filter — [modern-cakes.html](modern-cakes.html) | [/pages/modern-cakes](pages/modern-cakes) | [pages/modern-cakes/NOTES.md](pages/modern-cakes/NOTES.md) |
| Cake detail page — [cake.html?id=...](cake.html) | [/pages/cake-detail](pages/cake-detail) | [pages/cake-detail/NOTES.md](pages/cake-detail/NOTES.md) |
| About page — [about.html](about.html) | [/pages/about](pages/about) | [pages/about/NOTES.md](pages/about/NOTES.md) |
| Contact page (address, phone, WhatsApp, map) — [contact.html](contact.html) | [/pages/contact](pages/contact) | [pages/contact/NOTES.md](pages/contact/NOTES.md) |
| Gallery — [gallery.html](gallery.html) | [/pages/gallery](pages/gallery) | [pages/gallery/NOTES.md](pages/gallery/NOTES.md) |
| Static assets (images/icons) | [/assets](assets) | [assets/NOTES.md](assets/NOTES.md) |

## Conventions

- One folder per page/feature under `/pages`, each with its own `<feature>.css` and `<feature>.js` — never add to a global stylesheet or script.
- All cake/catalog content lives in `/data/*.json`; pages `fetch()` it via `fetchJSON()` in `/shared/utils.js`. Nothing product-related is hardcoded into HTML.
- Every folder has a `NOTES.md`: what it does, its files, what each JS function does, and where its data comes from. Update it when you change the folder's behavior.
- No product photos yet — thumbnails are CSS gradient + emoji placeholders from `cakeThumbStyle(id)`. See [assets/NOTES.md](assets/NOTES.md) for how to swap in real images later.
- The site must be served over HTTP (not opened as `file://`) because pages `fetch()` JSON — see [shared/NOTES.md](shared/NOTES.md#note-on-running-the-site).
