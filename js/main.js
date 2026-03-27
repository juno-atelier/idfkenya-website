/* ==============================================
   IDF Kenya — main.js (ES6 Module)
   Refactored to use ES6 modules with import/export
   
   CHANGES:
   1. Added 'use strict' at top
   2. Imported functions from scroll.js and utils.js
   3. Removed duplicate function definitions
   4. Maintained all page-specific initialization logic
   5. Properly waits for componentsReady event
   ============================================== */

'use strict';

// Import shared utilities from other modules
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
   5. REGIONS PAGE — scroll spy
   ============================================ */
function initRegionsScrollSpy() {
  const COUNTY_IDS = [
    'homa-bay', 'vihiga', 'nyamira', 'meru',
    'tharaka-nithi', 'kwale', 'kirinyaga'
  ];
  const OFFSET = 130;

  if (!document.getElementById(COUNTY_IDS[0])) return;

  const getSideLinks   = () => document.querySelectorAll('.sidenav-list a[data-spy-target]');
  const getMobileLinks = () => document.querySelectorAll('.mobile-regions-link[data-spy-target]');

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
   6. REGIONS PAGE — reading progress bar
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
   7. REGIONS PAGE — smooth scroll
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
   8. OUR WORK PAGE — scroll spy
   ============================================ */
function initWorkScrollSpy() {
  const PROJECT_IDS = [
    'nuru-ya-mtoto', 'kuimarisha-kaunti',
    'global-fund-malaria', 'seka-kagwa'
  ];
  const OFFSET = 130;

  if (!document.getElementById(PROJECT_IDS[0])) return;

  const getSideLinks   = () => document.querySelectorAll('.sidenav-list a[data-spy-target]');
  const getMobileLinks = () => document.querySelectorAll('.mobile-work-link[data-spy-target]');

  function setActiveProject(activeId) {
    getSideLinks().forEach(link => {
      link.classList.toggle('active', link.dataset.spyTarget === activeId);
    });
    getMobileLinks().forEach(link => {
      link.classList.toggle('active', link.dataset.spyTarget === activeId);
    });
  }

  function getActiveProject() {
    for (let i = PROJECT_IDS.length - 1; i >= 0; i--) {
      const el = document.getElementById(PROJECT_IDS[i]);
      if (el && el.getBoundingClientRect().top <= OFFSET) return PROJECT_IDS[i];
    }
    return PROJECT_IDS[0];
  }

  const onWorkScroll = () => setActiveProject(getActiveProject());
  window.addEventListener('scroll', onWorkScroll, { passive: true });
  onWorkScroll();
}


/* ============================================
   9. OUR WORK PAGE — reading progress bar
   ============================================ */
function initWorkProgressBar() {
  const progressFill = document.getElementById('workProgressFill');
  const progressBar  = document.querySelector('.sidenav-progress-bar');
  const main         = document.getElementById('workMainContent');
  if (!progressFill || !main) return;

  function updateWorkProgress() {
    const scrolled = Math.max(0, -main.getBoundingClientRect().top);
    const pct = Math.min(100, Math.round((scrolled / main.offsetHeight) * 100));
    progressFill.style.width = `${pct}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', pct);
  }

  window.addEventListener('scroll', updateWorkProgress, { passive: true });
  updateWorkProgress();
}


/* ============================================
   10. OUR WORK PAGE — smooth scroll
   ============================================ */
function initWorkSmoothScroll() {
  if (!document.querySelector('.work-sidenav') &&
      !document.querySelector('.mobile-work-nav')) return;

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

    // Update button states
    filterBar.querySelectorAll('.res-filter-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });

    // Show / hide items
    const items = grid.querySelectorAll('.res-photo-item');
    let visible = 0;

    items.forEach(item => {
      const match = filter === 'all' || item.dataset.cat === filter;
      item.classList.toggle('res-filtered-out', !match);
      if (match) visible++;
    });

    // Update count
    const countEl = document.getElementById('gallery-count');
    if (countEl) countEl.textContent = `${visible} photo${visible !== 1 ? 's' : ''}`;

    // Show no-results
    const noResults = document.getElementById('galleryNoResults');
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
      ${item.dataset.county ? `<span>${item.dataset.county}</span>` : ''}
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

  // Open on photo click
  document.getElementById('galleryGrid')?.addEventListener('click', (e) => {
    const item = e.target.closest('.res-photo-item');
    if (!item) return;
    buildItemList();
    openAt(galleryItems.indexOf(item));
  });

  // Open on keyboard activation
  document.getElementById('galleryGrid')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.res-photo-item');
    if (!item) return;
    e.preventDefault();
    buildItemList();
    openAt(galleryItems.indexOf(item));
  });

  // Controls
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click',  showPrev);
  lbNext.addEventListener('click',  showNext);

  // Close on backdrop click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
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
    if (nlCountEl)   nlCountEl.textContent   = `${nlVisible} publication${nlVisible !== 1 ? 's' : ''}`;
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
    if (galCountEl)   galCountEl.textContent   = `${galleryVisible} photo${galleryVisible !== 1 ? 's' : ''}`;
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

  // Character counter
  if (msgArea && charCount) {
    msgArea.addEventListener('input', () => {
      const len = msgArea.value.length;
      const max = parseInt(msgArea.getAttribute('maxlength'), 10) || 1200;
      charCount.textContent = `${len} / ${max}`;
      charCount.classList.toggle('warn', len > max * 0.8);
      charCount.classList.toggle('limit', len >= max);
    });
  }

  // Real-time validation
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.closest('.form-group')?.classList.contains('error')) {
        validateField(field);
      }
    });
  });

  // Submit handler
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

    // Simulate API call — replace with fetch() when backend is ready
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
   21. MAIN INITIALIZATION
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

  // Regions page
  initRegionsScrollSpy();
  initRegionsProgressBar();
  initRegionsSmoothScroll();

  // Our Work page
  initWorkScrollSpy();
  initWorkProgressBar();
  initWorkSmoothScroll();

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
    // Check if components are already loaded
    if (document.querySelector('#site-header')) {
      initAll();
    } else {
      document.addEventListener('componentsReady', initAll);
    }
  });
} else {
  // DOM already loaded
  if (document.querySelector('#site-header')) {
    initAll();
  } else {
    document.addEventListener('componentsReady', initAll);
  }
}