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
   1. ABOUT PAGE — scroll spy
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
   2. ABOUT PAGE — reading progress bar
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
   4. ABOUT PAGE — smooth scroll
   ============================================ */
function initAboutSmoothScroll() {
  if (!document.querySelector('.about-sidenav') &&
      !document.querySelector('.mobile-about-nav')) return;

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
      // Keep the active mobile tab scrolled into view
      entry.tabLink.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
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
      entry.tabLink.scrollIntoView({
        behavior: 'smooth', block: 'nearest', inline: 'center'
      });
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
   11. RESOURCES PAGE — scroll spy
   ============================================ */
function initResourcesScrollSpy() {
  const SECTION_IDS = ['newsletters', 'gallery', 'videos'];
  const OFFSET = 130;

  if (!document.getElementById(SECTION_IDS[0])) return;

  const getSideLinks   = () => document.querySelectorAll('.sidenav-list a[data-spy-target]');
  const getMobileLinks = () => document.querySelectorAll('.mobile-res-link[data-spy-target]');

  function setActiveSection(activeId) {
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

  const onResScroll = () => setActiveSection(getActiveSection());
  window.addEventListener('scroll', onResScroll, { passive: true });
  onResScroll();
}


/* ============================================
   12. RESOURCES PAGE — reading progress bar
   ============================================ */
function initResourcesProgressBar() {
  const progressFill = document.getElementById('resourcesProgressFill');
  const progressBar  = document.querySelector('.sidenav-progress-bar');
  const main         = document.getElementById('resourcesMainContent');
  if (!progressFill || !main) return;

  function updateResourcesProgress() {
    const scrolled = Math.max(0, -main.getBoundingClientRect().top);
    const pct = Math.min(100, Math.round((scrolled / main.offsetHeight) * 100));
    progressFill.style.width = `${pct}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', pct);
  }

  window.addEventListener('scroll', updateResourcesProgress, { passive: true });
  updateResourcesProgress();
}


/* ============================================
   13. RESOURCES PAGE — smooth scroll
   ============================================ */
function initResourcesSmoothScroll() {
  if (!document.querySelector('.res-sidenav') &&
      !document.querySelector('.mobile-res-nav')) return;

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
   16. RESOURCES PAGE — photo lightbox
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

  let currentIndex = 0;
  let galleryItems = [];

  function buildItemList() {
    galleryItems = Array.from(
      document.querySelectorAll('#galleryGrid .res-photo-item:not(.res-filtered-out)')
    );
  }

  function openAt(index) {
    buildItemList();
    if (!galleryItems.length) return;

    currentIndex = Math.max(0, Math.min(index, galleryItems.length - 1));
    const item   = galleryItems[currentIndex];

    lbImg.src = item.dataset.src || item.querySelector('img').src;
    lbImg.alt = item.querySelector('img').alt || '';

    lbCaption.innerHTML = `
      <strong>${item.dataset.caption || ''}</strong>
      ${item.dataset.county  ? `<span>${item.dataset.county}</span>` : ''}
      ${item.dataset.program ? `<span> · ${item.dataset.program}</span>` : ''}
    `;

    lbCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;

    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    lbClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  function showPrev() { openAt(currentIndex - 1); }
  function showNext() { openAt(currentIndex + 1); }

  document.getElementById('galleryGrid')?.addEventListener('click', (e) => {
    const item = e.target.closest('.res-photo-item');
    if (!item) return;
    buildItemList();
    openAt(galleryItems.indexOf(item));
  });

  document.getElementById('galleryGrid')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.res-photo-item');
    if (!item) return;
    e.preventDefault();
    buildItemList();
    openAt(galleryItems.indexOf(item));
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click',  showPrev);
  lbNext.addEventListener('click',  showNext);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
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
   22. MAIN INITIALIZATION
   Waits for componentsReady event from components.js
   ============================================ */
function initAll() {
  console.log('[IDF Kenya] Initializing main.js modules...');

  // Global utilities
  initCounters();
  initScrollReveal();
  initSmoothScroll();

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