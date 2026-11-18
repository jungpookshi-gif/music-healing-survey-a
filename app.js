import {fields, options} from './schema.js?v=3';
import {text} from './i18n.js?v=7';
import {validAnswer, makePayload, noStressListening, detailLimits, ageRange} from './logic.js?v=4';
import {createPlayer} from './music.js?v=3';
import {connectSurveyShare, loadKakaoShare, surveyInviteUrl} from './sharing.js?v=7';

const languages = ['vi', 'ko', 'en', 'zh', 'mn'];
const draftKey = 'mhs-a-v2';
const finalStep = fields.length;
const doneStep = finalStep + 1;
const config = window.SURVEY_CONFIG || {};
const endpoint = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.endpoint ?? '') ? config.endpoint : '';
const coverImage = typeof config.coverImage === 'string' ? config.coverImage : '';
const app = document.querySelector('#app');
const art = document.querySelector('.art');
const motion = document.querySelector('#motion');
const player = createPlayer(document.querySelector('#music-player'), key => t(key));

let lang = new URL(location.href).searchParams.get('lang');
if (!languages.includes(lang)) lang = 'vi';
let step = -1;
let answers = {};
let details = {};
let consent = false;
let receipt = false;
let result = null;
let paused = false;
let submitting = false;
let failed = false;
let nextTimer;

try {
  const draft = JSON.parse(sessionStorage.getItem(draftKey));
  if (draft?.consent) {
    answers = draft.answers ?? {};
    details = draft.details ?? {};
    result = draft.pending ?? null;
    consent = true;
  }
} catch {}

const li = () => languages.indexOf(lang);
const t = key => text[key][li()];
const esc = value => String(value).replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

function remember() {
  try {
    const pending = endpoint && step !== doneStep ? result : null;
    sessionStorage.setItem(draftKey, JSON.stringify({consent, answers, details, pending}));
  } catch {}
}

function clearDraft() {
  try { sessionStorage.removeItem(draftKey); } catch {}
}

function setAnswer(key, value) {
  const previousGenre = answers.stress_genre;
  answers[key] = value;
  if (key === 'stress_frequency') {
    if (noStressListening(answers)) answers.stress_genre = 'none';
    else if (previousGenre === 'none') delete answers.stress_genre;
  }
  if (answers.stress_genre !== previousGenre || answers.stress_genre === 'none') delete answers.genre_like;
  remember();
}

function show(nextStep) {
  clearTimeout(nextTimer);
  step = nextStep;
  render();
  const heading = app.querySelector('h1, h2');
  heading.tabIndex = -1;
  heading.focus({preventScroll: true});
  if (heading.getBoundingClientRect().bottom > window.innerHeight) {
    heading.scrollIntoView({block: 'nearest'});
  }
}

function queueAdvance() {
  clearTimeout(nextTimer);
  const current = step;
  nextTimer = setTimeout(() => {
    if (step === current) nextQuestion();
  }, 220);
}

function render() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
  document.title = t('title') + ' · Survey A';
  document.querySelectorAll('[data-lang]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
  });
  document.querySelector('#question-count').textContent = t('footer');
  motion.textContent = t(paused ? 'resume' : 'motion');
  art.hidden = motion.hidden = step === doneStep;
  art.querySelector('.arm').style.transform = `rotate(${-19 + Math.min(finalStep, Math.max(0, step)) * 2}deg)`;
  player.update(step >= 0 && step <= finalStep);

  if (step === -1) return renderIntro();
  if (step === finalStep) return renderDetails();
  if (step === doneStep) return renderDone();
  renderQuestion();
}

function renderIntro() {
  app.innerHTML = `<div class="card">
    <h1>${t('studyTitle')}</h1>
    <p>${t('desc')}</p>
    <p class="help">${t('privacy')}</p>
    ${endpoint ? '' : `<div class="notice">${t('offline')}</div>`}
    <label class="consent"><input id="consent" type="checkbox" ${consent ? 'checked' : ''}><span>${t('consent')}</span></label>
    <button id="start" class="primary" ${consent ? '' : 'disabled'}>${t('start')} →</button>
  </div>`;
  const start = app.querySelector('#start');
  app.querySelector('#consent').onchange = event => {
    consent = event.target.checked;
    if (consent) remember();
    else clearDraft();
    start.disabled = !consent;
  };
  start.onclick = () => {
    show(result && endpoint ? finalStep : 0);
    void player.play();
  };
}

function renderQuestion() {
  const field = fields[step];
  const value = answers[field.key];
  const excluded = noStressListening(answers) && ['stress_genre', 'genre_like'].includes(field.key);
  app.innerHTML = `<div class="card">
    <div class="meta"><span>${field.code} · ${t('track')} ${step + 1} / ${finalStep}</span>
      ${excluded ? '' : `<span class="badge">${t(field.required ? 'required' : 'optional')}</span>`}</div>
    <h2 id="question">${esc(field.label[li()])}</h2>
    <div id="control"></div>
    <p id="error" role="alert"></p>
    <div class="actions"><button id="back" class="secondary">← ${t('back')}</button>
      <button id="next" class="primary">${t('next')} →</button></div>
  </div>`;
  const control = app.querySelector('#control');
  if (excluded) {
    control.textContent = t('inapp');
  } else if (field.type === 'choice') {
    renderChoices(control, field, value);
  } else if (field.type === 'number') {
    const age = field.key === 'age';
    control.innerHTML = `<input id="answer" aria-labelledby="question" type="number" inputmode="numeric"
      min="${age ? ageRange.min : 0}" max="${age ? ageRange.max : 1440}" step="1" value="${esc(value ?? '')}">
      <p class="help">${t(age ? 'ageHint' : 'listenHint')}</p>`;
    const input = control.querySelector('input');
    input.oninput = () => setAnswer(field.key, input.value === '' ? null : Number(input.value));
    input.onkeydown = confirmOnEnter;
  } else {
    renderScale(control, field, value);
  }
  if (!field.required && !excluded) {
    const skip = document.createElement('button');
    skip.className = 'quiet';
    skip.textContent = t('skip');
    skip.onclick = () => {
      delete answers[field.key];
      remember();
      nextQuestion();
    };
    control.append(skip);
  }
  app.querySelector('#back').onclick = () => show(step - 1);
  app.querySelector('#next').onclick = nextQuestion;
}

function renderChoices(control, field, value) {
  const group = options[field.options].filter(option => field.key !== 'stress_genre' || option[0] !== 'none');
  control.innerHTML = `<div class="choices" role="radiogroup" aria-labelledby="question">
    ${group.map(option => `<label class="choice"><input type="radio" name="answer" value="${option[0]}"
      ${value === option[0] ? 'checked' : ''}><span>${esc(option[li() + 1])}</span></label>`).join('')}
  </div>`;
  for (const input of control.querySelectorAll('input')) {
    input.onchange = () => setAnswer(field.key, input.value);
    input.onclick = event => {
      if (event.detail > 0) queueAdvance();
    };
    input.onkeydown = event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      input.checked = true;
      setAnswer(field.key, input.value);
      queueAdvance();
    };
  }
}

function renderScale(control, field, value) {
  const selected = Number.isInteger(value);
  const like = field.key === 'genre_like';
  control.innerHTML = `<div class="scale-value"><output id="rating">${selected ? value : '—'}</output><small> / 10</small></div>
    <input id="range" type="range" min="0" max="10" step="1" value="${selected ? value : 5}"
      aria-labelledby="question" aria-valuetext="${esc(selected ? value : t('unanswered'))}">
    <div class="ticks">${Array.from({length: 11}, (_, i) => `<span>${i}</span>`).join('')}</div>
    <div class="endpoints"><span>${t(like ? 'lowlike' : 'lowstress')}</span><span>${t(like ? 'highlike' : 'highstress')}</span></div>
    <input id="numeric" type="number" min="0" max="10" step="1" inputmode="numeric" aria-labelledby="question" value="${esc(value ?? '')}">
    <p class="help">${t('scalehelp')}</p>`;
  const range = control.querySelector('#range');
  const numeric = control.querySelector('#numeric');
  const rating = control.querySelector('#rating');
  function select(n) {
    setAnswer(field.key, n);
    rating.textContent = n ?? '—';
    range.setAttribute('aria-valuetext', n === null ? t('unanswered') : String(n));
  }
  range.oninput = () => {
    numeric.value = range.value;
    select(Number(range.value));
  };
  range.onpointerup = () => {
    range.oninput();
    queueAdvance();
  };
  range.onkeydown = numeric.onkeydown = confirmOnEnter;
  numeric.oninput = () => {
    const score = numeric.value === '' ? null : Number(numeric.value);
    select(score);
    if (score !== null && score >= 0 && score <= 10) range.value = score;
  };
}

function confirmOnEnter(event) {
  if (event.key === 'Enter' && !event.isComposing) nextQuestion();
}

function nextQuestion() {
  const field = fields[step];
  if (!validAnswer(field, answers)) {
    const message = field.key === 'age' ? 'ageError' : field.type === 'number' ? 'number' : 'choose';
    app.querySelector('#error').textContent = t(message);
    return;
  }
  show(step + 1);
}

function renderDetails() {
  const locked = Boolean(endpoint && result);
  app.innerHTML = `<form class="card" id="details">
    <h2>${t('finalStep')}</h2>
    <p class="help" id="details-hint">${t('detailsHint')}</p>
    <div class="details-field">
      <label for="participant-name">${t('name')} <span class="badge">${t('optional')}</span></label>
      <input id="participant-name" name="participant_name" type="text" maxlength="${detailLimits.participant_name}"
        aria-describedby="details-hint" value="${esc(details.participant_name ?? '')}" ${locked ? 'readonly' : ''}>
    </div>
    <div class="details-field">
      <label for="survey-feedback">${t('feedback')} <span class="badge">${t('optional')}</span></label>
      <textarea id="survey-feedback" name="feedback" maxlength="${detailLimits.feedback}" rows="4"
        aria-describedby="details-hint" ${locked ? 'readonly' : ''}>${esc(details.feedback ?? '')}</textarea>
    </div>
    <p id="error" role="alert">${failed ? t('failed') : ''}</p>
    <div class="actions">
      <button id="back" type="button" class="secondary" ${locked ? 'disabled' : ''}>← ${t('back')}</button>
      <button id="next" type="submit" class="primary" ${submitting ? 'disabled' : ''}>
        ${t(submitting ? 'sending' : endpoint ? 'submit' : 'finish')}</button>
    </div>
    ${failed ? `<button id="backup" type="button" class="quiet">${t('download')}</button>` : ''}
  </form>`;
  const form = app.querySelector('#details');
  form.oninput = event => {
    details[event.target.name] = event.target.value;
    remember();
  };
  form.onsubmit = event => {
    event.preventDefault();
    void submit();
  };
  app.querySelector('#back').onclick = () => show(finalStep - 1);
  if (failed) app.querySelector('#backup').onclick = download;
}

async function submit() {
  if (submitting) return;
  if (!result || !endpoint) {
    const missing = fields.findIndex(field => !validAnswer(field, answers));
    if (missing !== -1) {
      show(missing);
      return;
    }
    result = makePayload(answers, lang, details);
  }
  if (endpoint) {
    submitting = true;
    failed = false;
    remember();
    renderDetails();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new URLSearchParams({payload: JSON.stringify(result)}),
        signal: controller.signal,
        redirect: 'follow'
      });
      const body = await response.json();
      if (response.ok && body.error === 'age' && result.answers.age > ageRange.max) {
        result = null;
        remember();
        show(0);
        app.querySelector('#error').textContent = t('ageError');
        return;
      }
      if (!response.ok || body.ok !== true || body.id !== result.id ||
        (Object.keys(result.details ?? {}).length && body.detailsSaved !== true)) throw Error('Unconfirmed');
      receipt = true;
    } catch {
      failed = true;
    } finally {
      clearTimeout(timer);
      submitting = false;
    }
    if (failed) {
      renderDetails();
      return;
    }
  }
  clearDraft();
  show(doneStep);
}

function download() {
  const blob = new Blob([JSON.stringify(result, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'survey-a-' + result.id + '.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function shareSection() {
  return `<section class="survey-share" aria-labelledby="share-title">
    <h2 id="share-title">${t('shareHeading')}</h2>
    <div class="share-actions">
      <button class="primary" type="button" id="share-survey" aria-expanded="false" aria-controls="share-platforms">${t('shareSurvey')}</button>
    </div>
    <div class="share-platforms" id="share-platforms" hidden>
      <p>${t('chooseShareApp')}</p>
      <div class="share-actions">
        <button class="secondary" type="button" id="share-kakao" hidden>KakaoTalk</button>
        <a class="secondary" id="share-facebook" rel="noreferrer">Facebook</a>
        <a class="secondary" id="share-telegram" rel="noreferrer">Telegram</a>
        <button class="secondary" type="button" id="share-other-apps" hidden>${t('otherShareApps')}</button>
      </div>
      <p id="share-status" role="status"></p>
    </div>
  </section>`;
}

function renderDone() {
  app.innerHTML = `<div class="card completion">
    <figure class="record-cover">
      <div class="record-sleeve" aria-hidden="true">
        <div class="record-art"><span>Music<br>Healing</span><small>Survey A</small></div>
        ${coverImage ? `<img src="${esc(coverImage)}" alt="">` : ''}
      </div>
      <figcaption>${t('cover')}</figcaption>
    </figure>
    <h1>${t('done')}</h1>
    <div class="notice">${t(receipt ? 'sent' : 'localdone')}</div>
    <div class="actions"><button class="secondary" id="edit" ${receipt ? 'disabled' : ''}>${t('edit')}</button>
      <button class="primary" id="download">${t('download')}</button></div>
    ${receipt ? shareSection() : ''}
  </div>`;
  const image = app.querySelector('.record-sleeve img');
  if (image) image.onerror = () => image.remove();
  app.querySelector('#download').onclick = download;
  app.querySelector('#edit').onclick = () => show(0);
  if (receipt) {
    connectSurveyShare(app.querySelector('.survey-share'), surveyInviteUrl(location.href, lang), t, {
      kakao: loadKakaoShare(config.kakaoJavaScriptKey)
    });
  }
}

for (const button of document.querySelectorAll('[data-lang]')) {
  button.onclick = () => {
    clearTimeout(nextTimer);
    lang = button.dataset.lang;
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
    render();
  };
}
motion.onclick = () => {
  paused = !paused;
  document.body.classList.toggle('paused', paused);
  motion.textContent = t(paused ? 'resume' : 'motion');
};
render();
