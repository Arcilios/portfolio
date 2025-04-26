import { fetchJSON, renderProjects } from '../global.js';

async function init() {
  const projectsContainer = document.querySelector('.projects');
  const projects = await fetchJSON('../lib/projects.json');
  renderProjects(projects, projectsContainer, 'h2');
}

init();
