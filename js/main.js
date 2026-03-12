document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initReveal();
  initBackToTop();
  initSkills();
  loadProjects();        // renderpipe.js
  initContact();
  initHeroThree();       // three-scene.js
  setCurrentYear();
  buildAboutStats();
  createBackToTopBtn();
});

function initTheme() {
  const saved = localStorage.getItem('kn-theme') || 'dark';
  applyTheme(saved);

  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const next =
      document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'light'
        : 'dark';
    applyTheme(next);
    localStorage.setItem('kn-theme', next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.querySelector('.theme-toggle i');
  if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function initNav() {
  const hamburger = document.querySelector('.hamburger');
  const menu      = document.querySelector('.navbar-menu');
  const navLinks  = document.querySelectorAll('.nav-link');

  if (hamburger && menu) {
    hamburger.addEventListener('click', () => {
      const open = menu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', open);
      const icon = hamburger.querySelector('i');
      if (icon) icon.className = open ? 'fas fa-times' : 'fas fa-bars';
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menu?.classList.remove('active');
      hamburger?.setAttribute('aria-expanded', false);
      const icon = hamburger?.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    });
  });

  const sections = document.querySelectorAll('section[id]');
  window.addEventListener(
    'scroll',
    () => {
      const scrollY = window.scrollY + 90;
      sections.forEach(sec => {
        const top    = sec.offsetTop;
        const height = sec.offsetHeight;
        const link   = document.querySelector(`.nav-link[href="#${sec.id}"]`);
        if (link) {
          link.classList.toggle(
            'active',
            scrollY >= top && scrollY < top + height
          );
        }
      });

      // Navbar glass on scroll
      const navbar = document.querySelector('.navbar');
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    },
    { passive: true }
  );
}

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


function buildAboutStats() {
  const aboutSection = document.getElementById('about');
  if (!aboutSection) return;

  const container = aboutSection.querySelector('.container');
  if (!container) return;

  if (container.querySelector('.about-stats')) return;

  const existing  = Array.from(container.children);
  const aboutText = document.createElement('div');
  aboutText.className = 'about-text';

  const label = document.createElement('span');
  label.className = 'section-label';
  label.textContent = 'Who I am';
  aboutText.appendChild(label);

  existing.forEach(el => aboutText.appendChild(el));
  container.appendChild(aboutText);

  const stats = [
    { number: '3+',  label: 'Years Experience' },
    { number: '20+', label: 'Projects Shipped'  },
    { number: '10+', label: 'Happy Clients'     },
    { number: '∞',   label: 'Lines of Code'     },
  ];

  const statsDiv = document.createElement('div');
  statsDiv.className = 'about-stats';

  stats.forEach(s => {
    const card = document.createElement('div');
    card.className = 'stat-card reveal';
    card.innerHTML = `
      <div class="stat-number">${s.number}</div>
      <div class="stat-label">${s.label}</div>`;
    statsDiv.appendChild(card);
  });

  container.appendChild(statsDiv);

  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  statsDiv.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

function initSkills() {
  document.querySelectorAll('.skill-bar').forEach(bar => {
    if (!bar.querySelector('span')) {
      bar.innerHTML = `<span>${bar.textContent}</span>`;
    }
  });
}

function initContact() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd   = new FormData(form);
    const data = Object.fromEntries(fd);

    // EmailJS — replace with your real IDs
    if (typeof emailjs !== 'undefined') {
      emailjs
        .sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form, 'YOUR_PUBLIC_KEY')
        .then(() => showFormSuccess(form, data.name))
        .catch(err => {
          console.error('EmailJS error:', err);
          alert('Failed to send. Please try again later.');
        });
    } else {
      showFormSuccess(form, data.name);
    }
  });
}

function showFormSuccess(form, name) {
  form.innerHTML = `
    <div class="form-success">
      <i class="fas fa-check-circle"></i>
      <h3>Message Sent!</h3>
      <p>Thank you${name ? ', ' + name : ''}. I'll get back to you soon!</p>
    </div>`;
}


function setCurrentYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = new Date().getFullYear();

  document.querySelectorAll('.footer p').forEach(p => {
    p.innerHTML = p.innerHTML.replace('2023', new Date().getFullYear());
  });
}