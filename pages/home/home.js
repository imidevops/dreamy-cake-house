/**
 * pages/home/home.js
 * Homepage: renders featured cakes (pulled from legacy + modern JSON where
 * featured === true) and testimonials.
 *
 * Functions:
 * - renderFeaturedCakes() -> loads legacy-cakes.json + modern-cakes.json,
 *   filters featured items, renders them into #featured-grid as cake-cards
 *   linking to cake.html?id=...
 * - renderTestimonials()  -> loads testimonials.json, renders into
 *   #testimonial-grid.
 * - init()                -> runs both on page load.
 *
 * Data source: /data/legacy-cakes.json, /data/modern-cakes.json,
 * /data/testimonials.json (via shared/utils.js#fetchJSON).
 */

function cakeCardHTML(cake) {
  const thumb = cakeThumbStyle(cake.id);
  return `
    <a class="cake-card" href="cake.html?id=${encodeURIComponent(cake.id)}">
      <div class="cake-thumb" style="background:${thumb.gradient}">${thumb.emoji}</div>
      <div class="cake-body">
        <h3>${escapeHTML(cake.name)}</h3>
        <div class="cake-flavor">${escapeHTML(cake.flavor)}</div>
        <p class="cake-desc">${escapeHTML(cake.description)}</p>
        <div class="cake-price">${formatPriceRange(cake.prices)}</div>
      </div>
    </a>
  `;
}

async function renderFeaturedCakes() {
  const grid = qs('#featured-grid');
  if (!grid) return;
  try {
    const [legacy, modern] = await Promise.all([
      fetchJSON('data/legacy-cakes.json'),
      fetchJSON('data/modern-cakes.json'),
    ]);
    const featured = [...legacy, ...modern].filter(c => c.featured);
    grid.innerHTML = featured.map(cakeCardHTML).join('');
  } catch {
    grid.innerHTML = `<p class="empty-state">Couldn't load our cakes right now — please refresh the page.</p>`;
  }
}

async function renderTestimonials() {
  const grid = qs('#testimonial-grid');
  if (!grid) return;
  try {
    const testimonials = await fetchJSON('data/testimonials.json');
    grid.innerHTML = testimonials.map(t => `
      <div class="testimonial-card">
        <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
        <p>&ldquo;${escapeHTML(t.quote)}&rdquo;</p>
        <div class="name">${escapeHTML(t.name)}</div>
      </div>
    `).join('');
  } catch {
    grid.innerHTML = '';
  }
}

function initHomePage() {
  renderFeaturedCakes();
  renderTestimonials();
}

document.addEventListener('DOMContentLoaded', initHomePage);
