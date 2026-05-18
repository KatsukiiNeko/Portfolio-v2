document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initReveal();
  initBackToTop();
  initSkills();
  loadProjects();
  initContact();
  initHeroThree();
  setCurrentYear();
  buildAboutStats();
  createBackToTopBtn();
});

function setCurrentYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = new Date().getFullYear();

  document.querySelectorAll('.footer p').forEach(p => {
    p.innerHTML = p.innerHTML.replace('2023', new Date().getFullYear());
  });
}
