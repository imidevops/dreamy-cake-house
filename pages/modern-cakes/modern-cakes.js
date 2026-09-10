/**
 * pages/modern-cakes/modern-cakes.js
 * Renders the Modern Cakes catalog grid, filterable by occasion.
 *
 * Functions:
 * - formatOccasion(slug)     -> "baby-shower" -> "Baby Shower".
 * - renderFilterBar(cakes)   -> builds the "All" + one chip per unique
 *   occasion found in the data, wires click handlers.
 * - renderGrid(cakes)        -> renders the given cake list into #catalog-grid.
 * - applyFilter(occasion)    -> filters ALL_CAKES by occasion ("all" = no
 *   filter) and re-renders the grid + active chip state.
 * - init()                   -> loads modern-cakes.json, then renders the
 *   filter bar and the initial (unfiltered) grid.
 *
 * Data source: /data/modern-cakes.json (via shared/utils.js#fetchJSON).
 */

let ALL_CAKES = [];

function formatOccasion(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function modernCardHTML(cake) {
  const thumb = cakeThumbStyle(cake.id);
  const badges = cake.occasion.map(o => `<span class="badge">${formatOccasion(o)}</span>`).join('');
  return `
    <a class="cake-card" href="cake.html?id=${encodeURIComponent(cake.id)}">
      <div class="cake-thumb" style="background:${thumb.gradient}">${thumb.emoji}</div>
      <div class="cake-body">
        <h3>${escapeHTML(cake.name)}</h3>
        <div class="cake-flavor">${escapeHTML(cake.flavor)}</div>
        <p class="cake-desc">${escapeHTML(cake.description)}</p>
        <div>${badges}</div>
        <div class="cake-price">${formatPrice(cake.price, cake.currency)}</div>
      </div>
    </a>
  `;
}

function renderGrid(cakes) {
  const grid = qs('#catalog-grid');
  grid.innerHTML = cakes.length
    ? cakes.map(modernCardHTML).join('')
    : '<p class="empty-state">No cakes match that occasion yet.</p>';
}

function applyFilter(occasion) {
  qsa('.filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.occasion === occasion);
  });
  const filtered = occasion === 'all'
    ? ALL_CAKES
    : ALL_CAKES.filter(c => c.occasion.includes(occasion));
  renderGrid(filtered);
}

function renderFilterBar(cakes) {
  const bar = qs('#filter-bar');
  const occasions = [...new Set(cakes.flatMap(c => c.occasion))].sort();
  const chips = ['all', ...occasions].map(o => {
    const label = o === 'all' ? 'All' : formatOccasion(o);
    const activeClass = o === 'all' ? ' active' : '';
    return `<button class="filter-chip${activeClass}" data-occasion="${o}">${label}</button>`;
  }).join('');
  bar.innerHTML = chips;
  qsa('.filter-chip', bar).forEach(chip => {
    chip.addEventListener('click', () => applyFilter(chip.dataset.occasion));
  });
}

async function initModernCakesPage() {
  const grid = qs('#catalog-grid');
  try {
    ALL_CAKES = await fetchJSON('data/modern-cakes.json');
    renderFilterBar(ALL_CAKES);
    renderGrid(ALL_CAKES);
  } catch {
    grid.innerHTML = '<p class="empty-state">Couldn\'t load the catalog — please refresh the page.</p>';
  }
}

document.addEventListener('DOMContentLoaded', initModernCakesPage);
