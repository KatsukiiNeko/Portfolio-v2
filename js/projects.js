
const fallbackProjects = [
  {
    id: 1,
    title: " Kaoruko Waguri ",
    category: "design",
    image: "assets/images/Kaoru.png",
    tags: ["Anime", "Photoshop", "Illustrator"],
    description: "Custom anime banner with vibrant artwork and dynamic character illustrations.",
  },
  {
    id: 2,
    title: "Shiina Mahiru",
    category: "design",
    image: "assets/images/shiina.webp",
    tags: ["Anime", "Illustrator", "Banner"],
    description: "Stylized banner design with editorial composition and bold type.",
  },
  {
    id: 3,
    title: "Portfolio Website",
    category: "web",
    image: "assets/images/web.png",
    tags: ["HTML", "CSS", "JavaScript"],
    description: "Responsive personal portfolio with Three.js hero, dark mode, and project filtering.",
    liveUrl: "https://portfolio-umber-omega-rpj2m7tiqj.vercel.app/",
    githubUrl: "https://github.com/KatsukiiNeko/",
  },
  {
    id: 4,
    title: "Money Vault",
    category: "web",
    image: "assets/images/opensource-PFM.webp",
    tags: ["CSS", "React", "DB"],
    description: "Money Vault is a privacy-focused personal finance tracker built as an offline-first PWA. It stores all data locally on the device and uses encryption to protect sensitive information. Its purpose is to give users a simple, secure way to manage income and expenses without relying on external servers or cloud services.",
    githubUrl: "https://github.com/KatsukiiNeko/Personal-financial-managment",
    liveUrl: "https://money-vaults.vercel.app/"
  },
];
;
;

async function loadProjects() {
  let projects = fallbackProjects;

  try {
    const r = await fetch('data/projects.json');
    if (r.ok) projects = await r.json();
  } catch (_) {
  }

  window.allProjects = projects;
  renderProjects(projects);
  initFilters();
}

function renderProjects(projects) {
  const grid = document.querySelector('.projects-container');
  if (!grid) return;
  grid.innerHTML = '';

  projects.forEach((project, i) => {
    const card = buildProjectCard(project);
    card.style.animationDelay = `${i * 0.07}s`;
    grid.appendChild(card);

    requestAnimationFrame(() => card.classList.add('animate-in'));
  });
}

function buildProjectCard(project) {
  const card = document.createElement('div');
  card.className   = 'project-card';
  card.dataset.category = project.category || '';
  card.dataset.tags     = (project.tags || []).join(',').toLowerCase();

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

function _makeLink(href, html) {
  const a = document.createElement('a');
  a.href      = href;
  a.className = 'project-link';
  a.target    = '_blank';
  a.rel       = 'noopener noreferrer';
  a.innerHTML = html;
  return a;
}

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

document.addEventListener('click', e => {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  if (e.target.closest('.modal-close') || e.target === modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active, #imageModal.active').forEach(m => {
      m.classList.remove('active');
      document.body.classList.remove('modal-open');
    });
  }
});
