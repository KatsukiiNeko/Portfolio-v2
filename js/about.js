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
    { number: '3+',  label: 'Years Experience'  },
    { number: '2+',  label: 'Projects'           },
    { number: '10+', label: 'Skills'              },
    { number: '∞',   label: 'Lines of Code'      },
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
