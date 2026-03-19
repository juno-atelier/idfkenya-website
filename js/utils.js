/* ==============================================
   IDF Kenya — utils.js
   Shared utility functions
   ============================================== */

// Newsletter signup handler (footer form)
function handleNewsletterSignup(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[type="email"]');
  const btn   = e.target.querySelector('button');
  if (!input || !input.value) return;
  btn.textContent = 'Thank you!';
  btn.style.background = '#3A7D44';
  input.value = '';
  setTimeout(() => {
    btn.textContent = 'Subscribe';
    btn.style.background = '';
  }, 3000);
}

// Contact form handler
function handleContactForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const orig = btn.textContent;
  btn.textContent = 'Message Sent!';
  btn.style.background = '#3A7D44';
  e.target.reset();
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
  }, 3500);
}

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
});
