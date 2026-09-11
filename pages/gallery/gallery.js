/**
 * pages/gallery/gallery.js
 * Visual gallery pulling every cake across all categories into one grid.
 * Each tile links through to its detail page.
 *
 * Functions:
 * - renderGallery() -> loads legacy-cakes.json + modern-cakes.json, renders
 *   every item into #gallery-grid as a linked thumbnail tile.
 *
 * Data source: /data/legacy-cakes.json, /data/modern-cakes.json.
 * (Custom cakes have no fixed catalog entries, so they aren't part of the
 * gallery — see /pages/custom-cakes for that flow.)
 */

function galleryItemHTML(cake) {
  return `
    <a class="gallery-item" href="cake.html?id=${encodeURIComponent(cake.id)}">
      ${cakeThumbMarkup(cake)}
      <span class="gallery-caption">${escapeHTML(cake.name)}</span>
    </a>
  `;
}

async function renderGallery() {
  const grid = qs('#gallery-grid');
  if (!grid) return;
  try {
    const [legacy, modern] = await Promise.all([
      fetchJSON('data/legacy-cakes.json'),
      fetchJSON('data/modern-cakes.json'),
    ]);
    const all = [...legacy, ...modern];
    grid.innerHTML = all.map(galleryItemHTML).join('');
  } catch {
    grid.innerHTML = '<p class="empty-state">Couldn\'t load the gallery — please refresh the page.</p>';
  }
}

document.addEventListener('DOMContentLoaded', renderGallery);
