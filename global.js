const basePath = location.hostname.endsWith('github.io') ? '/portfolio/' : '/';

const navItems = [
  { href: basePath, text: 'Home', match: /^\/?(portfolio\/?)?$/ },
  { href: `${basePath}projects/`, text: 'Projects', match: /\/projects\// },
  { href: `${basePath}resume.html`, text: 'Resume', match: /\/resume\.html$/ },
  { href: `${basePath}contact/`, text: 'Contact', match: /\/contact\// },
  { href: 'https://github.com/Arcilios', text: 'GitHub', external: true },
];

function buildHeader() {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <a class="wordmark" href="${basePath}" aria-label="Ruochen Li, home">
      <span>RL</span><strong>Ruochen Li</strong>
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav id="site-nav" aria-label="Main navigation"></nav>
    <button class="theme-toggle" type="button" aria-label="Switch color theme"><span aria-hidden="true">◐</span></button>
  `;

  const nav = header.querySelector('nav');
  for (const item of navItems) {
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.text;
    if (item.external) {
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.setAttribute('aria-label', `${item.text} (opens in a new tab)`);
    } else if (item.match.test(location.pathname)) {
      link.classList.add('current');
      link.setAttribute('aria-current', 'page');
    }
    nav.appendChild(link);
  }

  const menuButton = header.querySelector('.menu-toggle');
  menuButton.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });

  header.querySelector('.theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  });

  document.body.prepend(header);
}

const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = savedTheme || (prefersDark ? 'dark' : 'light');
buildHeader();

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Unable to load project data:', error);
    return [];
  }
}

export function renderProjects(projects, container) {
  if (!container) return;
  container.replaceChildren();

  if (!projects.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No matching projects found.';
    container.appendChild(empty);
    return;
  }

  projects.forEach((project, index) => {
    const article = document.createElement('article');
    article.className = 'project-card';

    const number = document.createElement('span');
    number.className = 'project-number';
    number.textContent = String(index + 1).padStart(2, '0');

    const meta = document.createElement('p');
    meta.className = 'project-meta';
    meta.textContent = [project.year, project.category].filter(Boolean).join(' · ');

    const title = document.createElement('h3');
    title.textContent = project.title;

    const description = document.createElement('p');
    description.className = 'project-description';
    description.textContent = project.description;

    const tags = document.createElement('ul');
    tags.className = 'tag-list';
    tags.setAttribute('aria-label', 'Technologies');
    (project.tags || []).forEach((tag) => {
      const item = document.createElement('li');
      item.textContent = tag;
      tags.appendChild(item);
    });

    article.append(number, meta, title, description, tags);

    if (project.link) {
      const link = document.createElement('a');
      link.className = 'project-link';
      link.href = !location.hostname.endsWith('github.io') && project.link.startsWith('/portfolio/')
        ? project.link.replace('/portfolio/', '/')
        : project.link;
      link.setAttribute('aria-label', `View ${project.title}`);
      if (project.link.startsWith('http')) {
        link.target = '_blank';
        link.rel = 'noreferrer';
      }
      link.innerHTML = '<span>View project</span><span aria-hidden="true">↗</span>';
      article.appendChild(link);
    }

    container.appendChild(article);
  });
}
