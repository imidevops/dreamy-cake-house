# /pages/custom-cakes

Custom cake request form: occasion, size, flavor, design notes, budget, reference image upload, delivery date. Backs [/custom-cakes.html](../../custom-cakes.html).

## Files

- **custom-cakes.css** — form card layout, lead-time note banner, image upload preview thumbnails, inline field error styling.
- **custom-cakes.js** —
  - `populateOptions(options)`: fills the occasion/size/flavor/budget `<select>`s from data, and sets the delivery-date input's `min` to today + `leadTimeDays`.
  - `handleImagePreview(event)`: reads up to 4 selected images client-side with `FileReader` and renders thumbnails — there is no backend to upload to.
  - `validateForm(form)` / `setFieldInvalid` / `setFieldValid`: required-field + delivery-date lead-time validation, toggling `.invalid` and inline error text.
  - `handleSubmit(event)`: prevents real submission (no backend), validates, and shows a success message in `#form-status`. **This is client-side only** — no email/WhatsApp/API integration; wire one up here when a backend exists.
  - `initCustomCakesPage()`: loads options, wires the image input and form submit. Runs on `DOMContentLoaded`.

## Data source

`/data/custom-cakes.json` — form option lists, not a product catalog (custom cakes are made-to-order). See [/data/NOTES.md](../../data/NOTES.md).

## Mount points expected in custom-cakes.html

Form `#custom-cake-form` containing `#occasion`, `#size`, `#flavor`, `#delivery-date`, `#budget`, `#name`, `#contact`, a `<textarea>` for design notes, `#design-images` (file input), `#upload-preview`, `#lead-time-note`, `#form-status`.
