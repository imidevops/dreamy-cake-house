/**
 * pages/admin/admin.js
 * Owner-only admin panel at /admin/. Not linked anywhere on the public site.
 *
 * There is no backend — this is a static site (GitHub Pages / Netlify), so
 * "saving" a cake means committing straight to data/legacy-cakes.json or
 * data/modern-cakes.json in the GitHub repo via the GitHub REST API, using a
 * Personal Access Token the owner pastes in once. The token is stored only
 * in this browser's localStorage and sent only to api.github.com — never to
 * any other server. Anyone can *open* this page (it's just an HTML file),
 * but nobody can change anything without a valid token that has write
 * access to this specific repo.
 *
 * Functions:
 * - REPO config              -> owner/repo/branch/paths this panel commits to.
 * - ghRequest(path, opts)    -> authenticated fetch against api.github.com.
 * - ghGetFile(path)          -> { sha, data } for a repo JSON file.
 * - ghPutFile(path, sha, data, message) -> commits new file content, returns new sha.
 * - loadToken/saveToken/clearToken -> localStorage token persistence.
 * - testToken(token)         -> verifies the token can read the repo.
 * - loadCategory(cat)/loadAll() -> fetch legacy/modern JSON into CATEGORY_STATE.
 * - renderTabs()/renderCakeList() -> dashboard UI.
 * - openForm(cake)/closeForm()    -> add/edit form visibility + population.
 * - slugify(text)/generateId(category, name) -> unique cake id from its name.
 * - collectFormData()/validateFormData() -> read + validate the form.
 * - saveCake(event)          -> add or update a cake, commits via ghPutFile.
 * - deleteCake(category, id) -> removes a cake, commits via ghPutFile.
 * - showToast(message, type) -> brief success/error notification.
 * - init()                   -> shows login or dashboard depending on stored token.
 */

const REPO = {
  owner: 'imidevops',
  repo: 'dreamy-cake-house',
  branch: 'master',
  paths: { legacy: 'data/legacy-cakes.json', modern: 'data/modern-cakes.json' },
};

const TOKEN_STORAGE_KEY = 'dch_admin_github_token';

// { legacy: { sha, cakes: [] }, modern: { sha, cakes: [] } }
const CATEGORY_STATE = { legacy: { sha: null, cakes: [] }, modern: { sha: null, cakes: [] } };
let activeCategory = 'legacy';
let editingId = null; // null = adding a new cake

// ---- localStorage token ----
function loadToken() { return localStorage.getItem(TOKEN_STORAGE_KEY) || ''; }
function saveToken(token) { localStorage.setItem(TOKEN_STORAGE_KEY, token); }
function clearToken() { localStorage.removeItem(TOKEN_STORAGE_KEY); }

// ---- GitHub API ----
function ghRequest(path, options = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${loadToken()}`,
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

async function ghPutFile(path, sha, data, message) {
  const res = await ghRequest(`/repos/${REPO.owner}/${REPO.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: b64EncodeUnicode(JSON.stringify(data, null, 2) + '\n'),
      sha,
      branch: REPO.branch,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Failed to save ${path} (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.content.sha;
}

async function testToken(token) {
  const res = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return { ok: false };
  const json = await res.json();
  return { ok: true, permissions: json.permissions || {} };
}

// ---- Data loading ----
async function loadCategory(category) {
  const { sha, data } = await ghGetFile(REPO.paths[category]);
  CATEGORY_STATE[category] = { sha, cakes: data };
}

async function loadAll() {
  await Promise.all([loadCategory('legacy'), loadCategory('modern')]);
}

// ---- Toast ----
function showToast(message, type = 'success') {
  const toast = qs('#admin-toast');
  toast.textContent = message;
  toast.className = `admin-toast ${type}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.className = 'admin-toast'; }, 4000);
}

// ---- Dashboard rendering ----
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
    const thumb = cakeThumbStyle(cake.id);
    const priceSummary = POUND_TIERS
      .filter(t => typeof cake.prices?.[t.key] === 'number')
      .map(t => `${t.label}: ${formatPrice(cake.prices[t.key])}`)
      .join(' · ');
    return `
      <div class="admin-cake-row">
        <div class="thumb" style="background:${thumb.gradient}">${thumb.emoji}</div>
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

// ---- Add/edit form ----
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

function openForm(cake = null) {
  editingId = cake ? cake.id : null;
  qs('#form-title').textContent = cake ? `Edit: ${cake.name}` : 'Add New Cake';
  qs('#cake-name').value = cake?.name || '';
  qs('#cake-flavor').value = cake?.flavor || '';
  qs('#cake-description').value = cake?.description || '';
  qs('#cake-occasions').value = (cake?.occasion || []).join(', ');
  qs('#cake-featured').checked = !!cake?.featured;
  qs('#price-1lb').value = cake?.prices?.['1lb'] ?? '';
  qs('#price-2lb').value = cake?.prices?.['2lb'] ?? '';
  qs('#price-3lb').value = cake?.prices?.['3lb'] ?? '';
  qs('#cake-form-section').hidden = false;
  qs('#cake-form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeForm() {
  editingId = null;
  qs('#cake-form').reset();
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
  saveBtn.textContent = 'Saving…';

  try {
    let cakes = state.cakes;
    if (editingId) {
      cakes = cakes.map(c => c.id === editingId ? { ...c, ...fields, id: c.id, category } : c);
    } else {
      const id = generateId(category, fields.name);
      cakes = [...cakes, { id, category, ...fields }];
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
    showToast('Deleted.', 'success');
  } catch (err) {
    console.error(err);
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}

// ---- Login / boot ----
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

function showLogin(message) {
  qs('#dashboard').hidden = true;
  qs('#login-screen').hidden = false;
  qs('#login-error').textContent = message || '';
}

async function handleLogin(event) {
  event.preventDefault();
  const token = qs('#token-input').value.trim();
  if (!token) return;
  const btn = qs('#login-form button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Connecting…';

  const result = await testToken(token);
  btn.disabled = false;
  btn.textContent = 'Connect';

  if (!result.ok) {
    showLogin('That token could not access the repo. Check it has "Contents: Read and write" permission on this repository.');
    return;
  }
  if (result.permissions.push === false) {
    showLogin('This token can read the repo but not write to it. Use a token with write access.');
    return;
  }

  saveToken(token);
  showDashboard();
}

function logout() {
  clearToken();
  showLogin();
}

async function initAdminPage() {
  qs('#login-form').addEventListener('submit', handleLogin);
  qs('#logout-btn').addEventListener('click', logout);
  qs('#add-cake-btn').addEventListener('click', () => openForm(null));
  qs('#cancel-form-btn').addEventListener('click', closeForm);
  qs('#cake-form').addEventListener('submit', saveCake);
  qsa('.admin-tab').forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.category)));

  const token = loadToken();
  if (!token) return showLogin();

  const result = await testToken(token);
  if (!result.ok) { clearToken(); return showLogin('Your saved token is no longer valid — please log in again.'); }
  showDashboard();
}

document.addEventListener('DOMContentLoaded', initAdminPage);
