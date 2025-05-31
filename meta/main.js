import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let svg, commits, xScale, yScale;
let commitProgress = 100;
let commitMaxTime, filteredCommits;
let timeScale;

const colors = d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {
  const data = await d3.csv('loc.csv', d => ({
    ...d,
    line: +d.line,
    depth: +d.depth,
    length: +d.length,
    date: new Date(d.date + 'T00:00' + d.timezone),
    datetime: new Date(d.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([commit, lines]) => {
    let first = lines[0];
    return {
      id: commit,
      url: 'https://github.com/Arcilios/portfolio/commit/' + commit,
      author: first.author,
      datetime: first.datetime,
      hourFrac: first.datetime.getHours() + first.datetime.getMinutes() / 60,
      totalLines: lines.length,
      lines,
    };
  });
}

function renderCommitInfoStatic() {
  d3.select('#stats').html(`
    <dl id="summary">
      <dt>COMMITS</dt><dd id="count-commits"></dd>
      <dt>FILES</dt><dd id="count-files"></dd>
      <dt>TOTAL LOC</dt><dd id="count-loc"></dd>
      <dt>MAX DEPTH</dt><dd id="count-depth"></dd>
      <dt>LONGEST LINE</dt><dd id="count-line"></dd>
      <dt>MAX LINES</dt><dd id="count-max"></dd>
    </dl>
  `);
}

function updateCommitInfo(data, commits) {
  d3.select('#count-commits').text(commits.length);
  d3.select('#count-files').text(d3.groups(data, d => d.file).length);
  d3.select('#count-loc').text(data.length);
  d3.select('#count-depth').text(d3.max(data, d => d.depth));
  d3.select('#count-line').text(d3.max(data, d => d.length));
  d3.select('#count-max').text(d3.max(commits, d => d.totalLines));
}

function renderScatterPlot(data) {
  const width = 900, height = 400, margin = { top: 20, right: 20, bottom: 40, left: 50 };

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([margin.left, width - margin.right]);

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([height - margin.bottom, margin.top]);

  svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`);

  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat(d => `${String(d).padStart(2, '0')}:00`));

  svg.append('g').attr('class', 'dots');

  updateScatterPlot(data);
}

function updateScatterPlot(data) {
  const rScale = d3.scaleSqrt()
    .domain(d3.extent(commits, d => d.totalLines))
    .range([3, 15]);

  svg.select('.dots')
    .selectAll('circle')
    .data(data, d => d.id)
    .join(
      enter => enter.append('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7),
      update => update
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines)),
      exit => exit.remove()
    );
}

function renderFileVisualization() {
  const lines = filteredCommits.flatMap(d => d.lines);
  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const container = d3.select('#files')
    .selectAll('div')
    .data(files, d => d.name)
    .join(enter => {
      const div = enter.append('div');
      div.append('dt');
      div.append('dd');
      return div;
    });

  container.select('dt')
    .text(d => `${d.name} — ${d.lines.length} lines`);

  container.select('dd')
    .selectAll('div')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .style('background', d => colors(d.type));
}

function onTimeSliderChange() {
  commitProgress = +document.getElementById('commit-progress').value;
  commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  document.getElementById('commit-time').textContent = commitMaxTime.toLocaleString();
  updateScatterPlot(filteredCommits);
  renderFileVisualization();
  updateCommitInfo(filteredCommits.flatMap(d => d.lines), filteredCommits);
}

function injectScrollStoryContainer() {
  if (!document.getElementById('scatter-story')) {
    const container = document.getElementById('scrolly-container');
    if (container) {
      const div = document.createElement('div');
      div.id = 'scatter-story';
      container.appendChild(div);
    }
  }
}

function renderScrollama() {
  const el = d3.select('#scatter-story');
  el.selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html(d => `On ${d.datetime.toLocaleString()}, I made <a href="${d.url}" target="_blank">a glorious commit</a>. ${d.totalLines} lines were changed.`);

  scrollama().setup({
    step: '.step',
    offset: 0.5
  }).onStepEnter(response => {
    d3.selectAll('.step').classed('is-active', false);
    d3.select(response.element).classed('is-active', true);

    commitMaxTime = response.element.__data__.datetime;
    filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
    updateScatterPlot(filteredCommits);
    renderFileVisualization();
    updateCommitInfo(filteredCommits.flatMap(d => d.lines), filteredCommits);

    document.getElementById('commit-progress').value = timeScale(commitMaxTime);
    document.getElementById('commit-time').textContent = commitMaxTime.toLocaleString();
  });
}

// === Main ===
let data = await loadData();
commits = processCommits(data);
renderCommitInfoStatic();
updateCommitInfo(data, commits);

timeScale = d3.scaleTime()
  .domain(d3.extent(commits, d => d.datetime))
  .range([0, 100]);
commitMaxTime = timeScale.invert(commitProgress);
filteredCommits = commits;

renderFileVisualization();
renderScatterPlot(filteredCommits);
injectScrollStoryContainer();
renderScrollama();

document.getElementById('commit-progress').addEventListener('input', onTimeSliderChange);
