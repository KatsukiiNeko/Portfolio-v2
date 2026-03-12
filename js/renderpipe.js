/* ============================================================
   renderpipe.js
   Handles everything project-related:
     • fallback data
     • JSON fetch
     • card DOM construction
     • filter buttons
     • project detail modal
============================================================ */

/* ── Fallback project data ──────────────────────────────── */
const fallbackProjects = [
  {
    id: 1,
    title: 'Graphic Design #1',
    category: 'design',
    tags: ['Anime', 'Photoshop', 'Illustrator'],
    description: 'Custom anime banner with vibrant artwork and dynamic character illustrations.',
    liveUrl: '#',
  },
  {
    id: 2,
    title: 'Graphic Design #2',
    category: 'design',
    tags: ['Anime', 'Illustrator', 'Banner'],
    description: 'Stylized banner design with editorial composition and bold type.',
    liveUrl: '#',
  },
  {
    id: 3,
    title: 'Python Bot',
    category: 'python',
    tags: ['Python', 'Discord', 'API'],
    description: 'Feature-rich Discord bot with slash commands, auto-mod, and music playback.',
    githubUrl: '#',
  },
  {
    id: 4,
    title: 'Portfolio Website',
    category: 'web',
    tags: ['HTML', 'CSS', 'JavaScript'],
    description: 'Responsive personal portfolio with Three.js hero, dark mode, and project filtering.',
    liveUrl: '#',
    githubUrl: '#',
  },
];

/* ── Data loading ────────────────────────────────────────── */
async function loadProjects() {
  let projects = fallbackProjects;

  try {
    const r = await fetch('projects.json');
    if (r.ok) projects = await r.json();
  } catch (_) {
    /* network error or file missing — silently use fallback */
  }

  window.allProjects = projects;
  renderProjects(projects);
  initFilters();
}

/* ── Card rendering ──────────────────────────────────────── */
function renderProjects(projects) {
  const grid = document.querySelector('.projects-container');
  if (!grid) return;
  grid.innerHTML = '';

  projects.forEach((project, i) => {
    const card = buildProjectCard(project);
    card.style.animationDelay = `${i * 0.07}s`;
    grid.appendChild(card);

    // Trigger animate-in on next frame so the delay actually fires
    requestAnimationFrame(() => card.classList.add('animate-in'));
  });
}

function buildProjectCard(project) {
  const card = document.createElement('div');
  card.className   = 'project-card';
  card.dataset.category = project.category || '';
  card.dataset.tags     = (project.tags || []).join(',').toLowerCase();

  /* --- image / placeholder --- */
  const imgWrap = document.createElement('div');
  imgWrap.className = 'image-container';
  imgWrap.addEventListener('click', () => openProjectModal(project));

  if (project.image) {
    const img    = document.createElement('img');
    img.src      = project.image;
    img.alt      = project.title;
    img.className = 'project-image lazyload';
    img.loading  = 'lazy';
    imgWrap.appendChild(img);
  } else {
    imgWrap.style.background =
      'linear-gradient(135deg, rgba(129,77,229,0.25), rgba(90,50,176,0.4))';
    imgWrap.innerHTML = `
      <div style="
        width:100%;height:100%;display:flex;
        align-items:center;justify-content:center;
        font-size:32px;opacity:0.4">🖼</div>`;
  }

  /* --- text content --- */
  const content = document.createElement('div');
  content.className = 'project-content';

  const title = document.createElement('h3');
  title.className   = 'project-title';
  title.textContent = project.title;

  const desc = document.createElement('p');
  desc.textContent  = project.description || '';

  const tagsDiv = document.createElement('div');
  tagsDiv.className = 'project-tags';
  (project.tags || []).forEach(t => {
    const span       = document.createElement('span');
    span.className   = 'project-tag';
    span.textContent = t;
    tagsDiv.appendChild(span);
  });

  /* --- links --- */
  const links = document.createElement('div');
  links.className = 'project-links';

  if (project.liveUrl) {
    const a = _makeLink(project.liveUrl, '<i class="fas fa-external-link-alt"></i> Live');
    links.appendChild(a);
  }
  if (project.githubUrl) {
    const a = _makeLink(project.githubUrl, '<i class="fab fa-github"></i> Code');
    links.appendChild(a);
  }

  content.append(title, desc, tagsDiv, links);
  card.append(imgWrap, content);
  return card;
}

/** Small helper — avoids repeating anchor boilerplate. */
function _makeLink(href, html) {
  const a = document.createElement('a');
  a.href      = href;
  a.className = 'project-link';
  a.target    = '_blank';
  a.rel       = 'noopener noreferrer';
  a.innerHTML = html;
  return a;
}

/* ── Filter buttons ──────────────────────────────────────── */
function initFilters() {
  const buttons = document.querySelectorAll('.filter-button');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const f = btn.dataset.filter.toLowerCase();

      if (f === 'all') {
        renderProjects(window.allProjects);
      } else {
        const filtered = window.allProjects.filter(p => {
          const tags = (p.tags || []).map(t => t.toLowerCase());
          return tags.includes(f) || (p.category || '').toLowerCase() === f;
        });
        renderProjects(filtered);
      }
    });
  });
}

/* ── Project modal ───────────────────────────────────────── */
function openProjectModal(project) {
  const modal   = document.getElementById('project-modal');
  const content = modal?.querySelector('.modal-content');
  if (!modal || !content) return;

  content.innerHTML = '';

  if (project.image) {
    const img = document.createElement('img');
    img.src = project.image;
    img.alt = project.title;
    content.appendChild(img);
  }

  const h2       = document.createElement('h2');
  h2.textContent = project.title;

  const p       = document.createElement('p');
  p.textContent = project.description || '';

  const tags = document.createElement('div');
  tags.className            = 'project-tags';
  tags.style.justifyContent = 'center';
  tags.style.marginTop      = '12px';

  (project.tags || []).forEach(t => {
    const span       = document.createElement('span');
    span.className   = 'project-tag';
    span.textContent = t;
    tags.appendChild(span);
  });

  content.append(h2, p, tags);
  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

// Close modal — click backdrop or ✕ button
document.addEventListener('click', e => {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  if (e.target.closest('.modal-close') || e.target === modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
});

// Close modal — Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active, #imageModal.active').forEach(m => {
      m.classList.remove('active');
      document.body.classList.remove('modal-open');
    });
  }
});