// =============================================================================
//  components.js — IDF Kenya Premium Redesign
//  Preserved exact functional logic, formatted cleanly.
// =============================================================================

'use strict';

const DEBUG = true; // Set to false in production

function log(...args) {
  if (DEBUG) console.log('[IDF Kenya]', ...args);
}

// =============================================================================
//  UTILITIES & STATE
// =============================================================================

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

let _isMenuOpen = false;

function getPathPrefix() {
  return '';
}

async function loadComponent(url, selector) {
  const target = qs(selector);
  if (!target) {
    log(`Placeholder "${selector}" not found`);
    return false;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    target.innerHTML = await response.text();
    log(`Loaded: ${url}`);
    return true;
  } catch (err) {
    console.error(`Failed to load ${url}:`, err);
    target.innerHTML = `<div class="component-fallback">
      ⚠️ Navigation temporarily unavailable.
      <a href="index.html">Return to homepage</a>
    </div>`;
    return false;
  }
}

// =============================================================================
//  COMPONENT INITIALIZERS
// =============================================================================

function initMobileMenu() {
  const toggleBtn = qs('.hamburger-btn');
  const drawer    = qs('#mobile-drawer');

  if (!toggleBtn || !drawer) {
    log('Mobile menu elements not found — skipping');
    return;
  }

  toggleBtn.addEventListener('click', () => {
    _isMenuOpen = !_isMenuOpen;

    toggleBtn.setAttribute('aria-expanded', String(_isMenuOpen));
    drawer.setAttribute('aria-hidden', String(!_isMenuOpen));
    
    drawer.classList.toggle('is-open', _isMenuOpen);
    toggleBtn.classList.toggle('is-active', _isMenuOpen);
    
    document.body.style.overflow = _isMenuOpen ? 'hidden' : '';
  });

  document.addEventListener('click', (e) => {
    if (_isMenuOpen && !e.target.closest('#site-header')) {
      _isMenuOpen = false;
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.classList.remove('is-open');
      toggleBtn.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _isMenuOpen) {
      _isMenuOpen = false;
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.classList.remove('is-open');
      toggleBtn.classList.remove('is-active');
      document.body.style.overflow = '';
      toggleBtn.focus();
    }
  });
}

function setActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  qsa('.nav-link, .mobile-nav-link').forEach(link => {
    const isActive = link.dataset.page === currentPath;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  log(`Active nav page: ${currentPath}`);
}

function initStickyHeader() {
  const header = qs('#site-header');
  if (!header) {
    log('site-header not found — sticky scroll skipped');
    return;
  }

  // BUG-6 FIX: threshold was scrollY > 50. With hero now below the navbar
  // (margin-top: 72px), the navbar sits over white page background at load.
  // The old 50px grace period left all nav links invisible for the first
  // scroll movement. We now apply is-scrolled immediately on page load
  // (scrollY >= 0 is always true) so the navbar is solid from the first
  // render. The enhanced shadow/blur from .is-scrolled still animates in
  // naturally as the user scrolls.
  window._idfStickyHandler = () => {
    header.classList.toggle('is-scrolled', window.scrollY >= 0);
  };

  window.addEventListener('scroll', window._idfStickyHandler, { passive: true });
  window._idfStickyHandler(); // Fire immediately — solidifies navbar on load
}

function initFooterYear() {
  const el = qs('#footer-year');
  if (el) {
    el.textContent = new Date().getFullYear();
    log('Footer year set to:', el.textContent);
  }
}

function initBackToTop() {
  const btn = qs('#backToTop');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  log('Back-to-top initialized');
}

// =============================================================================
//  MAIN INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  log('Initializing components...');

  const prefix = getPathPrefix();

  const [navLoaded, footerLoaded] = await Promise.all([
    loadComponent(`${prefix}components/navbar.html`,  '#navbar-placeholder'),
    loadComponent(`${prefix}components/footer.html`,  '#footer-placeholder'),
  ]);

  if (navLoaded) {
    log('Navbar loaded → initializing nav modules');
    setActiveNavLink();
    initMobileMenu();
    initStickyHeader();
  }

  if (footerLoaded) {
    log('Footer loaded → initializing footer modules');
    initFooterYear();
    initBackToTop();
  }

  document.dispatchEvent(new CustomEvent('componentsReady'));
  log('componentsReady dispatched ✓');
});

window.addEventListener('beforeunload', () => {
  if (window._idfStickyHandler) {
    window.removeEventListener('scroll', window._idfStickyHandler);
  }
  if (_isMenuOpen) {
    document.body.style.overflow = '';
  }
});