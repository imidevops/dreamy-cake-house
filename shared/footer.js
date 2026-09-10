/**
 * shared/footer.js
 * Renders the site footer into <div id="site-footer"></div>.
 *
 * Functions:
 * - renderFooter() -> builds and injects the footer markup (contact info,
 *   quick links, WhatsApp link). Contact details are hardcoded here since
 *   they're business info, not catalog data — update them in one place if
 *   the phone/address changes.
 */

const BUSINESS = {
  phone: '+1 (555) 019-2837',
  whatsapp: '15550192837', // digits only, used to build the wa.me link
  address: '128 Buttercream Lane, Maplewood, NY 10901',
  email: 'hello@dreamycakehouse.example',
};

function renderFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;

  const year = new Date().getFullYear();

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h4>Dreamy Cake House</h4>
            <p>Handcrafted custom, traditional and modern cakes for every celebration.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <p>
              <a href="custom-cakes.html">Custom Cakes</a><br>
              <a href="legacy-cakes.html">Legacy Cakes</a><br>
              <a href="modern-cakes.html">Modern Cakes</a><br>
              <a href="gallery.html">Gallery</a>
            </p>
          </div>
          <div>
            <h4>Contact</h4>
            <p>
              ${BUSINESS.address}<br>
              <a href="tel:${BUSINESS.phone.replace(/[^+\d]/g, '')}">${BUSINESS.phone}</a><br>
              <a href="https://wa.me/${BUSINESS.whatsapp}" target="_blank" rel="noopener">WhatsApp Us</a>
            </p>
          </div>
        </div>
        <div class="footer-bottom">&copy; ${year} Dreamy Cake House. All rights reserved.</div>
      </div>
    </footer>
  `;
}
