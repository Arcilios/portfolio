import { fetchJSON, renderProjects } from './global.js';

async function init() {
  const container = document.querySelector('.featured-projects');
  const projects = await fetchJSON('./lib/projects.json');
  renderProjects(projects.slice(0, 3), container);

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
}

init();
