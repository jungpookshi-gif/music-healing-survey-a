import {options} from '../schema.js?v=4';
import {canvas, svg, text} from './plot.js?v=1';
import {distributionStats, scatterStats} from './relationship-analysis.js?v=1';
import {boxReport, scatterReport} from './chart-interpretation.js?v=1';

const scoreTicks = [0, 2, 4, 6, 8, 10];
const minimumBoxSize = 5;

function mark(key, caption, count) {
  const element = svg('g', {class: 'relationship-mark', tabindex: -1, role: 'img', 'aria-label': caption});
  element.append(svg('title', {}, caption));
  return {element, key, caption, count};
}

function inspector({selectorId, filterLabel, choices, marks, t, number}) {
  const controls = document.createElement('div');
  controls.className = 'relationship-controls';
  const label = document.createElement('label');
  label.setAttribute('for', selectorId);
  label.textContent = filterLabel;
  const select = document.createElement('select');
  select.id = selectorId;
  for (const [value, name] of [['', t('allMarks')], ...choices]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = name;
    select.append(option);
  }
  controls.append(label, select);
  const detail = document.createElement('p');
  detail.className = 'relationship-detail';
  detail.setAttribute('role', 'status');
  let active = marks;
  let current = marks[0];
  const show = item => { detail.textContent = item.caption; };
  function setCurrent(item) {
    current.element.setAttribute('tabindex', '-1');
    current = item;
    current.element.setAttribute('tabindex', '0');
  }
  current.element.setAttribute('tabindex', '0');
  detail.textContent = t('markHelp');
  select.onchange = () => {
    const key = select.value;
    active = key === '' ? marks : marks.filter(item => item.key === key);
    for (const item of marks) item.element.setAttribute('class', key === '' || item.key === key ? 'relationship-mark' : 'relationship-mark muted-mark');
    setCurrent(active[0]);
    detail.textContent = t('focusedCount', {n: number(active.reduce((sum, item) => sum + item.count, 0))});
  };
  for (const item of marks) {
    item.element.onpointerenter = () => show(item);
    item.element.onclick = () => show(item);
    item.element.onfocus = () => {
      if (active.includes(item)) setCurrent(item);
      show(item);
    };
    item.element.onkeydown = event => {
      const steps = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1};
      const step = steps[event.key];
      if (step === undefined) return;
      event.preventDefault();
      const index = Math.max(0, Math.min(active.length - 1, active.indexOf(item) + step));
      const next = active[index];
      setCurrent(next);
      next.element.focus();
    };
  }
  return {controls, detail};
}

function scatterPlot(stats, title, scale, number, t) {
  const width = 790, height = 360, left = 61, right = 758, top = 25, bottom = 298;
  const range = Math.max(30, stats.minutes.max);
  const step = [5, 10, 15, 30, 60, 120, 240, 360].find(unit => unit >= range / 6);
  const xMax = Math.ceil(range / step) * step;
  const x = minutes => left + minutes / xMax * (right - left);
  const y = score => bottom - score / 10 * (bottom - top);
  const plot = canvas(width, height, title, scale);
  plot.setAttribute('role', 'group');
  plot.setAttribute('class', 'relationship-plot');
  for (let minutes = 0; minutes <= xMax; minutes += step) {
    plot.append(svg('line', {x1: x(minutes), x2: x(minutes), y1: top, y2: bottom, class: 'axis-guide'}),
      text(x(minutes), bottom + 23, number(minutes), {'text-anchor': 'middle', class: 'axis-text'}));
  }
  for (const score of scoreTicks) {
    plot.append(svg('line', {x1: left, x2: right, y1: y(score), y2: y(score), class: 'axis-guide'}),
      text(left - 10, y(score) + 4, number(score), {'text-anchor': 'end', class: 'axis-text'}));
  }
  plot.append(svg('line', {x1: x(stats.minutes.median), x2: x(stats.minutes.median), y1: top, y2: bottom, class: 'chart-median-guide'}),
    svg('line', {x1: left, x2: right, y1: y(stats.scores.median), y2: y(stats.scores.median), class: 'chart-median-guide'}),
    text((left + right) / 2, height - 10, t('minutesAxis'), {'text-anchor': 'middle', class: 'axis-text'}),
    text(left, 14, t('stressAxis'), {class: 'axis-text'}));
  const maxCount = Math.max(...stats.points.map(point => point.count));
  const marks = stats.points.map(({minutes, score, count}) => {
    const caption = t('scatterPoint', {minutes: number(minutes), score: number(score), n: number(count)});
    const item = mark(String(score), caption, count);
    const radius = maxCount > 1 ? 5 + 12 * (Math.sqrt(count) - 1) / (Math.sqrt(maxCount) - 1) : 5;
    item.element.append(svg('circle', {cx: x(minutes), cy: y(score), r: radius, class: 'scatter-point'}));
    return item;
  });
  for (const item of [...marks].sort((a, b) => b.count - a.count)) plot.append(item.element);
  const choices = stats.scores.values.map(({value}) => [String(value), `${number(value)}/10`]);
  return {plot, ...inspector({selectorId: 'scatter-score', filterLabel: t('focusScore'), choices, marks, t, number})};
}

function boxPlot(groups, title, scale, number, t) {
  const width = 790, left = 166, right = 724, top = 23, rowHeight = 47;
  const bottom = top + groups.length * rowHeight, height = bottom + 48;
  const x = score => left + score / 10 * (right - left);
  const plot = canvas(width, height, title, scale);
  plot.setAttribute('role', 'group');
  plot.setAttribute('class', 'relationship-plot');
  for (const score of scoreTicks) {
    plot.append(svg('line', {x1: x(score), x2: x(score), y1: top, y2: bottom, class: 'axis-guide'}),
      text(x(score), bottom + 21, number(score), {'text-anchor': 'middle', class: 'axis-text'}));
  }
  plot.append(text((left + right) / 2, height - 4, t('stressAxis'), {'text-anchor': 'middle', class: 'axis-text'}));
  const marks = groups.map(({key, label, stats}, index) => {
    const y = top + (index + .5) * rowHeight;
    const box = stats.n >= minimumBoxSize;
    const caption = t(box ? 'boxPoint' : 'boxSmallPoint', {
      label, n: number(stats.n), median: number(stats.median, 2), low: number(stats.q1, 2), high: number(stats.q3, 2),
      scores: stats.values.map(({value, count}) => `${number(value)} × ${number(count)}`).join(' · ')
    });
    const item = mark(key, caption, stats.n);
    const row = item.element;
    row.append(svg('rect', {x: 3, y: y - rowHeight / 2 + 3, width: width - 6, height: rowHeight - 6, rx: 5, class: 'box-row-hit'}),
      text(left - 11, y + 4, label, {'text-anchor': 'end'}), text(right + 14, y + 4, `n=${number(stats.n)}`, {class: 'value-text'}));
    if (box) {
      row.append(svg('line', {x1: x(stats.lowerWhisker), x2: x(stats.upperWhisker), y1: y, y2: y, class: 'box-whisker'}));
      for (const score of [stats.lowerWhisker, stats.upperWhisker]) {
        row.append(svg('line', {x1: x(score), x2: x(score), y1: y - 7, y2: y + 7, class: 'box-whisker'}));
      }
      row.append(svg('rect', {x: x(stats.q1), y: y - 12, width: Math.max(1, x(stats.q3) - x(stats.q1)), height: 24, class: 'box-body'}),
        svg('line', {x1: x(stats.median), x2: x(stats.median), y1: y - 12, y2: y + 12, class: 'box-median'}));
    }
    for (const {value, count} of stats.values) {
      if (!box || value < stats.lowerWhisker || value > stats.upperWhisker) {
        const dot = svg('circle', {cx: x(value), cy: y, r: 4 + Math.min(6, Math.sqrt(count) - 1), class: 'box-point'});
        dot.append(svg('title', {}, t('boxScoreCount', {score: number(value), n: number(count)})));
        row.append(dot);
      }
    }
    plot.append(row);
    return item;
  });
  const choices = groups.map(({key, label}) => [key, label]);
  return {plot, ...inspector({selectorId: 'box-genre', filterLabel: t('focusGenre'), choices, marks, t, number})};
}

export function relationshipCards(summary, {langIndex, number, t}) {
  const scatterTitle = t('scatterTitle'), scatterScale = t('scatterScale');
  const scatter = summary.minutesStress ? scatterStats(summary.minutesStress) : null;
  const scatterCard = {title: scatterTitle, scale: scatterScale, wide: true, insight: t(summary.minutesStress ? 'empty' : 'pairedUnavailable')};
  if (scatter) {
    Object.assign(scatterCard, scatterPlot(scatter, scatterTitle, scatterScale, number, t), {
      insight: t(scatter.rho === null ? 'scatterMedianOnly' : 'scatterRho', {
        n: number(scatter.n), minutes: number(scatter.minutes.median, 1), score: number(scatter.scores.median, 1), rho: number(scatter.rho ?? 0, 2)
      }),
      report: scatterReport(scatter, summary.total)
    });
  }

  const boxTitle = t('boxTitle'), boxScale = t('boxScale', {minimum: minimumBoxSize});
  const groups = options.genre.filter(([key]) => key !== 'none').flatMap(option => {
    const stats = distributionStats(summary.genreStress?.[option[0]] ?? {});
    return stats ? [{key: option[0], label: option[langIndex + 1], vi: option[1], stats}] : [];
  });
  const boxCard = {title: boxTitle, scale: boxScale, wide: true, insight: t(summary.genreStress ? 'empty' : 'pairedUnavailable')};
  if (groups.length) {
    const n = groups.reduce((sum, group) => sum + group.stats.n, 0);
    const boxes = groups.filter(group => group.stats.n >= minimumBoxSize).length;
    Object.assign(boxCard, boxPlot(groups, boxTitle, boxScale, number, t), {
      insight: t('boxSummary', {n: number(n), groups: number(groups.length), boxes: number(boxes)}),
      report: boxReport(groups.map(group => ({...group, label: group.vi})), summary.total, minimumBoxSize)
    });
  }
  return [scatterCard, boxCard];
}
