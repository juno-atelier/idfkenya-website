/* ==============================================
   IDF Kenya — main.js
   Navbar scroll + mobile toggle + about-page JS
   + regions-page JS.

   TIMING NOTE:
   initNavScroll() and initMobileNav() are NOT
   called here on DOMContentLoaded. component.js
   fetches the navbar asynchronously and calls
   them after injection via the componentsReady
   event. Calling them here would race against
   the fetch and find no #navbar element.
   ============================================== */

'use strict';


/* ============================================
   1. NAVBAR — glass scroll effect
   Called by component.js after navbar is injected.
   ============================================ */
function initNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}


/* ============================================
   2. MOBILE NAV — hamburger toggle
   Called by component.js after navbar is injected.
   ============================================ */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('mobile-open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('mobile-open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}


/* ============================================
   3. ABOUT PAGE — scroll spy
   ============================================ */
function initAboutScrollSpy() {
  const SECTION_IDS = ['history', 'mission', 'values', 'partners', 'team', 'careers'];
  const OFFSET = 130;

  if (!document.getElementById(SECTION_IDS[0])) return;

  const getSideLinks   = () => document.querySelectorAll('.sidenav-list a[data-spy-target]');
  const getMobileLinks = () => document.querySelectorAll('.mobile-nav-link[data-spy-target]');

  function setActiveLink(activeId) {
    getSideLinks().forEach(link => {
      link.classList.toggle('active', link.dataset.spyTarget === activeId);
    });
    getMobileLinks().forEach(link => {
      link.classList.toggle('active', link.dataset.spyTarget === activeId);
    });
  }

  function getActiveSection() {
    for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
      const el = document.getElementById(SECTION_IDS[i]);
      if (el && el.getBoundingClientRect().top <= OFFSET) return SECTION_IDS[i];
    }
    return SECTION_IDS[0];
  }

  const onSpyScroll = () => setActiveLink(getActiveSection());
  window.addEventListener('scroll', onSpyScroll, { passive: true });
  onSpyScroll();
}


/* ============================================
   4. ABOUT PAGE — reading progress bar
   ============================================ */
function initAboutProgressBar() {
  const progressFill = document.getElementById('progressFill');
  const progressBar  = document.querySelector('.sidenav-progress-bar');
  const main         = document.getElementById('mainContent');
  if (!progressFill || !main) return;

  function updateProgress() {
    const scrolled = Math.max(0, -main.getBoundingClientRect().top);
    const pct = Math.min(100, Math.round((scrolled / main.offsetHeight) * 100));
    progressFill.style.width = `${pct}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', pct);
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}


/* ============================================
   5. ABOUT PAGE — scroll reveal
   ============================================ */
function initAboutScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => observer.observe(el));
}


/* ============================================
   6. ABOUT PAGE — smooth scroll
   ============================================ */
function initAboutSmoothScroll() {
  if (!document.querySelector('.about-sidenav') &&
      !document.querySelector('.mobile-about-nav')) return;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.getElementById(anchor.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 90,
        behavior: 'smooth'
      });
    });
  });
}


/* ============================================
   7. REGIONS PAGE — scroll spy
   Highlights the active county in both the
   desktop sidenav and mobile horizontal nav
   as the user scrolls down regions.html.
   Guard on #homa-bay — fires only on that page.
   ============================================ */
function initRegionsScrollSpy() {
  const COUNTY_IDS = [
    'homa-bay',
    'vihiga',
    'nyamira',
    'meru',
    'tharaka-nithi',
    'kwale',
    'kirinyaga'
  ];
  const OFFSET = 130;

  if (!document.getElementById(COUNTY_IDS[0])) return;

  const getSideLinks   = () =>
    document.querySelectorAll('.sidenav-list a[data-spy-target]');
  const getMobileLinks = () =>
    document.querySelectorAll('.mobile-regions-link[data-spy-target]');

  function setActiveCounty(activeId) {
    getSideLinks().forEach(link => {
      link.classList.toggle('active', link.dataset.spyTarget === activeId);
    });
    getMobileLinks().forEach(link => {
      link.classList.toggle('active', link.dataset.spyTarget === activeId);
    });
  }

  function getActiveCounty() {
    for (let i = COUNTY_IDS.length - 1; i >= 0; i--) {
      const el = document.getElementById(COUNTY_IDS[i]);
      if (el && el.getBoundingClientRect().top <= OFFSET) return COUNTY_IDS[i];
    }
    return COUNTY_IDS[0];
  }

  const onRegionsScroll = () => setActiveCounty(getActiveCounty());
  window.addEventListener('scroll', onRegionsScroll, { passive: true });
  onRegionsScroll();
}


/* ============================================
   8. REGIONS PAGE — reading progress bar
   Uses #regionsProgressFill and
   #regionsMainContent — unique ids that only
   exist on regions.html, so no collision with
   the about page's progress bar.
   ============================================ */
function initRegionsProgressBar() {
  const progressFill = document.getElementById('regionsProgressFill');
  const progressBar  = document.querySelector('.sidenav-progress-bar');
  const main         = document.getElementById('regionsMainContent');
  if (!progressFill || !main) return;

  function updateRegionsProgress() {
    const scrolled = Math.max(0, -main.getBoundingClientRect().top);
    const pct = Math.min(100, Math.round((scrolled / main.offsetHeight) * 100));
    progressFill.style.width = `${pct}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', pct);
  }

  window.addEventListener('scroll', updateRegionsProgress, { passive: true });
  updateRegionsProgress();
}


/* ============================================
   9. REGIONS PAGE — smooth scroll
   Overrides native anchor jump for all
   href="#..." links on regions.html only.
   Guard on .regions-sidenav or
   .mobile-regions-nav — elements that only
   exist on regions.html.
   ============================================ */
function initRegionsSmoothScroll() {
  if (!document.querySelector('.regions-sidenav') &&
      !document.querySelector('.mobile-regions-nav')) return;

  const SCROLL_OFFSET = 90;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET,
        behavior: 'smooth'
      });
    });
  });
}


/* ============================================
   DOMContentLoaded
   All page-specific functions are called here.
   Each guards itself with a DOM check, so only
   the functions relevant to the current page
   will actually execute.
   Navbar/mobile functions are called by
   component.js after fetch completes.
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  // About page
  initAboutScrollSpy();
  initAboutProgressBar();
  initAboutScrollReveal();
  initAboutSmoothScroll();

  // Regions page
  initRegionsScrollSpy();
  initRegionsProgressBar();
  initRegionsSmoothScroll();
});


/* ============================================
   componentsReady
   Fired by component.js once navbar + footer
   are injected. Available hook for future use.
   ============================================ */
document.addEventListener('componentsReady', () => {
  // navbar inits already called by component.js
});