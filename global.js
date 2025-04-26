console.log('IT’S ALIVE!');

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  document.body.classList.add('dark');
}

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let navLinks = $$("nav a");

let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);

currentLink?.classList.add("current");

const navItems = [
    { href: "/portfolio/index.html", text: "Home" },
    { href: "/portfolio/contact/index.html", text: "Contact" },
    { href: "/portfolio/projects/index.html", text: "Project" },
    { href: "/portfolio/resume.html", text: "Resume" },
    { href: "https://github.com/Arcilios/portfolio", text: "GitHub Repo", external: true },
  ];
  
  const nav = document.createElement("nav");
  
  for (const item of navItems) {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.text;
    if (item.external) {
      link.setAttribute("target", "_blank");
    }
  
    nav.appendChild(link);
  }

  document.body.insertBefore(nav, document.body.firstChild);
  
  navLinks = $$("nav a");
  currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname
  );
  currentLink?.classList.add("current");

const toggle = document.createElement("button");
toggle.textContent = "🌙 / ☀️";
toggle.style.position = "fixed";
toggle.style.top = "1rem";
toggle.style.right = "1rem";
toggle.style.zIndex = "999";


toggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const mode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", mode);
});

document.body.appendChild(toggle);

export async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to load JSON:', err);
    return [];
  }
}

export function renderProjects(projects, container, headingTag = 'h2') {
  container.innerHTML = '';

  if (projects.length === 0) {
    container.innerHTML = '<p>No projects to display.</p>';
    return;
  }

  for (const project of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingTag}>${project.title}</${headingTag}>
      <img src="${project.image}" alt="${project.title}" />
      <p>${project.description}</p>
    `;
    container.appendChild(article);
  }

  const countEl = document.getElementById('count');
  if (countEl) {
    countEl.textContent = `Total projects: ${projects.length}`;
  }
}



  