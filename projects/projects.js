import { fetchJSON, renderProjects } from '../global.js';

async function init() {
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("background", "#333")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const projectsContainer = document.querySelector('.projects');
  const projects = await fetchJSON('../lib/projects.json');
  renderProjects(projects, projectsContainer, 'h2');

  const allYears = Array.from(new Set(projects.map(p => p.year))).sort();

  const svg = d3.select("#chart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const radius = Math.min(width, height) / 3;
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  let selectedYear = null;
  let currentQuery = "";

  const yearCounts = {};
  projects.forEach(p => {
    yearCounts[p.year] = (yearCounts[p.year] || 0) + 1;
  });
  const projectData = allYears.map(year => ({
    label: year,
    value: yearCounts[year] || 0
  }));

  const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);
  const paths = g.selectAll("path")
    .data(pie(projectData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.label))
    .attr("data-year", d => d.data.label)
    .style("stroke", "white")
    .style("stroke-width", "2px")
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`${d.data.label}: ${d.data.value} project${d.data.value === 1 ? '' : 's'}`);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    })
    .on("click", (event, d) => {
      selectedYear = selectedYear === d.data.label ? null : d.data.label;
      updateSelection();
    });

  const legendContainer = d3.select(".legend");
  projectData.forEach((d, i) => {
    legendContainer
      .append("li")
      .style("--color", color(d.label))
      .attr("data-year", d.label)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on("click", () => {
        selectedYear = selectedYear === d.label ? null : d.label;
        updateSelection();
      });
  });

  function updateSelection() {
    const filtered = projects.filter(p => {
      const matchYear = selectedYear === null || p.year === selectedYear;
      const matchQuery =
        currentQuery === "" ||
        p.title.toLowerCase().includes(currentQuery) ||
        (p.description && p.description.toLowerCase().includes(currentQuery));
      return matchYear && matchQuery;
    });

    svg.selectAll("path")
      .classed("selected", d => selectedYear === d.data.label);

    d3.selectAll(".legend li")
      .classed("selected", function () {
        return selectedYear === this.getAttribute("data-year");
      });

    renderProjects(filtered, projectsContainer, 'h2');
    document.getElementById("total-count").textContent = `Total projects: ${filtered.length}`;
  }

  document.getElementById("searchBox").addEventListener("input", (e) => {
    currentQuery = e.target.value.toLowerCase();
    updateSelection();
  });

  updateSelection();
}
init();
