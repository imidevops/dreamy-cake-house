# /pages/admin

Owner-only admin panel for managing the cake catalog. Backs [/admin/index.html](../../admin/index.html), reachable at `/admin/` — **deliberately not linked anywhere in the public site** ([/shared/header.js](../../shared/header.js)'s `NAV_LINKS` does not include it).

## Why it works on a static host

The site has no backend/database. This panel "saves" by committing directly to `data/legacy-cakes.json` / `data/modern-cakes.json` in the GitHub repo via the [GitHub Contents API](https://docs.github.com/en/rest/repos/contents), using a Personal Access Token the owner pastes in once. That commit is what actually changes the live site — GitHub Pages (and Netlify, if connected to the same repo) rebuild automatically within a minute or two of the push. Editing the JSON files locally does **not** affect the live site until it's pushed.

## Security model

- The token is stored only in `localStorage` in the owner's browser (`dch_admin_github_token`) and sent only to `api.github.com` — never to any other server, never logged.
- Anyone can *open* `/admin/` (it's a static HTML page, "hidden" only by not being linked), but nobody can change anything without a valid GitHub token that has write access to this specific repo. Reading the page's source reveals no secret.
- Recommend a **fine-grained** GitHub token scoped to only this one repository with `Contents: Read and write` permission — not a classic token with access to every repo. Steps are shown on the login screen.
- If the token ever leaks, revoke it at github.com/settings/tokens and issue a new one — nothing else needs to change.

## Files

- **admin.css** — plain/utilitarian styling, distinct from the public site's look on purpose (dashboard tabs, cake list rows, the add/edit form card, toast notifications).
- **admin.js** —
  - `REPO`: the owner/repo/branch/file paths this panel commits to (`imidevops/dreamy-cake-house`, `master`). Update this if the repo is ever renamed, forked, or moved.
  - `ghRequest`/`ghGetFile`/`ghPutFile`: authenticated GitHub Contents API calls (GET to read a file + its `sha`, PUT to commit a new version — GitHub requires the current `sha` to update a file, which is why every save re-reads it first).
  - `loadToken`/`saveToken`/`clearToken`: localStorage token persistence.
  - `testToken(token)`: verifies a token can read (and checks it can write to) the repo before accepting login.
  - `loadCategory`/`loadAll`: fetch both catalogs into `CATEGORY_STATE`.
  - `renderTabs`/`renderCakeList`/`switchTab`: dashboard list UI, tabbed by category.
  - `openForm`/`closeForm`/`collectFormData`/`validateFormData`: the add/edit cake form.
  - `slugify`/`generateId`: builds a unique `id` (`<category>-<slugified-name>`) for new cakes; existing ids are never changed on edit.
  - `saveCake`/`deleteCake`: add/update/remove a cake in the in-memory list, then commit the whole updated array back via `ghPutFile`.
  - `showToast`: brief success/error notification.
  - `initAdminPage`: wires all the above; shows the login screen or the dashboard depending on whether a valid stored token exists.

## Data source

Reads and writes `/data/legacy-cakes.json` and `/data/modern-cakes.json` directly via the GitHub API (not via `fetch('data/...')` like the public pages — this panel needs the file's `sha` and write access, which the Contents API provides). See [/data/NOTES.md](../../data/NOTES.md) for the schema (`prices: {1lb, 2lb, 3lb}`, in PKR).

## What it doesn't cover

- Custom cake form *options* (`/data/custom-cakes.json` — occasions/sizes/flavors/budget ranges) and testimonials aren't editable here; edit those JSON files directly and push, or extend this panel the same way.
- No image upload — cakes still use the CSS placeholder thumbnails (`cakeThumbStyle`). See [/assets/NOTES.md](../../assets/NOTES.md) for how to add real photos later.
