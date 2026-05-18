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

      const navbar = document.querySelector('.navbar');
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    },
    { passive: true }
  );
}
