/**
 * pages/cake-detail/cake-detail.js
 * Cake detail page for cake.html?id=<id>. The catalog is split across two
 * JSON files (legacy + modern), so this searches both by id.
 *
 * Functions:
 * - findCakeById(id)  -> fetches both catalogs and returns the matching
 *   cake object, or null if not found.
 * - renderCake(cake)  -> fills in the detail template with the cake's data,
 *   renders the 1lb/2lb/3lb price tiers as selectable options, and builds a
 *   WhatsApp order link prefilled with its name, chosen size, and price.
 * - selectTier(cake, tierKey) -> marks a tier button active and updates the
 *   displayed price + WhatsApp link to match the chosen size.
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

function selectTier(cake, tierKey) {
  qsa('.tier-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tier === tierKey));
  const amount = cake.prices[tierKey];
  qs('#detail-price').textContent = formatPrice(amount);

  const tierLabel = POUND_TIERS.find(t => t.key === tierKey)?.label || tierKey;
  const message = encodeURIComponent(
    `Hi! I'd like to order the ${cake.name} (${tierLabel}, ${formatPrice(amount)}).`
  );
  qs('#order-cta').href = `https://wa.me/${ORDER_WHATSAPP_NUMBER}?text=${message}`;
}

function renderCake(cake) {
  qs('#detail-thumb').innerHTML = cakeThumbMarkup(cake);
  qs('#detail-name').textContent = cake.name;
  qs('#detail-flavor').textContent = cake.flavor;
  qs('#detail-description').textContent = cake.description;
  document.title = `${cake.name} | Dreamy Cake House`;

  const badges = qs('#detail-badges');
  badges.innerHTML = (cake.occasion || [])
    .map(o => `<span class="badge">${escapeHTML(o.replace(/-/g, ' '))}</span>`)
    .join('');

  const availableTiers = POUND_TIERS.filter(t => typeof cake.prices?.[t.key] === 'number');
  const tiersEl = qs('#detail-tiers');
  tiersEl.innerHTML = availableTiers.map((t, i) => `
    <button type="button" class="tier-btn${i === 0 ? ' active' : ''}" data-tier="${t.key}">
      ${t.label}<span class="tier-price">${formatPrice(cake.prices[t.key])}</span>
    </button>
  `).join('');
  qsa('.tier-btn', tiersEl).forEach(btn => {
    btn.addEventListener('click', () => selectTier(cake, btn.dataset.tier));
  });

  if (availableTiers.length) selectTier(cake, availableTiers[0].key);

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
