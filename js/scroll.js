/* ==============================================
   IDF Kenya — scroll.js
   Animated stat counters + scroll reveal
   ============================================== */

// --- STAT COUNTERS ---
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString();
  }, 16);
}

function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(c => observer.observe(c));
}

// --- SCROLL REVEAL ---
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.project-card, .stat-card, .partner-item, .mvv-card, .page-content h2, .page-content h3'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

// Add reveal CSS dynamically
const revealStyle = document.createElement('style');
revealStyle.textContent = `
  .reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.55s ease, transform 0.55s ease; }
  .reveal.revealed { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(revealStyle);

document.addEventListener('DOMContentLoaded', () => {
  initCounters();
  initScrollReveal();
});
