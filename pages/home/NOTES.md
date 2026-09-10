# /pages/home

Homepage content: hero, category highlights, featured cakes, testimonials, CTA. Backs [/index.html](../../index.html).

## Files

- **home.css** — hero layout, category highlight cards, testimonial cards, CTA banner.
- **home.js** — `renderFeaturedCakes()` (loads legacy + modern JSON, shows items with `featured: true` as cake-cards linking to `cake.html?id=`), `renderTestimonials()` (loads testimonials.json), `initHomePage()` runs both on `DOMContentLoaded`.

## Data source

`/data/legacy-cakes.json`, `/data/modern-cakes.json` (filtered by `featured`), `/data/testimonials.json`. See [/data/NOTES.md](../../data/NOTES.md).

## Mount points expected in index.html

`#featured-grid`, `#testimonial-grid`.
