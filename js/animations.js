function initReveal() {
  const targets = document.querySelectorAll(
    '.section-title, .section-body, .stat-card, .skill-bar, .about-text, .about-stats'
  );

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    if (i % 4 !== 0) el.classList.add(`reveal-delay-${i % 4}`);
  });

  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

function createBackToTopBtn() {
  if (document.getElementById('backToTop')) return;
  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  document.body.appendChild(btn);
}

function initBackToTop() {
  window.addEventListener(
    'scroll',
    () => {
      const btn = document.getElementById('backToTop');
      if (btn) btn.classList.toggle('visible', window.scrollY > 360);
    },
    { passive: true }
  );

  document.addEventListener('click', e => {
    if (e.target.closest('#backToTop')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}
