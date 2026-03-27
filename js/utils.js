/* ==============================================
   IDF Kenya — utils.js (ES6 Module)
   Shared utility functions
   Exports functions for use in main.js
   ============================================== */

'use strict';

// Newsletter signup handler (footer form)
export function initNewsletterSignup() {
  const form = document.querySelector('.footer-newsletter form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const btn   = form.querySelector('button');
    if (!input || !input.value) return;
    btn.textContent = 'Thank you!';
    btn.style.background = '#3A7D44';
    input.value = '';
    setTimeout(() => {
      btn.textContent = 'Subscribe';
      btn.style.background = '';
    }, 3000);
  });
}

// Contact form handler (if separate from the main contact form)
export function initContactFormHandler() {
  const form = document.getElementById('simpleContactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Message Sent!';
    btn.style.background = '#3A7D44';
    form.reset();
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 3500);
  });
}

// Smooth scroll for anchor links (global)
export function initSmoothScroll() {
  // Only initialize if there are anchor links on the page
  const anchors = document.querySelectorAll('a[href^="#"]');
  if (!anchors.length) return;

  anchors.forEach(a => {
    a.addEventListener('click', (e) => {
      const targetId = a.getAttribute('href');
      // Skip empty or just '#' links
      if (!targetId || targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}