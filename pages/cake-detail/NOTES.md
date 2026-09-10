# /pages/cake-detail

Single cake detail page, reached as `cake.html?id=<id>`. Backs [/cake.html](../../cake.html).

## Files

- **cake-detail.css** — two-column image/details layout, price, badges, order CTA row.
- **cake-detail.js** —
  - `findCakeById(id)`: fetches both `legacy-cakes.json` and `modern-cakes.json` and searches both (the catalog is split by category, so a detail page can't assume which file the id is in).
  - `renderCake(cake)`: fills the template and builds a WhatsApp order link prefilled with the cake's name and price (`ORDER_WHATSAPP_NUMBER` — keep in sync with `BUSINESS.whatsapp` in [/shared/footer.js](../../shared/footer.js) if the number changes).
  - `renderNotFound()`: shown when `?id=` is missing or doesn't match any cake.
  - `initCakeDetailPage()`: reads `?id=` and runs the above. Runs on `DOMContentLoaded`.

## Data source

`/data/legacy-cakes.json`, `/data/modern-cakes.json`. Custom cakes have no catalog entry (they're made-to-order) so this page only ever resolves legacy/modern ids — a custom cake CTA should link to [/custom-cakes.html](../../custom-cakes.html) instead.

## Mount points expected in cake.html

`#detail-content` (hidden until loaded), `#detail-thumb`, `#detail-name`, `#detail-flavor`, `#detail-description`, `#detail-price`, `#detail-badges`, `#order-cta` (anchor), `#detail-not-found` (hidden by default).
