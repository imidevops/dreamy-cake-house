# /pages/contact

Contact page: address, phone, WhatsApp link, map embed. Backs [/contact.html](../../contact.html).

## Files

- **contact.css** — two-column info/map layout, contact list styling.
- **contact.js** — `renderContactInfo()`: writes the local `CONTACT` constant's fields into the page and builds the `tel:`, `mailto:`, `wa.me`, and Google Maps embed URLs. Runs on `DOMContentLoaded`.

`CONTACT` mirrors `BUSINESS` in [/shared/footer.js](../../shared/footer.js) — they're kept as separate constants so this page doesn't depend on footer.js's load order, but **update both** if the phone/address/WhatsApp number changes.

## Data source

None from `/data` — contact details are business info, hardcoded in `CONTACT` at the top of contact.js.

## Mount points expected in contact.html

`#contact-address`, `#contact-phone` (anchor), `#contact-email` (anchor), `#contact-whatsapp` (anchor), `#contact-map` (iframe).
