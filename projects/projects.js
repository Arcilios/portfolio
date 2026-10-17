import { fetchJSON, renderProjects } from '../global.js';

async function init() {
  const projects = await fetchJSON('../lib/projects.json');
  const container = document.querySelector('.projects');
  const search = document.querySelector('#searchBox');
  const count = document.querySelector('#total-count');

  function update() {
    const query = search.value.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      const searchable = [project.title, project.description, project.category, ...(project.tags || [])]
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
    renderProjects(filtered, container);
    count.textContent = `${filtered.length} project${filtered.length === 1 ? '' : 's'}`;
  }

  search.addEventListener('input', update);
  update();
}

init();
