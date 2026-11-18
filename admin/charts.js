import {fields, options} from '../schema.js?v=4';
import {ageBands, barsFor, mean} from './analysis.js?v=5';

const svgNamespace = 'http://www.w3.org/2000/svg';

function svg(tag, attributes, text) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

function canvas(width, height, title, scale) {
  const plot = svg('svg', {viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${title}. ${scale}`, focusable: 'false'});
  plot.append(svg('title', {}, title), svg('desc', {}, scale));
  return plot;
}

function text(x, y, value, attributes = {}) {
  return svg('text', {x, y, ...attributes}, value);
}

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
  rows.forEach(({label, value, caption}, index) => {
    const y = top + index * 31 + 13;
    const row = svg('g', {});
    row.append(svg('title', {}, `${label}: ${caption}`));
    if (dot) {
      row.append(svg('line', {x1: left, x2: x(value), y1: y, y2: y, class: 'dot-stem'}),
        svg('circle', {cx: x(value), cy: y, r: 5, class: 'dot-mark'}));
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
  genres.forEach(({label}, index) => {
    const x = left + index * column + column / 2;
    const lines = label.split(/\s+\/\s+|／/);
    const header = svg('text', {x, y: lines.length === 1 ? 31 : 18, 'text-anchor': 'middle', class: 'axis-text'});
    lines.forEach((line, row) => header.append(svg('tspan', {x, dy: row ? 15 : 0}, line)));
    plot.append(header);
  });
  rows.forEach(({label, total, values}, row) => {
    const y = top + row * band;
    plot.append(text(left - 9, y + 22, label, {'text-anchor': 'end'}),
      text(left + genres.length * column + 6, y + 22, `n=${number(total)}`, {class: 'axis-text'}));
    values.forEach((count, index) => {
      const x = left + index * column;
      const fraction = total ? count / total : 0;
      const color = count ? Math.ceil(fraction * 5) : 0;
      const cell = svg('g', {});
      cell.append(svg('title', {}, `${label} · ${genres[index].label}: ${number(count)}/${number(total)}${total ? ` (${number(fraction * 100, 1)}%)` : ''}`),
        svg('rect', {x: x + 2, y, width: column - 4, height: band - 4, rx: 5, fill: heatColors[color]}),
        text(x + column / 2, y + 22, total ? number(count) : '—', {'text-anchor': 'middle', class: color >= 4 ? 'heat-light' : 'heat-dark'}));
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

function addCard(target, {title, scale, plot, insight, wide}) {
  const card = document.createElement('article');
  card.className = wide ? 'card chart-card chart-wide' : 'card chart-card';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const description = document.createElement('p');
  description.className = 'meta';
  description.textContent = scale;
  card.append(heading, description);
  if (plot) {
    const frame = document.createElement('div');
    frame.className = 'chart-frame';
    frame.tabIndex = 0;
    frame.append(plot);
    card.append(frame);
  }
  const findings = document.createElement('p');
  findings.className = 'insight';
  findings.textContent = insight;
  card.append(findings);
  target.append(card);
}

export function renderCharts(target, summary, {langIndex, number, t}) {
  target.replaceChildren();
  const add = options => addCard(target, options);
  const genre = options.genre.filter(([key]) => key !== 'none').map(option => ({
    key: option[0], label: option[langIndex + 1], value: summary.counts.stress_genre[option[0]] || 0
  }));
  if (summary.ageGenre) {
    const rows = ageBands.map(([low, high], index) => {
      const band = summary.ageGenre[low] ?? {};
      const values = genre.map(({key}) => band[key] || 0);
      return {label: index === ageBands.length - 1 ? `${low}+` : `${low}–${high}`, values, total: values.reduce((a, b) => a + b, 0)};
    });
    const title = t('ageGenre'), scale = t('ageGenreScale');
    const total = rows.reduce((n, row) => n + row.total, 0);
    let insight = t('empty');
    if (total) {
      const max = Math.max(...rows.flatMap(row => row.values));
      const leaders = rows.flatMap(row => row.values.flatMap((value, index) => value === max ? [{age: row.label, genre: genre[index].label}] : []));
      insight = t(leaders.length === 1 ? 'ageGenreLead' : 'ageGenreTie', {
        ...leaders[0], ties: number(leaders.length), count: number(max), total: number(total)
      });
    }
    add({title, scale, plot: total ? heatmapPlot(rows, genre, title, scale, number, t) : null, insight, wide: true});
  } else {
    const title = t('genreChart'), scale = t('genreScale');
    const total = sum(genre);
    const rows = genre.sort((a, b) => b.value - a.value).map(row => ({...row, caption: number(row.value)}));
    const insight = total ? mostFrequent(rows, total, number, t) : t('empty');
    add({title, scale, plot: total ? horizontalPlot(rows, countAxis(rows.map(row => row.value)), title, scale, number) : null,
      insight: `${insight} ${t('heatmapCsv')}`, wide: true});
  }

  const minutesTitle = t('minutesChart'), minutesScale = t('minutesScale');
  const minutes = barsFor(fields.find(field => field.key === 'listen_min'), summary.counts.listen_min, langIndex);
  const minutesTotal = sum(minutes);
  const minutesPlot = minutes.map(row => ({...row, caption: number(row.value)}));
  add({title: minutesTitle, scale: minutesScale,
    plot: minutesTotal ? horizontalPlot(minutesPlot, countAxis(minutes.map(row => row.value)), minutesTitle, minutesScale, number) : null,
    insight: minutesTotal ? `${mostFrequent(minutes, minutesTotal, number, t)} ${t('minutesInsight', {mean: number(mean(summary.counts.listen_min), 1)})}` : t('empty')});

  const scoreTitle = t('scoreChart'), scoreScale = t('scoreScale');
  const scores = barsFor(fields.find(field => field.key === 'stress_week'), summary.counts.stress_week, langIndex);
  const scoreTotal = sum(scores), high = sum(scores.slice(7));
  add({title: scoreTitle, scale: scoreScale, plot: scoreTotal ? scorePlot(scores, scoreTitle, scoreScale, number) : null,
    insight: scoreTotal ? t('scoreInsight', {mean: number(mean(summary.counts.stress_week), 1), high: number(high), total: number(scoreTotal), share: number(high / scoreTotal * 100, 1)}) : t('empty')});

  const frequencyTitle = t('compare'), frequencyScale = t('frequencyScale');
  const frequency = options.stress_frequency.filter(([key]) => key !== 'no_stress').flatMap(option => {
    const group = summary.stressByFrequency[option[0]];
    if (!group?.n) return [];
    const value = group.sum / group.n;
    return [{label: option[langIndex + 1], value, caption: `${number(value, 1)} · n=${number(group.n)}`}];
  });
  const frequencyValues = frequency.map(row => row.value);
  const frequencyInsight = frequency.length > 1 ? t('frequencySpread', {low: number(Math.min(...frequencyValues), 1), high: number(Math.max(...frequencyValues), 1)})
    : frequency.length ? t('frequencySingle', {group: frequency[0].label, mean: number(frequency[0].value, 1)}) : t('empty');
  add({title: frequencyTitle, scale: frequencyScale, wide: true,
    plot: frequency.length ? horizontalPlot(frequency, [0,2,4,6,8,10], frequencyTitle, frequencyScale, number, true) : null,
    insight: frequency.length ? `${frequencyInsight} ${t('noCausality')}` : frequencyInsight});
}
