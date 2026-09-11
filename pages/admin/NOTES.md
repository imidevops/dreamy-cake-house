# /pages/admin

Owner-only admin panel for managing the cake catalog: add/edit/delete cakes, prices per pound (1lb/2lb/3lb, PKR), and photos. Backs [/admin/index.html](../../admin/index.html), reachable at `/admin/` — **deliberately not linked anywhere in the public site** ([/shared/header.js](../../shared/header.js)'s `NAV_LINKS` does not include it).

## Why it works on a static host

The site has no backend/database. This panel "saves" by committing directly to `data/legacy-cakes.json` / `data/modern-cakes.json`, and uploaded photos to `assets/img/<category>/<id>.<ext>`, in the GitHub repo via the [GitHub Contents API](https://docs.github.com/en/rest/repos/contents). That commit is what actually changes the live site — GitHub Pages (and Netlify, if connected) rebuild automatically within a minute or two of the push. Editing files locally does **not** affect the live site until pushed.

## Login: password + CAPTCHA (read this before changing the auth code)

Day-to-day login is just a password and a simple math CAPTCHA, as requested. What actually authorizes writes to GitHub is a Personal Access Token, so the *first time* the panel is used it asks for that token once — it's immediately encrypted with a key derived from the chosen password (PBKDF2 → AES-GCM, via the browser's Web Crypto API) and only the encrypted blob is stored in `localStorage` (`dch_admin_vault`). Every later login: enter the password → the token is decrypted in memory for that session only → discarded on logout/reload. **The plaintext token is never stored anywhere.**

- Logging out does *not* clear the saved vault — next login is still just password + CAPTCHA. "Reset admin access" (on the login screen) clears the vault and returns to one-time setup, for a forgotten password or rotating the token.
- A basic lockout (`getAttempts`/`registerFailedAttempt`/`isLockedOut` in admin.js) throttles repeated wrong-password/CAPTCHA attempts, backing off up to 5 minutes.
- **Honest limitation**: this is still a client-side app on a static host. Web Crypto makes the stored vault useless without the password, but there's no server to truly verify anything — a technical person who both knows the password and can run code in an already-unlocked browser session could read the decrypted token from memory. That's the ceiling for a backend-less site. Genuine server-verified auth (password hash checked server-side, real CAPTCHA verification) would need an actual server, e.g. Netlify Functions, instead of pure client-side JS.
- Anyone can *open* `/admin/` (it's a static HTML page, "hidden" only by not being linked), but nobody can change anything without the password *and* a token that's already been set up — reading the page's source or the encrypted vault reveals no secret.

## Files

- **admin.css** — plain/utilitarian styling distinct from the public site (login/setup cards, dashboard tabs, cake list rows with thumbnails, the add/edit form card including the photo picker, toast notifications).
- **admin.js** — see the file's own header comment for the full function list. Key pieces:
  - `REPO`: owner/repo/branch/file paths this panel commits to (`imidevops/dreamy-cake-house`, `master`). Update if the repo is ever renamed or moved.
  - `ghRequest`/`ghGetFile`/`ghGetFileShaOrNull`/`ghPutContent`/`ghPutFile`/`ghPutImage`: authenticated GitHub Contents API calls for both JSON and binary (photo) files — GET first to get the current `sha` (required to overwrite a file; `ghGetFileShaOrNull` returns `null` instead of throwing when a photo doesn't exist yet).
  - `deriveKey`/`encryptToken`/`decryptToken`/`loadVault`/`saveVault`/`clearVault`: the password vault described above.
  - `newCaptcha`/`verifyCaptcha`: a simple two-number addition CAPTCHA, generated fresh per attempt, one instance for the setup form and one for the login form.
  - `handleImageSelect`/`handleRemoveImage`: photo picker state — previews the chosen file locally; the actual upload happens in `saveCake` only when the form is submitted.
  - `saveCake`: uploads the pending photo first (if any) to `assets/img/<category>/<id>.<ext>`, then commits the cake's JSON entry with `image` pointing at that path.
  - `slugify`/`generateId`: builds a unique `id` (`<category>-<slugified-name>`) for new cakes; existing ids never change on edit, so photo filenames stay stable across edits.

## Data source

Reads/writes `/data/legacy-cakes.json` and `/data/modern-cakes.json` directly via the GitHub API, and writes photos to `/assets/img/<category>/`. See [/data/NOTES.md](../../data/NOTES.md) for the JSON schema (`prices: {1lb, 2lb, 3lb}` in PKR, `image: "assets/img/.../id.ext" | null`).

## What it doesn't cover

- Custom cake form *options* (`/data/custom-cakes.json`) and testimonials aren't editable here; edit those JSON files directly and push, or extend this panel the same way.
- Deleting a cake does not delete its uploaded photo from the repo — it's just left unused (harmless, but not cleaned up automatically).
- Only one photo per cake (`image`, not an array). Multiple photos per cake would need a small schema + UI extension.
