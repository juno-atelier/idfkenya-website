/* ==============================================
   IDF Kenya — main.js (ES6 Module)
   
   REGIONS PAGE CHANGES (v4.1):
   ─────────────────────────────────────────────
   5.  initRegionsScrollSpy  — REFACTORED
       OLD: scroll event + getBoundingClientRect + wrong selectors
         '.sidenav-list a[data-spy-target]'      (class doesn't exist in HTML)
         '.mobile-regions-link[data-spy-target]' (class doesn't exist in HTML)
         active class: 'active'                  (not in sidenav.css)
       NEW: IntersectionObserver (zero layout thrashing) + correct BEM selectors
         '.sidenav__link[data-spy-target]'
         '.mobile-tab-nav__link[data-spy-target]'
         active classes: 'sidenav__link--active' / 'mobile-tab-nav__link--active'

   6.  initRegionsProgressBar — FIXED
       OLD: '.sidenav-progress-bar' (selector matched nothing)
       NEW: searches within '.sidenav__progress-bar' via closest('[role="progressbar"]')

   7.  initRegionsSmoothScroll — FIXED & EXPANDED
       OLD: guarded on '.regions-sidenav' / '.mobile-regions-nav' (neither exists)
            so the function NEVER fired.
       NEW: guarded on '#homa-bay' (reliable regions-page sentinel)
            Covers sidenav links, mobile tab links, AND hero pills.

   NEW: initRegionsScrollReveal — handles .reveal / .reveal-left / .reveal-right
        on the regions page (was missing; other pages had their own equivalents).
        Called in initAll().

   All other functions (About, Our Work, Resources, Contact) are unchanged.
   ============================================== */

'use strict';

import { initCounters, initScrollReveal } from './scroll.js';
import { initNewsletterSignup, initContactFormHandler, initSmoothScroll } from './utils.js';


/* ============================================
   1. ABOUT PAGE — scroll spy (IntersectionObserver)
   ─────────────────────────────────────────────
   REFACTORED (v7): replaced old scroll-event + getBoundingClientRect
   approach with the same IntersectionObserver pattern used by
   initWorkScrollSpy and initRegionsScrollSpy.

   SELECTOR FIXES vs. original:
     OLD (broken): '.sidenav-list a[data-spy-target]'    → matched nothing
                   '.mobile-nav-link[data-spy-target]'   → matched nothing
     NEW (correct): '.sidenav__link[data-spy-target]'
                    '.mobile-tab-nav__link[data-spy-target]'

   ACTIVE-CLASS FIXES vs. original:
     OLD (broken): 'active'
     NEW (correct): 'sidenav__link--active'
                    'mobile-tab-nav__link--active'

   rootMargin: '-20% 0px -70% 0px'
     • top -20%:    section must clear the navbar + mobile tab bar
     • bottom -70%: section must be in the top 30% of viewport to
                    activate — prevents premature highlight when only
                    the bottom edge of a section is barely in view.
   ============================================ */
function initAboutScrollSpy() {
  const SECTION_IDS = ['history', 'mission', 'values', 'partners', 'team', 'careers'];

  // Guard: only run on the About page
  if (!document.getElementById(SECTION_IDS[0])) return;

  const SIDE_ACTIVE = 'sidenav__link--active';
  const TAB_ACTIVE  = 'mobile-tab-nav__link--active';

  // Collect nav links using correct BEM selectors from sidenav.css
  const sideLinks = Array.from(
    document.querySelectorAll('.sidenav__link[data-spy-target]')
  );
  const tabLinks = Array.from(
    document.querySelectorAll('.mobile-tab-nav__link[data-spy-target]')
  );
  const allNavLinks = [...sideLinks, ...tabLinks];

  if (!allNavLinks.length) return;

  // Pre-build Map<sectionId → { sideLink, tabLink }> for O(1) lookup
  const linkMap = new Map();
  sideLinks.forEach(link => {
    const id = link.dataset.spyTarget;
    if (!linkMap.has(id)) linkMap.set(id, {});
    linkMap.get(id).sideLink = link;
  });
  tabLinks.forEach(link => {
    const id = link.dataset.spyTarget;
    if (!linkMap.has(id)) linkMap.set(id, {});
    linkMap.get(id).tabLink = link;
  });

  // Observe only sections that have a matching nav link
  const sections = Array.from(
    document.querySelectorAll('.about-section[id]')
  ).filter(s => linkMap.has(s.id));

  if (!sections.length) return;

  // Track which sections are inside the active zone simultaneously
  const intersecting = new Set();

  function clearActive() {
    sideLinks.forEach(l => l.classList.remove(SIDE_ACTIVE));
    tabLinks.forEach(l  => l.classList.remove(TAB_ACTIVE));
  }

  function setActive(id) {
    clearActive();
    const entry = linkMap.get(id);
    if (!entry) return;
    if (entry.sideLink) entry.sideLink.classList.add(SIDE_ACTIVE);
    if (entry.tabLink) {
      entry.tabLink.classList.add(TAB_ACTIVE);
      // Scroll the active tab into the centre of the strip without moving the page.
      // scrollIntoView() scrolls the whole page — we want only the tab container.
      const tabInner = entry.tabLink.closest('.mobile-tab-nav__inner');
      if (tabInner) {
        const linkLeft   = entry.tabLink.offsetLeft;
        const linkWidth  = entry.tabLink.offsetWidth;
        const stripWidth = tabInner.offsetWidth;
        tabInner.scrollTo({
          left: linkLeft - (stripWidth / 2) + (linkWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }

  // "topmost wins" — if multiple sections are in zone, highlight the first in DOM order
  function topMostId() {
    for (const section of sections) {
      if (intersecting.has(section.id)) return section.id;
    }
    return null;
  }

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) intersecting.add(entry.target.id);
      else                      intersecting.delete(entry.target.id);
    });
    const activeId = topMostId();
    if (activeId) setActive(activeId);
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(s => spyObserver.observe(s));

  // Click handler — instant highlight + smooth scroll (no e.preventDefault needed;
  // native anchor handles scroll, setActive gives immediate visual feedback)
  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      const id = link.dataset.spyTarget;
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      setActive(id); // immediate feedback before IntersectionObserver fires
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Set the first link active on initial load
  setActive(SECTION_IDS[0]);
}


/* ============================================
   2. ABOUT PAGE — reading progress bar
   ─────────────────────────────────────────────
   FIXED (v7):
     OLD (broken): '.sidenav-progress-bar' matched nothing in the DOM.
     NEW (correct): uses progressFill.closest('[role="progressbar"]'),
                    same pattern as initWorkProgressBar.
   Also added requestAnimationFrame throttle for smooth rendering.
   ============================================ */
function initAboutProgressBar() {
  const progressFill = document.getElementById('progressFill');
  if (!progressFill) return;

  // Walk up from the fill element to find the [role="progressbar"] wrapper
  const progressBar = progressFill.closest('[role="progressbar"]');
  let rafPending = false;

  function updateProgress() {
    rafPending = false;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    progressFill.style.width = pct.toFixed(1) + '%';
    if (progressBar) progressBar.setAttribute('aria-valuenow', Math.round(pct));
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });

  updateProgress(); // initialise on load
}


/* ============================================
   3. ABOUT PAGE — scroll reveal
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
   4. ABOUT PAGE — smooth scroll (hero pills)
   ─────────────────────────────────────────────
   FIXED (v7):
     OLD (broken): guarded on '.about-sidenav' / '.mobile-about-nav'
                   — neither class exists in the HTML — so the function
                   NEVER fired.
     NEW (correct): guarded on '#history' (reliable About-page sentinel).
                    Scoped to hero pill anchors only; sidenav + mobile tab
                    links are handled directly inside initAboutScrollSpy.
   ============================================ */
function initAboutSmoothScroll() {
  // Guard: only run on the About page
  if (!document.getElementById('history')) return;

  const SCROLL_OFFSET = 100; // px: clears fixed navbar + breathing room

  // Handle hero pills; sidenav + tab links are handled in initAboutScrollSpy
  document.querySelectorAll('.about-hero-nav-pills a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}


/* ============================================
   5. REGIONS PAGE — scroll spy (IntersectionObserver)
   ─────────────────────────────────────────────
   REFACTORED: replaced scroll-event + getBoundingClientRect
   with IntersectionObserver for zero layout thrashing.

   SELECTOR FIXES vs. original:
     OLD (broken): '.sidenav-list a[data-spy-target]'
                   '.mobile-regions-link[data-spy-target]'
     NEW (correct): '.sidenav__link[data-spy-target]'
                    '.mobile-tab-nav__link[data-spy-target]'

   ACTIVE-CLASS FIXES vs. original:
     OLD (broken): 'active'
     NEW (correct): 'sidenav__link--active'
                    'mobile-tab-nav__link--active'

   rootMargin explanation:
     '-100px 0px -55% 0px'
     • top: -100px  → section must pass 100px below viewport top
       (clears the fixed navbar + mobile tab bar)
     • bottom: -55% → section must be in the top 45% of viewport
       to be considered "active" — prevents premature activation
       when the next section is barely in view.
   ============================================ */
function initRegionsScrollSpy() {
  const COUNTY_IDS = [
    'homa-bay', 'vihiga', 'nyamira', 'meru',
    'tharaka-nithi', 'kwale', 'kirinyaga'
  ];

  // Guard: only runs on the Regions page
  if (!document.getElementById(COUNTY_IDS[0])) return;

  const SIDE_ACTIVE = 'sidenav__link--active';
  const TAB_ACTIVE  = 'mobile-tab-nav__link--active';

  // Collect nav links using correct BEM selectors from sidenav.css
  const sideLinks = Array.from(
    document.querySelectorAll('.sidenav__link[data-spy-target]')
  );
  const tabLinks = Array.from(
    document.querySelectorAll('.mobile-tab-nav__link[data-spy-target]')
  );
  const allNavLinks = [...sideLinks, ...tabLinks];

  if (!allNavLinks.length) return;

  // Pre-build Map<countyId, {sideLink, tabLink}> for O(1) lookup
  const linkMap = new Map();
  sideLinks.forEach(link => {
    const id = link.dataset.spyTarget;
    if (!linkMap.has(id)) linkMap.set(id, {});
    linkMap.get(id).sideLink = link;
  });
  tabLinks.forEach(link => {
    const id = link.dataset.spyTarget;
    if (!linkMap.has(id)) linkMap.set(id, {});
    linkMap.get(id).tabLink = link;
  });

  function clearActive() {
    sideLinks.forEach(l => l.classList.remove(SIDE_ACTIVE));
    tabLinks.forEach(l  => l.classList.remove(TAB_ACTIVE));
  }

  function setActive(id) {
    clearActive();
    const entry = linkMap.get(id);
    if (!entry) return;

    if (entry.sideLink) entry.sideLink.classList.add(SIDE_ACTIVE);
    if (entry.tabLink) {
      entry.tabLink.classList.add(TAB_ACTIVE);
      const tabInner = entry.tabLink.closest('.mobile-tab-nav__inner');
      if (tabInner) {
        const linkLeft   = entry.tabLink.offsetLeft;
        const linkWidth  = entry.tabLink.offsetWidth;
        const stripWidth = tabInner.offsetWidth;
        tabInner.scrollTo({ left: linkLeft - (stripWidth / 2) + (linkWidth / 2), behavior: 'smooth' });
      }
    }
  }

  // Collect observed sections in DOM order (topmost-wins logic)
  const sections = COUNTY_IDS
    .map(id => document.getElementById(id))
    .filter(Boolean);

  // Track which sections are inside the root zone simultaneously
  const intersecting = new Set();

  function topMostId() {
    for (const section of sections) {
      if (intersecting.has(section.id)) return section.id;
    }
    return null;
  }

  // IntersectionObserver — fires when section crosses the active zone
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) intersecting.add(entry.target.id);
      else                      intersecting.delete(entry.target.id);
    });
    const activeId = topMostId();
    if (activeId) setActive(activeId);
  }, {
    // top offset: clears fixed navbar (88px) + mobile tab bar (~48px) + buffer
    // bottom clip: section must be in top 45% of viewport to activate
    rootMargin: '-100px 0px -55% 0px',
    threshold: 0
  });

  sections.forEach(s => spyObserver.observe(s));

  // Click handler — immediate active highlight + smooth scroll
  allNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.dataset.spyTarget;
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      setActive(id); // instant feedback before scroll completes
      // Use scrollIntoView for built-in smooth behaviour
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Activate first county on initial load
  setActive(COUNTY_IDS[0]);
}


/* ============================================
   6. REGIONS PAGE — reading progress bar
   ─────────────────────────────────────────────
   FIXED: selector was '.sidenav-progress-bar' (matched nothing).
   Now finds the [role="progressbar"] wrapper element via closest().
   ============================================ */
function initRegionsProgressBar() {
  const progressFill = document.getElementById('regionsProgressFill');
  const main         = document.getElementById('regionsMainContent');
  if (!progressFill || !main) return;

  // The progressbar role lives on the wrapper div, not the fill element
  const progressBar = progressFill.closest('[role="progressbar"]');

  let rafPending = false;

  function updateRegionsProgress() {
    rafPending = false;
    const scrolled = Math.max(0, -main.getBoundingClientRect().top);
    const pct = Math.min(100, Math.round((scrolled / main.offsetHeight) * 100));
    progressFill.style.width = `${pct}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', pct);
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateRegionsProgress);
    }
  }, { passive: true });

  updateRegionsProgress(); // initialise on load
}


/* ============================================
   7. REGIONS PAGE — smooth scroll
   ─────────────────────────────────────────────
   FIXED: was guarded on '.regions-sidenav' / '.mobile-regions-nav'
   — neither class exists in the HTML — so the function NEVER ran.
   Now guarded on '#homa-bay', the reliable regions-page sentinel.

   EXPANDED: covers sidenav links, mobile tab links, AND hero pills.
   The sidenav / mobile tab click handler in initRegionsScrollSpy
   already handles those two nav bars, so this function only needs
   to handle the hero pill anchors (+ any other in-page links).
   ============================================ */
function initRegionsSmoothScroll() {
  // Guard: only run on the Regions page
  if (!document.getElementById('homa-bay')) return;

  // 100px offset: fixed navbar height (~88px) + small breathing room
  const SCROLL_OFFSET = 100;

  // Scope to hero pills; sidenav + tab links are handled in initRegionsScrollSpy
  document.querySelectorAll('.regions-hero-pill[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}


/* ============================================
   NEW — 7b. REGIONS PAGE — scroll reveal
   ─────────────────────────────────────────────
   Handles .reveal, .reveal-left, .reveal-right on the Regions page.
   Was missing — the About page and Our Work page each had their own
   equivalents, but the Regions page had none, leaving all story cards
   permanently invisible (opacity: 0) after the initial load.
   ============================================ */
function initRegionsScrollReveal() {
  // Guard: only run on the Regions page
  if (!document.getElementById('homa-bay')) return;

  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!revealEls.length) return;

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // fire once per element
      }
    });
  }, {
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.05
  });

  revealEls.forEach(el => revealObserver.observe(el));
}


/* ============================================
   8. OUR WORK PAGE — scroll spy (IntersectionObserver)
   ============================================ */
function initWorkScrollSpy() {
  if (!document.getElementById('nuru-ya-mtoto')) return;

  const SIDE_ACTIVE = 'sidenav__link--active';
  const TAB_ACTIVE  = 'mobile-tab-nav__link--active';

  const sideLinks = Array.from(
    document.querySelectorAll('.sidenav__link[data-spy-target]')
  );
  const tabLinks = Array.from(
    document.querySelectorAll('.mobile-tab-nav__link[data-spy-target]')
  );
  const allNavLinks = [...sideLinks, ...tabLinks];

  if (!allNavLinks.length) return;

  const linkMap = new Map();
  sideLinks.forEach(link => {
    const id = link.dataset.spyTarget;
    if (!linkMap.has(id)) linkMap.set(id, {});
    linkMap.get(id).sideLink = link;
  });
  tabLinks.forEach(link => {
    const id = link.dataset.spyTarget;
    if (!linkMap.has(id)) linkMap.set(id, {});
    linkMap.get(id).tabLink = link;
  });

  const sections = Array.from(
    document.querySelectorAll('.work-section[id]')
  ).filter(s => linkMap.has(s.id));

  if (!sections.length) return;

  const intersecting = new Set();

  function clearActive() {
    sideLinks.forEach(l => l.classList.remove(SIDE_ACTIVE));
    tabLinks.forEach(l  => l.classList.remove(TAB_ACTIVE));
  }

  function setActive(id) {
    clearActive();
    const entry = linkMap.get(id);
    if (!entry) return;
    if (entry.sideLink) entry.sideLink.classList.add(SIDE_ACTIVE);
    if (entry.tabLink) {
      entry.tabLink.classList.add(TAB_ACTIVE);
      const tabInner = entry.tabLink.closest('.mobile-tab-nav__inner');
      if (tabInner) {
        const linkLeft   = entry.tabLink.offsetLeft;
        const linkWidth  = entry.tabLink.offsetWidth;
        const stripWidth = tabInner.offsetWidth;
        tabInner.scrollTo({ left: linkLeft - (stripWidth / 2) + (linkWidth / 2), behavior: 'smooth' });
      }
    }
  }

  function topMostId() {
    for (const section of sections) {
      if (intersecting.has(section.id)) return section.id;
    }
    return null;
  }

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) intersecting.add(entry.target.id);
      else                      intersecting.delete(entry.target.id);
    });
    const activeId = topMostId();
    if (activeId) setActive(activeId);
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(s => spyObserver.observe(s));

  allNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.dataset.spyTarget;
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      setActive(id);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}


/* ============================================
   9. OUR WORK PAGE — reading progress bar
   ============================================ */
function initWorkProgressBar() {
  const progressFill = document.getElementById('workProgressFill');
  if (!progressFill) return;

  const progressBar = progressFill.closest('[role="progressbar"]');

  let rafPending = false;

  function updateWorkProgress() {
    rafPending = false;
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const pct        = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    progressFill.style.width = pct.toFixed(1) + '%';
    if (progressBar) progressBar.setAttribute('aria-valuenow', Math.round(pct));
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateWorkProgress);
    }
  }, { passive: true });

  updateWorkProgress();
}


/* ============================================
   10. OUR WORK PAGE — smooth scroll
   (handled inside initWorkScrollSpy — stub kept for initAll compatibility)
   ============================================ */
function initWorkSmoothScroll() {
  // Intentionally empty — handled in initWorkScrollSpy
}


/* ============================================
   11. RESOURCES PAGE — scroll spy (IntersectionObserver)
   ─────────────────────────────────────────────
   REFACTORED: replaced broken scroll-event + getBoundingClientRect
   approach with IntersectionObserver — matching initWorkScrollSpy
   and initRegionsScrollSpy exactly.

   SELECTOR FIXES vs. original:
     OLD (broken): '.sidenav-list a[data-spy-target]'     → matched nothing
                   '.mobile-res-link[data-spy-target]'    → matched nothing
     NEW (correct): '.sidenav__link[data-spy-target]'
                    '.mobile-tab-nav__link[data-spy-target]'

   ACTIVE-CLASS FIXES vs. original:
     OLD (broken): 'active'   → not defined in sidenav.css
     NEW (correct): 'sidenav__link--active'
                    'mobile-tab-nav__link--active'

   rootMargin: '-20% 0px -70% 0px'
     Matches initWorkScrollSpy — section must enter the top 30%
     of the viewport to activate, preventing premature highlights.
   ============================================ */
function initResourcesScrollSpy() {
  const SECTION_IDS = ['newsletters', 'gallery', 'videos'];

  // Guard: only run on the Resources page
  if (!document.getElementById(SECTION_IDS[0])) return;

  const SIDE_ACTIVE = 'sidenav__link--active';
  const TAB_ACTIVE  = 'mobile-tab-nav__link--active';

  // Correct BEM selectors — matching sidenav.css and the HTML markup
  const sideLinks = Array.from(
    document.querySelectorAll('.sidenav__link[data-spy-target]')
  );
  const tabLinks = Array.from(
    document.querySelectorAll('.mobile-tab-nav__link[data-spy-target]')
  );
  const allNavLinks = [...sideLinks, ...tabLinks];

  if (!allNavLinks.length) return;

  // O(1) lookup map: sectionId → { sideLink, tabLink }
  const linkMap = new Map();
  sideLinks.forEach(link => {
    const id = link.dataset.spyTarget;
    if (!linkMap.has(id)) linkMap.set(id, {});
    linkMap.get(id).sideLink = link;
  });
  tabLinks.forEach(link => {
    const id = link.dataset.spyTarget;
    if (!linkMap.has(id)) linkMap.set(id, {});
    linkMap.get(id).tabLink = link;
  });

  // Observe only .res-section elements whose id has a matching nav link
  const sections = Array.from(
    document.querySelectorAll('.res-section[id]')
  ).filter(s => linkMap.has(s.id));

  if (!sections.length) return;

  const intersecting = new Set();

  function clearActive() {
    sideLinks.forEach(l => l.classList.remove(SIDE_ACTIVE));
    tabLinks.forEach(l  => l.classList.remove(TAB_ACTIVE));
  }

  function setActive(id) {
    clearActive();
    const entry = linkMap.get(id);
    if (!entry) return;
    if (entry.sideLink) entry.sideLink.classList.add(SIDE_ACTIVE);
    if (entry.tabLink) {
      entry.tabLink.classList.add(TAB_ACTIVE);
      const tabInner = entry.tabLink.closest('.mobile-tab-nav__inner');
      if (tabInner) {
        const linkLeft   = entry.tabLink.offsetLeft;
        const linkWidth  = entry.tabLink.offsetWidth;
        const stripWidth = tabInner.offsetWidth;
        tabInner.scrollTo({ left: linkLeft - (stripWidth / 2) + (linkWidth / 2), behavior: 'smooth' });
      }
    }
  }

  // "topmost wins" — highlight the first section visible in DOM order
  function topMostId() {
    for (const section of sections) {
      if (intersecting.has(section.id)) return section.id;
    }
    return null;
  }

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) intersecting.add(entry.target.id);
      else                      intersecting.delete(entry.target.id);
    });
    const activeId = topMostId();
    if (activeId) setActive(activeId);
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(s => spyObserver.observe(s));

  // Click handler — immediate highlight + smooth scroll (matches Our Work pattern)
  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      const id = link.dataset.spyTarget;
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      setActive(id); // instant visual feedback before observer fires
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Activate first section on initial load
  setActive(SECTION_IDS[0]);
}


/* ============================================
   12. RESOURCES PAGE — reading progress bar
   ─────────────────────────────────────────────
   FIXED vs. original:
     OLD (broken): document.querySelector('.sidenav-progress-bar')
                   → class never exists in the DOM, so progressBar
                   was always null and aria-valuenow was never set.
                   No requestAnimationFrame throttle — fired on every
                   scroll tick.
     NEW (correct): progressFill.closest('[role="progressbar"]')
                   — same pattern used by initWorkProgressBar.
                   Added RAF guard for smooth, non-thrashing updates.
   ============================================ */
function initResourcesProgressBar() {
  const progressFill = document.getElementById('resourcesProgressFill');
  const main         = document.getElementById('resourcesMainContent');
  if (!progressFill || !main) return;

  // Walk up to the [role="progressbar"] wrapper — matches Our Work pattern
  const progressBar = progressFill.closest('[role="progressbar"]');

  let rafPending = false;

  function updateResourcesProgress() {
    rafPending = false;
    const scrolled = Math.max(0, -main.getBoundingClientRect().top);
    const pct = Math.min(100, Math.round((scrolled / main.offsetHeight) * 100));
    progressFill.style.width = `${pct}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', pct);
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateResourcesProgress);
    }
  }, { passive: true });

  updateResourcesProgress(); // initialise on load
}


/* ============================================
   13. RESOURCES PAGE — smooth scroll
   ─────────────────────────────────────────────
   FIXED vs. original:
     OLD (broken): guarded on '.res-sidenav' and '.mobile-res-nav'
                   — neither class exists in the HTML — so the function
                   NEVER fired on any page load.
     NEW (correct): guarded on '#newsletters' (reliable Resources-page
                   sentinel), matching the pattern used by
                   initRegionsSmoothScroll ('#homa-bay') and
                   initAboutSmoothScroll ('#history').
                   Scoped to hero jump anchors; sidenav + mobile tab
                   clicks are handled inside initResourcesScrollSpy.
   ============================================ */
function initResourcesSmoothScroll() {
  // Guard: only run on the Resources page
  if (!document.getElementById('newsletters')) return;

  const SCROLL_OFFSET = 100; // clears fixed navbar (~88px) + breathing room

  // Handle hero jump pills; sidenav + tab links handled in initResourcesScrollSpy
  document.querySelectorAll('.res-hero-jumps a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}


/* ============================================
   14. RESOURCES PAGE — gallery filter
   ============================================ */
function initGalleryFilter() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const filterBar = grid.closest('.res-section')?.querySelector('.res-filter-bar');
  if (!filterBar) return;

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.res-filter-btn');
    if (!btn) return;

    const filter = btn.dataset.filter;

    filterBar.querySelectorAll('.res-filter-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });

    const items = grid.querySelectorAll('.res-photo-item');
    let visible = 0;

    items.forEach(item => {
      const match = filter === 'all' || item.dataset.cat === filter;
      item.classList.toggle('res-filtered-out', !match);
      if (match) visible++;
    });

    const countEl   = document.getElementById('gallery-count');
    const noResults = document.getElementById('galleryNoResults');
    if (countEl)   countEl.textContent   = `${visible} photo${visible !== 1 ? 's' : ''}`;
    if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
  });
}


/* ============================================
   15. RESOURCES PAGE — video filter
   ============================================ */
function initVideoFilter() {
  const grid = document.getElementById('videoGrid');
  if (!grid) return;

  const filterBar = grid.closest('.res-section')?.querySelector('.res-filter-bar');
  if (!filterBar) return;

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.res-filter-btn');
    if (!btn) return;

    const filter = btn.dataset.filter;

    filterBar.querySelectorAll('.res-filter-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });

    grid.querySelectorAll('.res-video-card').forEach(card => {
      const match = filter === 'all' || card.dataset.cat === filter;
      card.classList.toggle('res-filtered-out', !match);
    });
  });
}


/* ============================================
   16. RESOURCES PAGE — photo lightbox  (ENHANCED v2)
   ─────────────────────────────────────────────
   Changes vs. original initLightbox():
     • Adds CSS 'closing' class + waits for animation before
       hiding (smooth scale-down exit).
     • Image loading: adds 'lb-loading' class until onload fires,
       then swaps to 'lb-loaded' to fade image in.
     • Focus trap: Tab / Shift+Tab loop within focusable controls
       while the modal is open.
     • Return focus: remembers which gallery item opened the
       modal and restores focus on close.
     • Touch swipe: touchstart/touchend detection with 50px
       threshold — swipes left/right to navigate.
     • data-count="n" on the lightbox element lets CSS hide
       nav arrows when there is only one photo.
   ============================================ */
function initLightbox() {
  const lightbox   = document.getElementById('lightbox');
  if (!lightbox) return;

  const lbImg      = document.getElementById('lightboxImg');
  const lbCaption  = document.getElementById('lightboxCaption');
  const lbCounter  = document.getElementById('lightboxCounter');
  const lbClose    = document.getElementById('lightboxClose');
  const lbPrev     = document.getElementById('lightboxPrev');
  const lbNext     = document.getElementById('lightboxNext');

  // State
  let currentIndex     = 0;
  let galleryItems     = [];
  let lastFocused      = null;  // element to return focus to on close
  let isAnimatingClose = false;

  // Focusable controls inside the modal (for focus trap)
  const FOCUSABLE_SELECTORS = [
    '#lightboxClose',
    '#lightboxPrev',
    '#lightboxNext'
  ];

  /* ── Touch swipe state ─────────────────────────────────── */
  let touchStartX = 0;
  const SWIPE_THRESHOLD = 50; // px

  /* ── Build item list from the visible gallery ────────────── */
  function buildItemList() {
    galleryItems = Array.from(
      document.querySelectorAll('#galleryGrid .res-photo-item:not(.res-filtered-out)')
    );
  }

  /* ── Load an image with a loading shimmer ────────────────── */
  function loadImage(src, alt) {
    lbImg.classList.add('lb-loading');
    lbImg.classList.remove('lb-loaded');
    lbImg.alt = alt || '';
    lbImg.src = ''; // reset so onload fires even if same src

    // Tiny delay so CSS class transition renders before src is set
    requestAnimationFrame(() => {
      lbImg.src = src;
    });

    lbImg.onload = () => {
      lbImg.classList.remove('lb-loading');
      lbImg.classList.add('lb-loaded');
    };

    lbImg.onerror = () => {
      // If image fails to load: remove shimmer and show broken state gracefully
      lbImg.classList.remove('lb-loading');
      lbImg.classList.add('lb-loaded');
    };
  }

  /* ── Open the lightbox at a given index ──────────────────── */
  function openAt(index) {
    buildItemList();
    if (!galleryItems.length) return;

    // Clamp to valid range
    currentIndex = Math.max(0, Math.min(index, galleryItems.length - 1));
    const item   = galleryItems[currentIndex];

    // Populate caption
    lbCaption.innerHTML = `
      <strong>${item.dataset.caption || ''}</strong>
      ${item.dataset.county  ? `<span>${item.dataset.county}</span>` : ''}
      ${item.dataset.program ? `<span> · ${item.dataset.program}</span>` : ''}
    `;

    // Counter
    lbCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;

    // Let CSS know how many images there are (hides arrows if only 1)
    lightbox.setAttribute('data-count', galleryItems.length);

    // Load full-size image with shimmer
    const src = item.dataset.src || item.querySelector('img').src;
    const alt = item.querySelector('img').alt || '';
    loadImage(src, alt);

    // Show modal
    lightbox.classList.remove('closing');
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    isAnimatingClose = false;

    // Move focus to close button (WCAG 2.1 criterion 2.1.1)
    lbClose.focus();
  }

  /* ── Close with animation ─────────────────────────────── */
  function closeLightbox() {
    if (isAnimatingClose) return;
    isAnimatingClose = true;

    // Add 'closing' class → triggers scale-down CSS animation
    lightbox.classList.add('closing');

    // Wait for CSS transition to complete before hiding
    // Transition duration is 0.22s (220ms) — add a small buffer
    setTimeout(() => {
      lightbox.classList.remove('open', 'closing');
      lightbox.setAttribute('aria-hidden', 'true');
      lbImg.src = '';
      lbImg.classList.remove('lb-loading', 'lb-loaded');
      document.body.style.overflow = '';
      isAnimatingClose = false;

      // Return focus to the element that opened the lightbox
      if (lastFocused && document.contains(lastFocused)) {
        lastFocused.focus();
        lastFocused = null;
      }
    }, 260); // slightly > 0.22s transition + 0.18s caption delay
  }

  /* ── Navigation helpers ──────────────────────────────── */
  function showPrev() {
    if (currentIndex > 0) openAt(currentIndex - 1);
  }

  function showNext() {
    if (currentIndex < galleryItems.length - 1) openAt(currentIndex + 1);
  }

  /* ── Focus trap ──────────────────────────────────────── */
  function getFocusableEls() {
    return FOCUSABLE_SELECTORS
      .map(sel => document.querySelector(sel))
      .filter(Boolean);
  }

  function trapFocus(e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key !== 'Tab') return;

    const focusable = getFocusableEls();
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: wrap from first to last
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: wrap from last to first
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /* ── Gallery grid: click and keyboard open ──────────── */
  const grid = document.getElementById('galleryGrid');

  grid?.addEventListener('click', (e) => {
    const item = e.target.closest('.res-photo-item');
    if (!item) return;
    lastFocused = item; // remember for focus return
    buildItemList();
    openAt(galleryItems.indexOf(item));
  });

  grid?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.res-photo-item');
    if (!item) return;
    e.preventDefault();
    lastFocused = item;
    buildItemList();
    openAt(galleryItems.indexOf(item));
  });

  /* ── Modal controls ──────────────────────────────────── */
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click',  showPrev);
  lbNext.addEventListener('click',  showNext);

  // Click on backdrop (not the image/caption area) to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  /* ── Keyboard: Escape + arrows + Tab trap ────────────── */
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        showPrev();
        break;
      case 'ArrowRight':
        showNext();
        break;
      default:
        trapFocus(e);
    }
  });

  /* ── Touch / swipe support (mobile) ─────────────────── */
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    if (!lightbox.classList.contains('open')) return;
    const deltaX = e.changedTouches[0].screenX - touchStartX;

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      if (deltaX < 0) showNext(); // swipe left  → next image
      else            showPrev(); // swipe right → prev image
    }
  }, { passive: true });
}


/* ============================================
   17. RESOURCES PAGE — YouTube video modal
   ============================================ */
window.openVideo = function openVideo(videoId) {
  const modal = document.getElementById('videoModal');
  const slot  = document.getElementById('videoIframeSlot');
  const close = document.getElementById('videoModalClose');
  if (!modal || !slot || !videoId || videoId.startsWith('REPLACE_')) return;

  slot.innerHTML = `
    <iframe
      src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1"
      title="IDF Kenya video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      loading="lazy">
    </iframe>
  `;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  close.focus();
};

function initVideoModal() {
  const modal = document.getElementById('videoModal');
  if (!modal) return;

  const close = document.getElementById('videoModalClose');
  const slot  = document.getElementById('videoIframeSlot');

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    slot.innerHTML = '';
    document.body.style.overflow = '';
  }

  close.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}


/* ============================================
   18. RESOURCES PAGE — keyword search
   ============================================ */
function initResourceSearch() {
  const searchInput = document.getElementById('resourceSearch');
  if (!searchInput) return;

  const normalize = (str) => (str || '').toLowerCase().trim();

  function runSearch() {
    const q = normalize(searchInput.value);

    // Newsletters
    let nlVisible = 0;
    document.querySelectorAll('#newslettersList .res-newsletter-card').forEach(card => {
      const searchable = normalize(
        card.dataset.title + ' ' +
        card.querySelector('.res-nl-title')?.textContent + ' ' +
        card.querySelector('.res-nl-desc')?.textContent + ' ' +
        card.querySelector('.res-nl-category')?.textContent
      );
      const match = !q || searchable.includes(q);
      card.style.display = match ? '' : 'none';
      if (match) nlVisible++;
    });

    const nlCountEl   = document.getElementById('nl-count');
    const nlNoResults = document.getElementById('nlNoResults');
    if (nlCountEl)   nlCountEl.textContent    = `${nlVisible} publication${nlVisible !== 1 ? 's' : ''}`;
    if (nlNoResults) nlNoResults.style.display = nlVisible === 0 ? 'block' : 'none';

    // Gallery
    let galleryVisible = 0;
    document.querySelectorAll('#galleryGrid .res-photo-item').forEach(item => {
      const searchable = normalize(
        item.dataset.caption + ' ' +
        item.dataset.county + ' ' +
        item.dataset.program + ' ' +
        item.dataset.cat + ' ' +
        item.querySelector('img')?.alt
      );
      const match = !q || searchable.includes(q);
      item.classList.toggle('res-filtered-out', !match);
      if (match) galleryVisible++;
    });

    const galCountEl   = document.getElementById('gallery-count');
    const galNoResults = document.getElementById('galleryNoResults');
    if (galCountEl)   galCountEl.textContent    = `${galleryVisible} photo${galleryVisible !== 1 ? 's' : ''}`;
    if (galNoResults) galNoResults.style.display = galleryVisible === 0 ? 'block' : 'none';

    // Videos
    document.querySelectorAll('#videoGrid .res-video-card').forEach(card => {
      const searchable = normalize(
        card.querySelector('.res-video-title')?.textContent + ' ' +
        card.querySelector('.res-video-desc')?.textContent + ' ' +
        card.querySelector('.res-video-tag')?.textContent + ' ' +
        card.dataset.cat
      );
      const match = !q || searchable.includes(q);
      card.classList.toggle('res-filtered-out', !match);
    });
  }

  searchInput.addEventListener('input', runSearch);

  window.clearSearch = function clearSearch() {
    searchInput.value = '';
    runSearch();
  };
}


/* ============================================
   19. CONTACT PAGE — form validation
   ============================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('formSubmitBtn');
  const msgArea   = document.getElementById('contact-message');
  const charCount = document.getElementById('message-count');

  if (msgArea && charCount) {
    msgArea.addEventListener('input', () => {
      const len = msgArea.value.length;
      const max = parseInt(msgArea.getAttribute('maxlength'), 10) || 1200;
      charCount.textContent = `${len} / ${max}`;
      charCount.classList.toggle('warn',  len > max * 0.8);
      charCount.classList.toggle('limit', len >= max);
    });
  }

  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur',  () => validateField(field));
    field.addEventListener('input', () => {
      if (field.closest('.form-group')?.classList.contains('error')) {
        validateField(field);
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    handleSubmit();
  });

  function validateField(field) {
    const group = field.closest('.form-group');
    if (!group) return true;

    let valid = true;

    if (field.required) {
      if (field.type === 'email') {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
      } else if (field.tagName === 'SELECT') {
        valid = field.value !== '';
      } else if (field.tagName === 'TEXTAREA') {
        valid = field.value.trim().length >= 20;
      } else {
        valid = field.value.trim().length >= 2;
      }
    }

    group.classList.toggle('valid', valid && field.value.trim() !== '');
    group.classList.toggle('error', !valid);
    return valid;
  }

  function validateAll() {
    let allValid = true;
    let firstInvalid = null;

    form.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
      const ok = validateField(field);
      if (!ok) {
        allValid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    const consent    = document.getElementById('contact-consent');
    const consentErr = document.getElementById('consent-error');
    if (consent && !consent.checked) {
      allValid = false;
      if (consentErr) consentErr.style.display = 'flex';
      if (!firstInvalid) firstInvalid = consent;
    } else if (consentErr) {
      consentErr.style.display = 'none';
    }

    if (firstInvalid) firstInvalid.focus();
    return allValid;
  }

  function handleSubmit() {
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.classList.remove('loading');
      showSuccess();
    }, 1800);
  }

  function showSuccess(ref) {
    const code  = ref || `IDF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const refEl = document.getElementById('successRefCode');
    if (refEl) refEl.textContent = code;

    const col = document.getElementById('contactFormCol');
    if (col) col.classList.add('form-success');

    const overlay = document.getElementById('formSuccessOverlay');
    if (overlay) overlay.setAttribute('aria-hidden', 'false');
  }

  window.resetContactForm = function () {
    form.reset();
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('valid', 'error'));
    submitBtn.disabled = false;
    if (charCount) charCount.textContent = '0 / 1200';

    const col = document.getElementById('contactFormCol');
    if (col) col.classList.remove('form-success');

    const overlay = document.getElementById('formSuccessOverlay');
    if (overlay) overlay.setAttribute('aria-hidden', 'true');
  };
}


/* ============================================
   20. CONTACT PAGE — scroll reveal
   ============================================ */
function initContactReveal() {
  if (!document.getElementById('contactFormCol')) return;

  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach(el => observer.observe(el));
}


/* ============================================
   21. OUR WORK PAGE — scroll reveal
   ============================================ */
function initWorkScrollReveal() {
  if (!document.getElementById('nuru-ya-mtoto')) return;

  const revealEls = document.querySelectorAll('.reveal, .reveal-up');
  if (!revealEls.length) return;

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  revealEls.forEach(el => revealObserver.observe(el));
}


/* ============================================
   22. MOBILE TAB NAV — keyboard horizontal scroll
   ─────────────────────────────────────────────
   Allows keyboard users to scroll the sticky horizontal
   tab strip with ArrowLeft / ArrowRight keys.

   Why this is needed:
   · overflow-x:auto containers are not keyboard-scrollable
     by default unless they have a focusable tabindex.
   · WCAG 2.1 SC 2.1.1 (Keyboard) requires all functionality
     to be operable without a mouse.

   Implementation notes:
   · tabindex="0" makes the strip focusable in tab order.
   · role="tablist" + aria-label give screen readers context.
   · The guard (!inner) means this is safely page-agnostic —
     pages without a .mobile-tab-nav__inner are unaffected.
   · passive:false is not needed (no preventDefault called).
   ============================================ */
function initMobileTabKeyboardScroll() {
  const inner = document.querySelector('.mobile-tab-nav__inner');
  if (!inner) return;

  // Make the scroll container focusable via keyboard Tab key
  inner.setAttribute('tabindex', '0');
  inner.setAttribute('role', 'tablist');
  inner.setAttribute('aria-label', 'Page sections');

  inner.addEventListener('keydown', (e) => {
    const step = 120; // px scrolled per arrow keypress
    if (e.key === 'ArrowRight') inner.scrollBy({ left:  step, behavior: 'smooth' });
    if (e.key === 'ArrowLeft')  inner.scrollBy({ left: -step, behavior: 'smooth' });
  });
}


/* ============================================
   23. MOBILE TAB NAV — scroll hint animation
   ─────────────────────────────────────────────
   Two behaviours:

   1. Nudge: on page load, briefly scrolls the strip 52px to
      the right then returns to 0. This gives a clear "swipe
      me" signal without being intrusive. Fires after 900ms so
      the page has settled before the animation plays.

   2. Gradient fade: the ::after pseudo-element on
      .mobile-tab-nav (defined in sidenav.css) shows a
      right-edge fade to signal more hidden tabs. Once the
      user scrolls all the way to the last tab, this function
      adds .is-scroll-end to .mobile-tab-nav, which fades the
      gradient out via CSS transition.

   Guards: both nav and inner must exist — this is page-agnostic
   and runs safely on every page that has a .mobile-tab-nav.
   ============================================ */
function initMobileTabScrollHint() {
  const nav   = document.querySelector('.mobile-tab-nav');
  const inner = document.querySelector('.mobile-tab-nav__inner');
  if (!nav || !inner) return;

  // Nudge animation: scroll right a little, then return
  setTimeout(() => {
    inner.scrollTo({ left: 52, behavior: 'smooth' });
    setTimeout(() => inner.scrollTo({ left: 0, behavior: 'smooth' }), 650);
  }, 900);

  // Gradient: hide the ::after fade once the strip is fully scrolled
  inner.addEventListener('scroll', () => {
    const atEnd = inner.scrollLeft + inner.clientWidth >= inner.scrollWidth - 4;
    nav.classList.toggle('is-scroll-end', atEnd);
  }, { passive: true });
}


/* ============================================
   24. MAIN INITIALIZATION
   Waits for componentsReady event from components.js
   ============================================ */
function initAll() {
  console.log('[IDF Kenya] Initializing main.js modules...');

  // Global utilities
  initCounters();
  initScrollReveal();
  initSmoothScroll();
  initMobileTabKeyboardScroll(); // keyboard arrow-key scroll for mobile tab nav
  initMobileTabScrollHint();     // nudge animation + right-edge gradient hint

  // About page
  initAboutScrollSpy();
  initAboutProgressBar();
  initAboutScrollReveal();
  initAboutSmoothScroll();

  // Regions page — all three functions now correctly guarded and functional
  initRegionsScrollSpy();
  initRegionsProgressBar();
  initRegionsSmoothScroll();
  initRegionsScrollReveal(); // NEW: was missing, kept story cards invisible

  // Our Work page
  initWorkScrollSpy();
  initWorkProgressBar();
  initWorkSmoothScroll();
  initWorkScrollReveal();

  // Resources page
  initResourcesScrollSpy();
  initResourcesProgressBar();
  initResourcesSmoothScroll();
  initGalleryFilter();
  initVideoFilter();
  initLightbox();
  initVideoModal();
  initResourceSearch();

  // Contact page
  initContactForm();
  initContactReveal();
}

// Wait for components to be injected before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#site-header')) {
      initAll();
    } else {
      document.addEventListener('componentsReady', initAll);
    }
  });
} else {
  if (document.querySelector('#site-header')) {
    initAll();
  } else {
    document.addEventListener('componentsReady', initAll);
  }
}