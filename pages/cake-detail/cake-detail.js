/**
 * pages/cake-detail/cake-detail.js
 * Cake detail page for cake.html?id=<id>. The catalog is split across two
 * JSON files (legacy + modern), so this searches both by id.
 *
 * Functions:
 * - findCakeById(id)  -> fetches both catalogs and returns the matching
 *   cake object, or null if not found.
 * - renderCake(cake)  -> fills in the detail template with the cake's data
 *   and builds a WhatsApp order link prefilled with its name and price.
 * - renderNotFound()  -> shown when no id matches (bad link or deleted item).
 * - init()            -> reads ?id= from the URL and runs the above.
 *
 * Data source: /data/legacy-cakes.json, /data/modern-cakes.json.
 */

// Same WhatsApp number as shared/footer.js#BUSINESS.whatsapp — kept local
// here so this file doesn't depend on footer.js load order.
const ORDER_WHATSAPP_NUMBER = '15550192837';

async function findCakeById(id) {
  const [legacy, modern] = await Promise.all([
    fetchJSON('data/legacy-cakes.json'),
    fetchJSON('data/modern-cakes.json'),
  ]);
  return [...legacy, ...modern].find(c => c.id === id) || null;
}

function renderCake(cake) {
  const thumb = cakeThumbStyle(cake.id);
  qs('#detail-thumb').style.background = thumb.gradient;
  qs('#detail-thumb').textContent = thumb.emoji;
  qs('#detail-name').textContent = cake.name;
  qs('#detail-flavor').textContent = cake.flavor;
  qs('#detail-description').textContent = cake.description;
  qs('#detail-price').textContent = formatPrice(cake.price, cake.currency);
  document.title = `${cake.name} | Dreamy Cake House`;

  const badges = qs('#detail-badges');
  badges.innerHTML = (cake.occasion || [])
    .map(o => `<span class="badge">${escapeHTML(o.replace(/-/g, ' '))}</span>`)
    .join('');

  const message = encodeURIComponent(`Hi! I'd like to order the ${cake.name} (${formatPrice(cake.price, cake.currency)}).`);
  qs('#order-cta').href = `https://wa.me/${ORDER_WHATSAPP_NUMBER}?text=${message}`;

  qs('#detail-content').hidden = false;
}

function renderNotFound() {
  qs('#detail-not-found').hidden = false;
}

async function initCakeDetailPage() {
  const id = getQueryParam('id');
  if (!id) return renderNotFound();

  try {
    const cake = await findCakeById(id);
    if (!cake) return renderNotFound();
    renderCake(cake);
  } catch {
    renderNotFound();
  }
}

document.addEventListener('DOMContentLoaded', initCakeDetailPage);
