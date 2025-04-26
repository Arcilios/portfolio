import { fetchJSON, renderProjects } from './global.js';

async function init() {
  const container = document.querySelector('.projects');
  const allProjects = await fetchJSON('./lib/projects.json');
  const latestProjects = allProjects.slice(-3).reverse(); // 最新的 3 个项目
  renderProjects(latestProjects, container, 'h3'); // 用 h3 级标题
}

init();
await loadRandomCat('https://api.thecatapi.com/v1/images/search', '.cat-container');
await loadGitHubRepos('Arcilios');

async function loadRandomCat(apiURL, selector) {
    try {
      const res = await fetch(apiURL);
      const data = await res.json();
      const container = document.querySelector(selector);
  
      if (data.length === 0) {
        container.innerHTML = '<p>No cat found 🐱</p>';
        return;
      }
  
      const catImg = document.createElement('img');
      catImg.src = data[0].url;
      catImg.alt = 'A random cat from the API';
      catImg.style.maxWidth = '400px';
      catImg.style.borderRadius = '12px';
  
      container.appendChild(catImg);
    } catch (error) {
      console.error('Error fetching cat:', error);
    }
  }
  async function loadGitHubRepos(username = 'Arcilios', selector = '.github-container') {
    const url = `https://api.github.com/users/${username}/repos?sort=updated`;
  
    const container = document.querySelector(selector);
  
    try {
      const res = await fetch(url);
      const repos = await res.json();
  
      container.innerHTML = '<h3>Recent GitHub Repos</h3>';
  
      for (const repo of repos.slice(0, 3)) {
        const div = document.createElement('div');
        div.innerHTML = `
          <a href="${repo.html_url}" target="_blank"><strong>${repo.name}</strong></a><br>
          <p>${repo.description || 'No description.'}</p>
          <small>Last updated: ${new Date(repo.updated_at).toLocaleString()}</small>
          <hr>
        `;
        container.appendChild(div);
      }
    } catch (err) {
      container.innerHTML = '<p>Unable to load GitHub data.</p>';
      console.error(err);
    }
  }
  