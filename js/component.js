/* ==============================================
   IDF Kenya — component.js
   Fetches and injects shared navbar + footer into
   every page via placeholder divs.

   WHY INLINED CALLS DON'T WORK:
   main.js runs on DOMContentLoaded, which fires
   before this async fetch completes. So #navbar
   doesn't exist yet when main.js tries to init it.
   Solution: component.js owns all navbar/footer
   inits and dispatches 'componentsReady' when done.
   Pages that need post-injection work listen for
   that event instead of DOMContentLoaded.
   ============================================== */

'use strict';

/**
 * Fetch an HTML file and inject it into a placeholder element.
 * Resolves to true on success, false on failure.
 * @param {string} selector  CSS selector for the placeholder div
 * @param {string} filePath  Absolute path to the HTML fragment
 * @returns {Promise<boolean>}
 */
async function loadComponent(selector, filePath) {
  const el = document.querySelector(selector);
  if (!el) return false;

  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    el.outerHTML = await res.text();   // replace placeholder with real element
    return true;
  } catch (err) {
    console.warn(`[component.js] Could not load "${filePath}":`, err.message);
    el.remove();                        // remove broken placeholder from DOM
    return false;
  }
}

/**
 * After the navbar is injected, highlight the link that matches
 * the current page URL.
 */
function markActiveNavLink() {
  const currentPath = window.location.pathname
    .replace(/\/index\.html$/, '/')   // treat /index.html as /
    .replace(/\/$/, '');              // strip trailing slash for comparison

  document.querySelectorAll('.nav-links a, .dropdown a').forEach(link => {
    const href = (link.getAttribute('href') || '')
      .replace(/\/index\.html$/, '/')
      .replace(/\/$/, '');

    if (href && href === currentPath) {
      link.classList.add('active-link');
      // Also highlight the parent top-level item if inside a dropdown
      const parentLi = link.closest('.has-dropdown');
      if (parentLi) {
        const parentLink = parentLi.querySelector('.nav-link');
        if (parentLink) parentLink.classList.add('active-link');
      }
    }
  });
}

/**
 * Main entry point — fetch both components, then fire post-injection inits.
 */
async function initComponents() {
  // Load both components in parallel for speed
  await Promise.all([
    loadComponent('#navbar-placeholder', '/components/navbar.html'),
    loadComponent('#footer-placeholder', '/components/footer.html'),
  ]);

  // Highlight the active page in the nav
  markActiveNavLink();

  // Initialise navbar behaviour now that #navbar exists in the DOM.
  // These functions are defined in main.js with guards, so safe to call
  // even if the navbar failed to load.
  if (typeof initNavScroll === 'function') initNavScroll();
  if (typeof initMobileNav === 'function') initMobileNav();

  // Dispatch a custom event so any page-specific script can safely
  // run code that depends on the injected navbar/footer.
  document.dispatchEvent(new CustomEvent('componentsReady'));
}

document.addEventListener('DOMContentLoaded', initComponents);
