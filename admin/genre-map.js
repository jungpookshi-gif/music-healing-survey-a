import {options} from '../schema.js?v=4';
import {canvas, svg, text} from './plot.js?v=1';
import {distributionStats, smallGroupSize} from './relationship-analysis.js?v=2';

const genres = options.genre.filter(([key]) => key !== 'none');
const genreKeys = new Set(genres.map(([key]) => key));
const colors = ['#a753a6', '#b6625f', '#5876c5', '#397e73', '#725aa6', '#ad7235', '#2a777b', '#665d7c'];
const audioGenres = new Set(genres.map(([key]) => key).filter(key => key !== 'other'));
const isMedian = value => Number.isFinite(value) && value >= 0 && value <= 10 && Number.isInteger(value * 2);

export function readGenreSnapshot(content) {
  const data = JSON.parse(content);
  const {schema, date, total, groups} = data ?? {};
  if (schema !== 'music-healing-survey-a/genre-map-v1' || typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(total) || total < 0 ||
    !Array.isArray(groups) || groups.length > genres.length) throw Error('snapshot');
  const seen = new Set();
  let included = 0;
  for (const {genre, n, likingMedian, stressMedian} of groups) {
    if (!genreKeys.has(genre) || seen.has(genre) || !Number.isInteger(n) || n < 1 ||
      !isMedian(likingMedian) || !isMedian(stressMedian)) throw Error('snapshot');
    seen.add(genre);
    included += n;
  }
  if (included > total) throw Error('snapshot');
  return {date, total, groups};
}

export function summarizeGenres(profile) {
  return genres.flatMap(([genre]) => {
    const group = profile[genre];
    if (!group) return [];
    const liking = distributionStats(group.liking ?? {});
    const stress = distributionStats(group.stress ?? {});
    if (!liking || !stress || liking.n !== stress.n || !isMedian(liking.median) || !isMedian(stress.median)) return [];
    return [{genre, n: liking.n, likingMedian: liking.median, stressMedian: stress.median}];
  });
}

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  if (className) node.className = className;
  return node;
}

function drawMap(groups, t, number, select) {
  const left = 57, right = 570, top = 63, bottom = 310;
  const x = value => left + value / 10 * (right - left);
  const y = value => bottom - value / 10 * (bottom - top);
  const map = canvas(625, 362, t('genreMapTitle'), t('genreMapIntro'));
  map.append(svg('rect', {x: left, y: top, width: right - left, height: bottom - top, class: 'map-axes-bg'}));
  for (const tick of [0, 2, 4, 6, 8, 10]) {
    map.append(svg('line', {x1: x(tick), x2: x(tick), y1: top, y2: bottom, class: 'axis-guide'}),
      svg('line', {x1: left, x2: right, y1: y(tick), y2: y(tick), class: 'axis-guide'}),
      text(x(tick), bottom + 30, number(tick), {'text-anchor': 'middle', class: 'axis-text'}),
      text(left - 15, y(tick) + 4, number(tick), {'text-anchor': 'end', class: 'axis-text'}));
  }
  const maximum = Math.max(...groups.map(group => group.n));
  const marks = new Map();
  for (const group of groups) {
    const dot = svg('circle', {
      cx: x(group.likingMedian), cy: y(group.stressMedian), r: 23 * Math.sqrt(group.n / maximum),
      fill: group.color, class: group.n < smallGroupSize ? 'genre-mark sparse-genre' : 'genre-mark'
    });
    dot.append(svg('title', {}, `${group.label} · ${t('genreMapLiking')} ${number(group.likingMedian, 1)}/10 · ${t('genreMapStress')} ${number(group.stressMedian, 1)}/10 · n=${number(group.n)}`));
    dot.addEventListener('click', () => select(group));
    map.append(dot);
    marks.set(group.genre, dot);
  }
  return {map, marks};
}

export function renderGenreMap(target, summary, {langIndex, number, t, snapshot, onSnapshot} = {}) {
  target.querySelector('audio')?.pause();
  target.replaceChildren();
  if (!summary) return;

  const heading = element('h2', t('genreMapTitle'));
  heading.id = 'genre-map-title';
  target.append(heading, element('p', t('genreMapIntro'), 'genre-map-intro'));
  const live = summary.genreProfile != null;
  const data = live ? {total: summary.total, groups: summarizeGenres(summary.genreProfile)} : snapshot;
  if (!live) {
    const alternate = element('div', '', 'genre-map-import');
    const label = element('label', t('genreMapUpload'), 'file');
    label.htmlFor = 'genre-map-file';
    const file = element('input');
    file.id = 'genre-map-file';
    file.type = 'file';
    file.accept = '.json,application/json';
    const status = element('p', '', 'meta');
    status.setAttribute('role', 'status');
    file.onchange = async () => {
      const chosen = file.files[0];
      if (!chosen) return;
      try {
        const saved = readGenreSnapshot(await chosen.text());
        if (file.isConnected) onSnapshot(saved);
      } catch {
        file.value = '';
        status.textContent = t('genreMapInvalid');
      }
    };
    alternate.append(label, file, element('p', t('genreMapImportHelp'), 'meta'), status);
    target.append(alternate);
  }
  if (!data?.groups.length) {
    if (data) target.append(element('p', t('empty'), 'insight'));
    return;
  }
  if (data.date) target.append(element('p', t('genreMapSnapshot', {date: data.date}), 'meta'));

  const groups = genres.flatMap(([genre, ...names], index) => {
    const values = data.groups.find(row => row.genre === genre);
    return values ? [{...values, label: names[langIndex], color: colors[index]}] : [];
  }).sort((first, second) => second.n - first.n);
  const used = groups.reduce((total, group) => total + group.n, 0);
  target.append(element('p', t('chartCoverage', {used: number(used), total: number(data.total)}), 'chart-coverage'));
  const layout = element('div', '', 'genre-map-layout');
  const plot = element('div', '', 'genre-map-plot');
  const panel = element('div', '', 'genre-map-panel');
  const picker = element('div', '', 'genre-map-picker');
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', t('genreMapChoose'));
  const selectedTitle = element('h3');
  const details = element('dl', '', 'genre-map-details');
  details.setAttribute('aria-live', 'polite');
  const audioNote = element('p', t('genreMapAudio'), 'meta');
  const audio = element('audio');
  audio.controls = true;
  audio.preload = 'none';
  const buttons = new Map();

  function select(group) {
    for (const [key, button] of buttons) {
      const selected = key === group.genre;
      button.setAttribute('aria-pressed', String(selected));
      marks.get(key).classList.toggle('selected-genre', selected);
    }
    selectedTitle.textContent = group.label;
    details.replaceChildren();
    for (const [label, value] of [
      [t('total'), number(group.n)],
      [t('genreMapLiking'), `${number(group.likingMedian, 1)}/10`],
      [t('genreMapStress'), `${number(group.stressMedian, 1)}/10`]
    ]) {
      details.append(element('dt', label), element('dd', value));
    }
    audio.pause();
    const hasAudio = audioGenres.has(group.genre);
    audio.hidden = !hasAudio;
    audioNote.hidden = !hasAudio;
    if (hasAudio) {
      audio.src = `../media/genre/${group.genre}.mp3`;
      audio.setAttribute('aria-label', `${t('genreMapAudio')} · ${group.label}`);
    } else {
      audio.removeAttribute('src');
    }
    audio.load();
  }

  const {map, marks} = drawMap(groups, t, number, select);
  for (const group of groups) {
    const marker = element('span', '', 'genre-map-swatch');
    marker.style.backgroundColor = group.color;
    marker.setAttribute('aria-hidden', 'true');
    const button = element('button');
    button.type = 'button';
    button.append(marker, element('span', `${group.label} · n=${number(group.n)}`));
    button.addEventListener('click', () => select(group));
    picker.append(button);
    buttons.set(group.genre, button);
  }
  plot.append(element('p', t('genreMapStressAxis'), 'genre-map-axis'), map, element('p', t('genreMapLikingAxis'), 'genre-map-axis'));
  panel.append(element('p', t('genreMapChoose'), 'genre-map-prompt'), picker, selectedTitle, details, audioNote, audio);
  layout.append(plot, panel);
  target.append(layout, element('p', t('genreMapNote', {minimum: smallGroupSize}), 'meta'));
  select(groups[0]);
}
