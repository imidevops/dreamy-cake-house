/**
 * pages/admin/admin.js
 * Owner-only admin panel at /admin/. Not linked anywhere on the public site.
 *
 * There is no backend — this is a static site (GitHub Pages / Netlify), so
 * "saving" a cake or photo means committing straight to files in the GitHub
 * repo via the GitHub REST API, using a Personal Access Token.
 *
 * AUTH DESIGN (read this before changing it):
 * The day-to-day login is just a password + a CAPTCHA, as requested. Under
 * the hood, the GitHub token is what actually authorizes writes to the repo,
 * so on first-time setup the owner pastes that token once; it's immediately
 * encrypted (AES-GCM, key derived from the password via PBKDF2) and the
 * encrypted blob is stored in this browser's localStorage. From then on,
 * logging in means: enter the password -> decrypt the token in-memory only
 * -> use it for this session -> discard it on reload/logout. The plaintext
 * token is NEVER stored anywhere, only ever the encrypted vault.
 * Honest limitation: this is still a client-side app. Web Crypto makes the
 * stored vault useless without the password, but a technical person who
 * both knows the password AND can run code in an already-unlocked session
 * (e.g. via devtools) could still read the decrypted token from memory.
 * That's the ceiling for security on a backend-less static site; if you
 * need real server-verified auth, that requires an actual server (e.g.
 * Netlify Functions) instead of pure client-side JS.
 *
 * Functions:
 * - REPO config                      -> owner/repo/branch/paths this panel commits to.
 * - ghRequest/ghGetFile/ghGetFileShaOrNull/ghPutContent/ghPutFile/ghPutImage
 *                                     -> authenticated GitHub Contents API calls.
 * - b64EncodeUnicode/b64DecodeUnicode -> UTF-8-safe base64 helpers for JSON files.
 * - readFileAsBase64/extFromMimeType -> turn an uploaded photo into API-ready base64.
 * - deriveKey/encryptToken/decryptToken -> Web Crypto vault encryption.
 * - loadVault/saveVault/clearVault   -> localStorage for the encrypted vault only.
 * - newCaptcha(prefix)/verifyCaptcha(prefix) -> simple math CAPTCHA, per form.
 * - getAttempts/registerFailedAttempt/registerSuccess/isLockedOut -> login throttling.
 * - testToken(token)                 -> verifies a token can read/write the repo.
 * - loadCategory(cat)/loadAll()      -> fetch legacy/modern JSON into CATEGORY_STATE.
 * - renderTabs()/renderCakeList()    -> dashboard UI.
 * - openForm(cake)/closeForm()       -> add/edit form visibility + population,
 *                                        including the photo preview.
 * - handleImageSelect/handleRemoveImage -> photo picker state for the form.
 * - slugify(text)/generateId(category, name) -> unique cake id from its name.
 * - collectFormData()/validateFormData() -> read + validate the form.
 * - saveCake(event)                  -> uploads the photo (if any) then commits
 *                                        the add/update to the category's JSON.
 * - deleteCake(category, id)         -> removes a cake, commits via ghPutFile.
 * - showToast(message, type)         -> brief success/error notification.
 * - handleSetup/handleLogin/logout/resetSetup -> the auth flows described above.
 * - initAdminPage()                  -> wires everything, always starts at login.
 */

const REPO = {
  owner: 'imidevops',
  repo: 'dreamy-cake-house',
  branch: 'master',
  paths: { legacy: 'data/legacy-cakes.json', modern: 'data/modern-cakes.json' },
};

// admin/index.html is one directory below the site root.
const ADMIN_PATH_PREFIX = '../';

const VAULT_STORAGE_KEY = 'dch_admin_vault';       // encrypted GitHub token only
const ATTEMPTS_STORAGE_KEY = 'dch_admin_login_attempts';

// { legacy: { sha, cakes: [] }, modern: { sha, cakes: [] } }
const CATEGORY_STATE = { legacy: { sha: null, cakes: [] }, modern: { sha: null, cakes: [] } };
let activeCategory = 'legacy';
let editingId = null;          // null = adding a new cake
let sessionToken = null;       // decrypted GitHub token — memory only, never persisted
let pendingImageFile = null;   // File selected in the form but not yet uploaded
let removeImageFlag = false;   // true = clear the cake's existing photo on save
let setupCaptchaAnswer = null;
let loginCaptchaAnswer = null;

// ==================== GitHub API ====================

function ghRequest(path, options = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: 'application/vnd.github+json',
      ...(options.headers || {}),
    },
  });
}

function b64EncodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(escape(atob(str.replace(/\n/g, ''))));
}

async function ghGetFile(path) {
  const res = await ghRequest(`/repos/${REPO.owner}/${REPO.repo}/contents/${path}?ref=${REPO.branch}`);
  if (!res.ok) throw new Error(`Failed to load ${path} (HTTP ${res.status})`);
  const json = await res.json();
  return { sha: json.sha, data: JSON.parse(b64DecodeUnicode(json.content)) };
}

/** Like ghGetFile but returns null (not an error) if the file doesn't exist yet. */
async function ghGetFileShaOrNull(path) {
  const res = await ghRequest(`/repos/${REPO.owner}/${REPO.repo}/contents/${path}?ref=${REPO.branch}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed checking ${path} (HTTP ${res.status})`);
  const json = await res.json();
  return json.sha;
}

async function ghPutContent(path, sha, base64Content, message) {
  const res = await ghRequest(`/repos/${REPO.owner}/${REPO.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: base64Content, sha: sha || undefined, branch: REPO.branch }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Failed to save ${path} (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.content.sha;
}

function ghPutFile(path, sha, data, message) {
  return ghPutContent(path, sha, b64EncodeUnicode(JSON.stringify(data, null, 2) + '\n'), message);
}

function ghPutImage(path, sha, base64Content, message) {
  return ghPutContent(path, sha, base64Content, message);
}

async function testToken(token) {
  const res = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return { ok: false };
  const json = await res.json();
  return { ok: true, permissions: json.permissions || {} };
}

// ==================== Image upload helpers ====================

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function extFromMimeType(type) {
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  return map[type] || 'jpg';
}

// ==================== Password vault (Web Crypto) ====================

function bufToB64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function b64ToBuf(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

async function deriveKey(password, saltBuf) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: 150000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptToken(token, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token));
  return { salt: bufToB64(salt), iv: bufToB64(iv), cipher: bufToB64(cipherBuf) };
}

/** Throws if the password is wrong (AES-GCM auth tag check fails). */
async function decryptToken(vault, password) {
  const key = await deriveKey(password, b64ToBuf(vault.salt));
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(vault.iv) }, key, b64ToBuf(vault.cipher));
  return new TextDecoder().decode(plainBuf);
}

function loadVault() {
  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}
function saveVault(vault) { localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault)); }
function clearVault() { localStorage.removeItem(VAULT_STORAGE_KEY); }

// ==================== CAPTCHA ====================

function newCaptcha(prefix) {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  if (prefix === 'setup') setupCaptchaAnswer = a + b; else loginCaptchaAnswer = a + b;
  qs(`#${prefix}-captcha-question`).textContent = `${a} + ${b} = ?`;
  qs(`#${prefix}-captcha-input`).value = '';
}

function verifyCaptcha(prefix) {
  const input = Number(qs(`#${prefix}-captcha-input`).value);
  return input === (prefix === 'setup' ? setupCaptchaAnswer : loginCaptchaAnswer);
}

// ==================== Login throttling ====================

function getAttempts() {
  try { return JSON.parse(localStorage.getItem(ATTEMPTS_STORAGE_KEY)) || { count: 0, lockUntil: 0 }; }
  catch { return { count: 0, lockUntil: 0 }; }
}
function setAttempts(obj) { localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(obj)); }
function registerFailedAttempt() {
  const a = getAttempts();
  a.count += 1;
  if (a.count >= 5) a.lockUntil = Date.now() + Math.min(30000 * (a.count - 4), 5 * 60 * 1000);
  setAttempts(a);
}
function registerSuccess() { setAttempts({ count: 0, lockUntil: 0 }); }
function isLockedOut() { return getAttempts().lockUntil > Date.now(); }
function lockoutSecondsRemaining() { return Math.max(0, Math.ceil((getAttempts().lockUntil - Date.now()) / 1000)); }

// ==================== Data loading ====================

async function loadCategory(category) {
  const { sha, data } = await ghGetFile(REPO.paths[category]);
  CATEGORY_STATE[category] = { sha, cakes: data };
}

async function loadAll() {
  await Promise.all([loadCategory('legacy'), loadCategory('modern')]);
}

// ==================== Toast ====================

function showToast(message, type = 'success') {
  const toast = qs('#admin-toast');
  toast.textContent = message;
  toast.className = `admin-toast ${type}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.className = 'admin-toast'; }, 4000);
}

// ==================== Dashboard rendering ====================

function renderTabs() {
  qsa('.admin-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.category === activeCategory));
}

function switchTab(category) {
  activeCategory = category;
  closeForm();
  renderTabs();
  renderCakeList();
}

function renderCakeList() {
  const list = qs('#cake-list');
  const cakes = CATEGORY_STATE[activeCategory].cakes;

  if (!cakes.length) {
    list.innerHTML = '<p class="empty-state">No cakes in this category yet.</p>';
    return;
  }

  list.innerHTML = cakes.map(cake => {
    const priceSummary = POUND_TIERS
      .filter(t => typeof cake.prices?.[t.key] === 'number')
      .map(t => `${t.label}: ${formatPrice(cake.prices[t.key])}`)
      .join(' · ');
    return `
      <div class="admin-cake-row">
        <div class="thumb">${cakeThumbMarkup(cake, ADMIN_PATH_PREFIX)}</div>
        <div class="info">
          <h3>${escapeHTML(cake.name)}${cake.featured ? ' ⭐' : ''}</h3>
          <div class="meta">${escapeHTML(cake.flavor)} — ${escapeHTML(priceSummary)}</div>
        </div>
        <div class="row-actions">
          <button type="button" class="edit-btn" data-id="${cake.id}">Edit</button>
          <button type="button" class="delete-btn" data-id="${cake.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  qsa('.edit-btn', list).forEach(btn => {
    btn.addEventListener('click', () => openForm(cakes.find(c => c.id === btn.dataset.id)));
  });
  qsa('.delete-btn', list).forEach(btn => {
    btn.addEventListener('click', () => deleteCake(activeCategory, btn.dataset.id));
  });
}

// ==================== Add/edit form ====================

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function generateId(category, name) {
  const base = `${category}-${slugify(name)}`;
  const existingIds = new Set([...CATEGORY_STATE.legacy.cakes, ...CATEGORY_STATE.modern.cakes].map(c => c.id));
  let id = base;
  let n = 2;
  while (existingIds.has(id)) { id = `${base}-${n++}`; }
  return id;
}

function handleImageSelect(event) {
  const file = event.target.files[0];
  pendingImageFile = file || null;
  removeImageFlag = false;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    qs('#image-preview').src = reader.result;
    qs('#image-preview-wrap').hidden = false;
  };
  reader.readAsDataURL(file);
}

function handleRemoveImage() {
  removeImageFlag = true;
  pendingImageFile = null;
  qs('#cake-image').value = '';
  qs('#image-preview-wrap').hidden = true;
}

function openForm(cake = null) {
  editingId = cake ? cake.id : null;
  pendingImageFile = null;
  removeImageFlag = false;

  qs('#form-title').textContent = cake ? `Edit: ${cake.name}` : 'Add New Cake';
  qs('#cake-name').value = cake?.name || '';
  qs('#cake-flavor').value = cake?.flavor || '';
  qs('#cake-description').value = cake?.description || '';
  qs('#cake-occasions').value = (cake?.occasion || []).join(', ');
  qs('#cake-featured').checked = !!cake?.featured;
  qs('#price-1lb').value = cake?.prices?.['1lb'] ?? '';
  qs('#price-2lb').value = cake?.prices?.['2lb'] ?? '';
  qs('#price-3lb').value = cake?.prices?.['3lb'] ?? '';
  qs('#cake-image').value = '';

  if (cake?.image) {
    qs('#image-preview').src = ADMIN_PATH_PREFIX + cake.image;
    qs('#image-preview-wrap').hidden = false;
  } else {
    qs('#image-preview-wrap').hidden = true;
  }

  qs('#cake-form-section').hidden = false;
  qs('#cake-form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeForm() {
  editingId = null;
  pendingImageFile = null;
  removeImageFlag = false;
  qs('#cake-form').reset();
  qs('#image-preview-wrap').hidden = true;
  qs('#cake-form-section').hidden = true;
}

function collectFormData() {
  const name = qs('#cake-name').value.trim();
  const flavor = qs('#cake-flavor').value.trim();
  const description = qs('#cake-description').value.trim();
  const occasion = qs('#cake-occasions').value.split(',').map(s => slugify(s.trim())).filter(Boolean);
  const featured = qs('#cake-featured').checked;
  const prices = {};
  for (const tier of POUND_TIERS) {
    const raw = qs(`#price-${tier.key}`).value;
    if (raw !== '') prices[tier.key] = Number(raw);
  }
  return { name, flavor, description, occasion, featured, prices };
}

function validateFormData(fields) {
  if (!fields.name || !fields.flavor || !fields.description) {
    return 'Name, flavor and description are all required.';
  }
  if (Object.keys(fields.prices).length === 0) {
    return 'Enter a price for at least one pound tier (1lb/2lb/3lb).';
  }
  if (Object.values(fields.prices).some(p => !(p > 0))) {
    return 'Prices must be positive numbers.';
  }
  return null;
}

async function saveCake(event) {
  event.preventDefault();
  const fields = collectFormData();
  const error = validateFormData(fields);
  if (error) { showToast(error, 'error'); return; }

  const category = activeCategory;
  const state = CATEGORY_STATE[category];
  const saveBtn = qs('#cake-form button[type="submit"]');
  saveBtn.disabled = true;

  try {
    const id = editingId || generateId(category, fields.name);
    const existingCake = editingId ? state.cakes.find(c => c.id === editingId) : null;
    let imagePath = existingCake?.image || null;

    if (removeImageFlag) imagePath = null;

    if (pendingImageFile) {
      saveBtn.textContent = 'Uploading photo…';
      const ext = extFromMimeType(pendingImageFile.type);
      const path = `assets/img/${category}/${id}.${ext}`;
      const base64 = await readFileAsBase64(pendingImageFile);
      const existingSha = await ghGetFileShaOrNull(path);
      await ghPutImage(path, existingSha, base64, `Admin: ${editingId ? 'update' : 'add'} photo for "${fields.name}"`);
      imagePath = path;
    }

    saveBtn.textContent = 'Saving…';
    let cakes;
    if (editingId) {
      cakes = state.cakes.map(c => c.id === editingId ? { ...c, ...fields, id: c.id, category, image: imagePath } : c);
    } else {
      cakes = [...state.cakes, { id, category, ...fields, image: imagePath }];
    }

    const message = `Admin: ${editingId ? 'update' : 'add'} cake "${fields.name}" (${category})`;
    const newSha = await ghPutFile(REPO.paths[category], state.sha, cakes, message);

    CATEGORY_STATE[category] = { sha: newSha, cakes };
    renderCakeList();
    closeForm();
    showToast(`Saved. It'll appear on the live site within a minute or two.`, 'success');
  } catch (err) {
    console.error(err);
    showToast(`Save failed: ${err.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Cake';
  }
}

async function deleteCake(category, id) {
  const cake = CATEGORY_STATE[category].cakes.find(c => c.id === id);
  if (!cake || !confirm(`Delete "${cake.name}"? This can't be undone from here.`)) return;

  const state = CATEGORY_STATE[category];
  try {
    const cakes = state.cakes.filter(c => c.id !== id);
    const newSha = await ghPutFile(REPO.paths[category], state.sha, cakes, `Admin: delete cake "${cake.name}" (${category})`);
    CATEGORY_STATE[category] = { sha: newSha, cakes };
    renderCakeList();
    showToast('Deleted. (Its photo, if any, stays in the repo unused — harmless.)', 'success');
  } catch (err) {
    console.error(err);
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}

// ==================== Auth flows ====================

async function showDashboard() {
  qs('#login-screen').hidden = true;
  qs('#dashboard').hidden = false;
  qs('#admin-status-line').textContent = 'Loading cakes…';
  try {
    await loadAll();
    qs('#admin-status-line').textContent = '';
    renderTabs();
    renderCakeList();
  } catch (err) {
    qs('#admin-status-line').textContent = '';
    showToast(`Couldn't load cakes: ${err.message}`, 'error');
  }
}

function showLogin() {
  qs('#dashboard').hidden = true;
  qs('#login-screen').hidden = false;
  const vault = loadVault();
  qs('#setup-form-wrap').hidden = !!vault;
  qs('#login-form-wrap').hidden = !vault;
  if (vault) {
    qs('#login-password-input').value = '';
    qs('#login-error').textContent = '';
    newCaptcha('login');
  } else {
    qs('#setup-error').textContent = '';
    newCaptcha('setup');
  }
}

async function handleSetup(event) {
  event.preventDefault();
  const setBtn = qs('#setup-form button[type="submit"]');
  const errorEl = qs('#setup-error');

  if (!verifyCaptcha('setup')) {
    errorEl.textContent = 'CAPTCHA answer is incorrect.';
    newCaptcha('setup');
    return;
  }
  const token = qs('#setup-token-input').value.trim();
  const password = qs('#setup-password-input').value;
  const confirmPassword = qs('#setup-password-confirm').value;

  if (!token) { errorEl.textContent = 'Paste your GitHub token first.'; return; }
  if (password.length < 8) { errorEl.textContent = 'Password must be at least 8 characters.'; return; }
  if (password !== confirmPassword) { errorEl.textContent = 'Passwords do not match.'; return; }

  errorEl.textContent = '';
  setBtn.disabled = true;
  setBtn.textContent = 'Verifying token…';
  const result = await testToken(token);
  setBtn.disabled = false;
  setBtn.textContent = 'Set Up Admin Access';

  if (!result.ok) {
    errorEl.textContent = 'That token could not access the repo. Check it has "Contents: Read and write" permission on this repository.';
    newCaptcha('setup');
    return;
  }
  if (result.permissions.push === false) {
    errorEl.textContent = 'This token can read the repo but not write to it. Use a token with write access.';
    newCaptcha('setup');
    return;
  }

  const vault = await encryptToken(token, password);
  saveVault(vault);
  sessionToken = token;
  showDashboard();
}

async function handleLogin(event) {
  event.preventDefault();
  const errorEl = qs('#login-error');

  if (isLockedOut()) {
    errorEl.textContent = `Too many attempts. Try again in ${lockoutSecondsRemaining()}s.`;
    return;
  }
  if (!verifyCaptcha('login')) {
    registerFailedAttempt();
    errorEl.textContent = 'CAPTCHA answer is incorrect.';
    newCaptcha('login');
    return;
  }

  const password = qs('#login-password-input').value;
  const vault = loadVault();
  let token;
  try {
    token = await decryptToken(vault, password);
  } catch {
    registerFailedAttempt();
    errorEl.textContent = 'Incorrect password.';
    newCaptcha('login');
    return;
  }

  const result = await testToken(token);
  if (!result.ok) {
    errorEl.textContent = 'Your saved GitHub token is no longer valid. Use "Reset admin access" below to set a new one.';
    return;
  }

  registerSuccess();
  errorEl.textContent = '';
  sessionToken = token;
  showDashboard();
}

function logout() {
  sessionToken = null;
  showLogin();
}

function resetSetup() {
  if (!confirm('This clears the saved (encrypted) GitHub token from this browser. You\'ll need to paste your GitHub token again to set a new password. Continue?')) return;
  clearVault();
  sessionToken = null;
  showLogin();
}

// ==================== Boot ====================

async function initAdminPage() {
  qs('#setup-form').addEventListener('submit', handleSetup);
  qs('#login-form').addEventListener('submit', handleLogin);
  qs('#logout-btn').addEventListener('click', logout);
  qs('#reset-setup-btn').addEventListener('click', resetSetup);
  qs('#add-cake-btn').addEventListener('click', () => openForm(null));
  qs('#cancel-form-btn').addEventListener('click', closeForm);
  qs('#cake-form').addEventListener('submit', saveCake);
  qs('#cake-image').addEventListener('change', handleImageSelect);
  qs('#remove-image-btn').addEventListener('click', handleRemoveImage);
  qsa('.admin-tab').forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.category)));

  // No persisted session — every page load/reload requires the password again.
  showLogin();
}

document.addEventListener('DOMContentLoaded', initAdminPage);
