/**
 * pages/legacy-cakes/legacy-cakes.js
 * Renders the full Legacy/Traditional Cakes catalog grid.
 *
 * Functions:
 * - renderCatalog() -> loads legacy-cakes.json and renders every item into
 *   #catalog-grid as a cake-card linking to cake.html?id=...
 *
 * Data source: /data/legacy-cakes.json (via shared/utils.js#fetchJSON).
 */

function legacyCardHTML(cake) {
  const thumb = cakeThumbStyle(cake.id);
  return `
    <a class="cake-card" href="cake.html?id=${encodeURIComponent(cake.id)}">
      <div class="cake-thumb" style="background:${thumb.gradient}">${thumb.emoji}</div>
      <div class="cake-body">
        <h3>${escapeHTML(cake.name)}</h3>
        <div class="cake-flavor">${escapeHTML(cake.flavor)}</div>
        <p class="cake-desc">${escapeHTML(cake.description)}</p>
        <div class="cake-price">${formatPrice(cake.price, cake.currency)}</div>
      </div>
    </a>
  `;
}

async function renderCatalog() {
  const grid = qs('#catalog-grid');
  if (!grid) return;
  try {
    const cakes = await fetchJSON('data/legacy-cakes.json');
    grid.innerHTML = cakes.length
      ? cakes.map(legacyCardHTML).join('')
      : '<p class="empty-state">No cakes available right now.</p>';
  } catch {
    grid.innerHTML = '<p class="empty-state">Couldn\'t load the catalog — please refresh the page.</p>';
  }
}

document.addEventListener('DOMContentLoaded', renderCatalog);
