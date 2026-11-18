import {fields, options} from '../schema.js?v=4';
import {ageBands, barsFor} from './analysis.js?v=6';
import {canvas, svg, text} from './plot.js?v=1';
import {distributionStats, smallGroupSize} from './relationship-analysis.js?v=2';
import {frequencyReport, genreReport, minutesReport, scoreReport} from './chart-interpretation.js?v=2';
import {relationshipCards} from './relationship-charts.js?v=2';

function countAxis(values) {
  const peak = Math.max(1, ...values);
  const step = Math.ceil(peak / 4);
  return Array.from({length: Math.ceil(peak / step) + 1}, (_, index) => index * step);
}

function horizontalPlot(rows, ticks, title, scale, format, dot = false) {
  const width = 560, left = 157, right = 448, top = 19, height = rows.length * 31 + 46;
  const max = ticks.at(-1);
  const x = value => left + value / max * (right - left);
  const plot = canvas(width, height, title, scale);
  for (const tick of ticks) {
    plot.append(svg('line', {x1: x(tick), x2: x(tick), y1: top, y2: height - 27, class: 'axis-guide'}),
      text(x(tick), height - 7, format(tick), {'text-anchor': 'middle', class: 'axis-text'}));
  }
  rows.forEach(({label, value, caption, sparse}, index) => {
    const y = top + index * 31 + 13;
    const row = svg('g', {});
    row.append(svg('title', {}, `${label}: ${caption}`));
    if (dot) {
      if (!sparse) row.append(svg('line', {x1: left, x2: x(value), y1: y, y2: y, class: 'dot-stem'}));
      row.append(svg('circle', {cx: x(value), cy: y, r: 5, class: sparse ? 'dot-mark sparse-dot' : 'dot-mark'}));
    } else {
      row.append(svg('rect', {x: left, y: y - 8, width: x(value) - left, height: 16, rx: 4, class: 'bar-mark'}));
    }
    row.append(text(left - 10, y + 4, label, {'text-anchor': 'end'}),
      text(right + 12, y + 4, caption, {class: 'value-text'}));
    plot.append(row);
  });
  return plot;
}

function scorePlot(rows, title, scale, format) {
  const width = 560, height = 222, left = 34, right = 544, top = 22, bottom = 187;
  const ticks = countAxis(rows.map(row => row.value));
  const y = value => bottom - value / ticks.at(-1) * (bottom - top);
  const column = (right - left) / rows.length;
  const plot = canvas(width, height, title, scale);
  for (const tick of ticks) {
    plot.append(svg('line', {x1: left, x2: right, y1: y(tick), y2: y(tick), class: 'axis-guide'}),
      text(left - 6, y(tick) + 4, format(tick), {'text-anchor': 'end', class: 'axis-text'}));
  }
  rows.forEach(({label, value}, index) => {
    const x = left + (index + 0.5) * column;
    const group = svg('g', {});
    group.append(svg('title', {}, `${label}/10: ${format(value)}`),
      svg('rect', {x: x - 13, y: y(value), width: 26, height: bottom - y(value), rx: 4, class: 'score-mark'}),
      text(x, bottom + 21, label, {'text-anchor': 'middle', class: 'axis-text'}));
    if (value) group.append(text(x, y(value) - 5, format(value), {'text-anchor': 'middle', class: 'value-text'}));
    plot.append(group);
  });
  return plot;
}

const heatColors = ['#f4f1f8', '#ede5f7', '#cdb9ed', '#a383d8', '#7950bb', '#4f2b8d'];

function heatmapPlot(rows, genres, title, scale, number, t) {
  const left = 88, top = 50, column = 91, band = 37;
  const width = left + genres.length * column + 45;
  const plot = canvas(width, top + rows.length * band + 50, title, scale);
  plot.setAttribute('class', 'heatmap');
  const defs = svg('defs', {});
  const pattern = svg('pattern', {id: 'heat-sparse-row', patternUnits: 'userSpaceOnUse', width: 6, height: 6});
  pattern.append(svg('rect', {width: 6, height: 6, fill: heatColors[0]}),
    svg('path', {d: 'M 0 6 L 6 0', stroke: '#dcd4ea', 'stroke-width': 1}));
  defs.append(pattern);
  plot.append(defs);
  genres.forEach(({label}, index) => {
    const x = left + index * column + column / 2;
    const lines = label.split(/\s+\/\s+|／/);
    const header = svg('text', {x, y: lines.length === 1 ? 31 : 18, 'text-anchor': 'middle', class: 'axis-text'});
    lines.forEach((line, row) => header.append(svg('tspan', {x, dy: row ? 15 : 0}, line)));
    plot.append(header);
  });
  rows.forEach(({label, total, values}, row) => {
    const y = top + row * band;
    const sparse = total > 0 && total < smallGroupSize;
    plot.append(text(left - 9, y + 22, sparse ? `${label}*` : label, {'text-anchor': 'end'}),
      text(left + genres.length * column + 6, y + 22, `n=${number(total)}`, {class: 'axis-text'}));
    values.forEach((count, index) => {
      const x = left + index * column;
      const fraction = total ? count / total : 0;
      const color = count ? Math.ceil(fraction * 5) : 0;
      const cell = svg('g', {});
      const fill = sparse ? 'url(#heat-sparse-row)' : heatColors[color];
      const style = {'text-anchor': 'middle', class: !sparse && color >= 4 ? 'heat-light' : 'heat-dark'};
      cell.append(svg('title', {}, `${label} · ${genres[index].label}: ${number(count)}/${number(total)}${total ? ` (${number(fraction * 100, 1)}%)` : ''}`),
        svg('rect', {x: x + 2, y, width: column - 4, height: band - 4, rx: 5, fill}),
        text(x + column / 2, y + (total ? 13 : 22), total ? number(count) : '—', style));
      if (total) cell.append(text(x + column / 2, y + 27, `${number(fraction * 100, 1)}%`, {...style, 'font-size': 10}));
      plot.append(cell);
    });
  });
  const legendY = top + rows.length * band + 14;
  plot.append(text(left, legendY + 11, '0%', {class: 'axis-text'}));
  heatColors.forEach((fill, index) => plot.append(svg('rect', {x: left + 26 + index * 20, y: legendY, width: 19, height: 13, fill})));
  plot.append(text(left + 154, legendY + 11, `100% · ${t('withinAge')}`, {class: 'axis-text'}));
  return plot;
}

const sum = rows => rows.reduce((total, row) => total + row.value, 0);

function mostFrequent(rows, total, number, t) {
  const max = Math.max(...rows.map(row => row.value));
  const leaders = rows.filter(row => row.value === max).map(row => row.label);
  return t(leaders.length === 1 ? 'modeOne' : 'modeTie', {
    labels: leaders.join(' · '), count: number(max), total: number(total), share: number(max / total * 100, 1)
  });
}

function addCard(target, {title, scale, n, plot, controls, detail, insight, report, wide}, t, total, number) {
  const card = document.createElement('article');
  card.className = wide ? 'card chart-card chart-wide' : 'card chart-card';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const description = document.createElement('p');
  description.className = 'meta';
  description.textContent = scale;
  card.append(heading, description);
  if (n !== undefined) {
    const coverage = document.createElement('p');
    coverage.className = 'chart-coverage';
    coverage.textContent = t('chartCoverage', {used: number(n), total: number(total)});
    card.append(coverage);
  }
  if (controls) card.append(controls);
  if (plot) {
    const frame = document.createElement('div');
    frame.className = 'chart-frame';
    frame.tabIndex = 0;
    frame.append(plot);
    card.append(frame);
  }
  if (detail) card.append(detail);
  const findings = document.createElement('p');
  findings.className = 'insight';
  findings.textContent = insight;
  card.append(findings);
  if (report) {
    const disclosure = document.createElement('details');
    disclosure.className = 'chart-report';
    const heading = document.createElement('summary');
    heading.textContent = t('detailedReport');
    const body = document.createElement('div');
    body.setAttribute('lang', 'vi');
    for (const paragraph of report) {
      const element = document.createElement('p');
      element.textContent = paragraph;
      body.append(element);
    }
    disclosure.append(heading, body);
    card.append(disclosure);
  }
  target.append(card);
}

export function renderCharts(target, summary, {langIndex, number, t}) {
  target.replaceChildren();
  const add = card => addCard(target, card, t, summary.total, number);
  const genre = options.genre.filter(([key]) => key !== 'none').map(option => ({
    key: option[0], label: option[langIndex + 1], vi: option[1], value: summary.counts.stress_genre[option[0]] || 0
  }));
  if (summary.ageGenre) {
    const rows = ageBands.map(([low, high], index) => {
      const band = summary.ageGenre[low] ?? {};
      const values = genre.map(({key}) => band[key] || 0);
      return {label: index === ageBands.length - 1 ? `${low}+` : `${low}–${high}`, values, total: values.reduce((a, b) => a + b, 0)};
    });
    const title = t('ageGenre'), scale = `${t('ageGenreScale')} ${t('ageGenreSparse', {minimum: smallGroupSize})}`;
    const total = rows.reduce((n, row) => n + row.total, 0);
    let insight = t('empty');
    if (total) {
      const leads = rows.filter(row => row.total >= smallGroupSize).map(row => {
        const max = Math.max(...row.values);
        const genres = genre.filter((_, index) => row.values[index] === max).map(item => item.label);
        return t(genres.length > 1 ? 'ageGenreRowTie' : 'ageGenreRowLead', {
          age: row.label, genres: genres.join(' / '), count: number(max), n: number(row.total), share: number(max / row.total * 100, 1)
        });
      });
      insight = leads.length ? leads.join(' ') : t('ageGenreSmallOnly', {minimum: smallGroupSize});
    }
    add({title, scale, n: total, plot: total ? heatmapPlot(rows, genre, title, scale, number, t) : null, insight,
      report: total ? genreReport(genre.map(g => ({label: g.vi, value: g.value})), rows, summary.total) : null, wide: true});
  } else {
    const title = t('genreChart'), scale = t('genreScale');
    const total = sum(genre);
    const rows = genre.sort((a, b) => b.value - a.value).map(row => ({...row, caption: number(row.value)}));
    const insight = total ? mostFrequent(rows, total, number, t) : t('empty');
    add({title, scale, n: total, plot: total ? horizontalPlot(rows, countAxis(rows.map(row => row.value)), title, scale, number) : null,
      insight: `${insight} ${t('heatmapCsv')}`,
      report: total ? genreReport(genre.map(g => ({label: g.vi, value: g.value})), null, summary.total) : null, wide: true});
  }

  const minutesTitle = t('minutesChart'), minutesScale = t('minutesScale');
  const minutes = barsFor(fields.find(field => field.key === 'listen_min'), summary.counts.listen_min, langIndex);
  const minutesTotal = sum(minutes);
  const minutesStats = minutesTotal ? distributionStats(summary.counts.listen_min) : null;
  const minutesPlot = minutes.map(row => ({...row, caption: number(row.value)}));
  add({title: minutesTitle, scale: minutesScale, n: minutesTotal,
    plot: minutesTotal ? horizontalPlot(minutesPlot, countAxis(minutes.map(row => row.value)), minutesTitle, minutesScale, number) : null,
    insight: minutesStats ? `${mostFrequent(minutes, minutesTotal, number, t)} ${t('minutesInsight', {median: number(minutesStats.median, 1), mean: number(minutesStats.mean, 1)})}` : t('empty'),
    report: minutesStats ? minutesReport(minutes, minutesStats, summary.total) : null});

  const scoreTitle = t('scoreChart'), scoreScale = t('scoreScale');
  const scores = barsFor(fields.find(field => field.key === 'stress_week'), summary.counts.stress_week, langIndex);
  const scoreTotal = sum(scores), high = sum(scores.slice(7));
  const scoreStats = scoreTotal ? distributionStats(summary.counts.stress_week) : null;
  add({title: scoreTitle, scale: scoreScale, n: scoreTotal, plot: scoreTotal ? scorePlot(scores, scoreTitle, scoreScale, number) : null,
    insight: scoreStats ? t('scoreInsight', {median: number(scoreStats.median, 1), mean: number(scoreStats.mean, 1), high: number(high), total: number(scoreTotal), share: number(high / scoreTotal * 100, 1)}) : t('empty'),
    report: scoreStats ? scoreReport(scores, scoreStats, high, summary.total) : null});

  const frequencyTitle = t('compare'), frequencyScale = `${t('frequencyScale')} ${t('frequencySparse', {minimum: smallGroupSize})}`;
  const frequency = options.stress_frequency.filter(([key]) => key !== 'no_stress').flatMap(option => {
    const group = summary.stressByFrequency[option[0]];
    if (!group?.n) return [];
    const value = group.sum / group.n;
    return [{label: option[langIndex + 1], vi: option[1], n: group.n, value, sparse: group.n < smallGroupSize, caption: `${number(value, 1)} · n=${number(group.n)}`}];
  });
  const frequencyValues = frequency.filter(row => !row.sparse).map(row => row.value);
  const frequencyInsight = frequencyValues.length > 1 ? t('frequencySpread', {minimum: smallGroupSize, low: number(Math.min(...frequencyValues), 1), high: number(Math.max(...frequencyValues), 1)})
    : frequency.length ? t('frequencySmallOnly', {minimum: smallGroupSize}) : t('empty');
  add({title: frequencyTitle, scale: frequencyScale, n: frequency.reduce((n, row) => n + row.n, 0), wide: true,
    plot: frequency.length ? horizontalPlot(frequency, [0,2,4,6,8,10], frequencyTitle, frequencyScale, number, true) : null,
    insight: frequency.length ? `${frequencyInsight} ${t('noCausality')}` : frequencyInsight,
    report: frequency.length ? frequencyReport(frequency.map(row => ({...row, label: row.vi})), summary.total, smallGroupSize) : null});
  relationshipCards(summary, {langIndex, number, t}).forEach(add);
}
