/**
 * pages/contact/contact.js
 * Fills in the contact page's address, phone, WhatsApp link and map embed.
 *
 * Functions:
 * - renderContactInfo() -> writes CONTACT's fields into the page and builds
 *   the tel: / wa.me links and the Google Maps embed iframe src.
 *
 * CONTACT here mirrors BUSINESS in /shared/footer.js — kept as a separate
 * local constant so this page doesn't depend on footer.js's load order.
 * Update both if the business's contact details change.
 */

const CONTACT = {
  phone: '+1 (555) 019-2837',
  whatsapp: '15550192837',
  address: '128 Buttercream Lane, Maplewood, NY 10901',
  email: 'hello@dreamycakehouse.example',
  mapQuery: '128 Buttercream Lane, Maplewood, NY 10901',
};

function renderContactInfo() {
  qs('#contact-address').textContent = CONTACT.address;
  qs('#contact-phone').textContent = CONTACT.phone;
  qs('#contact-phone').href = `tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`;
  qs('#contact-email').textContent = CONTACT.email;
  qs('#contact-email').href = `mailto:${CONTACT.email}`;

  const waMessage = encodeURIComponent("Hi! I'd like to ask about ordering a cake.");
  const waLink = `https://wa.me/${CONTACT.whatsapp}?text=${waMessage}`;
  qs('#contact-whatsapp').href = waLink;
  qs('#contact-whatsapp-btn').href = waLink;

  qs('#contact-map').src = `https://maps.google.com/maps?q=${encodeURIComponent(CONTACT.mapQuery)}&output=embed`;
}

document.addEventListener('DOMContentLoaded', renderContactInfo);
