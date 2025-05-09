import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// 全局变量提升
let xScale, yScale, svg, usableArea, commits;

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: +row.line,
        depth: +row.depth,
        length: +row.length,
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    return data;
}

function processCommits(data) {
    return d3.groups(data, d => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;

            let ret = {
                id: commit,
                url: 'https://github.com/Arcilios/portfolio/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                enumerable: false
            });

            return ret;
        });
}

function renderCommitInfo(data, commits) {
    const dl = d3.select('#stats')
        .append('dl')
        .attr('class', 'stats');

    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    const numFiles = d3.groups(data, d => d.file).length;
    dl.append('dt').text('Total files');
    dl.append('dd').text(numFiles);

    const avgDepth = d3.mean(data, d => d.depth).toFixed(2);
    dl.append('dt').text('Average depth');
    dl.append('dd').text(avgDepth);

    const longestLine = d3.max(data, d => d.length);
    dl.append('dt').text('Longest line (chars)');
    dl.append('dd').text(longestLine);
}

function renderScatterPlot(commitsData) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 50 };

    // 提升全局变量
    commits = commitsData;

    svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('width', '100%')
        .style('height', 'auto')
        .style('overflow', 'visible');

    usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    xScale = d3.scaleTime()
        .domain(d3.extent(commits, d => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);

    const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);

    const rScale = d3.scaleSqrt()
        .domain([minLines, maxLines])
        .range([3, 15]);

    const dots = svg.append('g').attr('class', 'dots');
    dots.selectAll('circle')
        .data(commits)
        .join('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mousemove', (event) => {
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });

    const xAxis = d3.axisBottom(xScale);
    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');
    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    svg.append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(d3.axisLeft(yScale)
            .tickFormat('')
            .tickSize(-usableArea.width)
        );

    // ✅ 初始化 brush（现在放到这里）
    const brush = d3.brush()
        .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
        .on('start brush end', brushed);

    svg.call(brush);
    svg.selectAll('.dots').raise();
}

function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');

    if (!commit) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
        timeStyle: 'short'
    });
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
}

function brushed(event) {
    const selection = event.selection;

    d3.selectAll('circle')
        .classed('selected', d => isCommitSelected(selection, d));

    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
    if (!selection) return false;

    const [[x0, y0], [x1, y1]] = selection;
    const cx = xScale(commit.datetime);
    const cy = yScale(commit.hourFrac);

    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function renderSelectionCount(selection) {
    const selectedCommits = selection
        ? commits.filter(d => isCommitSelected(selection, d))
        : [];

    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
        selectedCommits.length || 'No'
    } commits selected`;

    return selectedCommits;
}

function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
        ? commits.filter(d => isCommitSelected(selection, d))
        : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }

    const lines = selectedCommits.flatMap(d => d.lines);

    const breakdown = d3.rollup(
        lines,
        v => v.length,
        d => d.type,
    );

    container.innerHTML = '';

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);

        container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
    }
}

// 🚀 初始化加载
let data = await loadData();
commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(commits);
