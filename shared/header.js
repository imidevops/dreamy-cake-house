/**
 * shared/header.js
 * Renders the sticky site header/nav into <div id="site-header"></div>.
 *
 * Functions:
 * - renderHeader(activePage) -> builds and injects the header markup,
 *   marking the link matching `activePage` as active, and wires up the
 *   mobile nav toggle.
 *
 * `activePage` is a short key set by each page's inline script, e.g. "home",
 * "custom", "legacy", "modern", "gallery", "about", "contact".
 */

const NAV_LINKS = [
  { key: 'home', href: 'index.html', label: 'Home' },
  { key: 'custom', href: 'custom-cakes.html', label: 'Custom Cakes' },
  { key: 'legacy', href: 'legacy-cakes.html', label: 'Legacy Cakes' },
  { key: 'modern', href: 'modern-cakes.html', label: 'Modern Cakes' },
  { key: 'gallery', href: 'gallery.html', label: 'Gallery' },
  { key: 'about', href: 'about.html', label: 'About' },
  { key: 'contact', href: 'contact.html', label: 'Contact' },
];

function renderHeader(activePage) {
  const mount = document.getElementById('site-header');
  if (!mount) return;

  const links = NAV_LINKS.map(link => {
    const activeClass = link.key === activePage ? ' class="active"' : '';
    return `<li><a href="${link.href}"${activeClass}>${link.label}</a></li>`;
  }).join('');

  mount.innerHTML = `
    <header class="site-header">
      <div class="container">
        <a href="index.html" class="logo">Dreamy Cake <span>House</span></a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">&#9776;</button>
        <nav class="site-nav" id="site-nav">
          <ul>${links}</ul>
        </nav>
      </div>
    </header>
  `;

  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}
