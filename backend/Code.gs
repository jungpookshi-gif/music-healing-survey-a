// Public web app: write validated Survey A responses; read only summary counts
// after verifying the key stored in the owner's private spreadsheet.
// Set this to your dedicated private response spreadsheet when installing a new copy.
const SHEET_ID = 'YOUR_SURVEY_A_SPREADSHEET_ID';
const VERSION = 'music-healing-survey-a/v2';
const KEYS = ['age','gender','culture','status','listen_min','stress_frequency','stress_genre','purpose','genre_like','stress_week'];
const HEADERS = ['id','received_at','submitted_at','language','schema','consent'].concat(KEYS);
const DETAIL_LIMITS = {participant_name:100, feedback:1000};
const DETAIL_KEYS = Object.keys(DETAIL_LIMITS);
const CHOICES = {
  gender: ['female','male','nonbinary','other','na'],
  culture: ['vn','kr','cn','mn','mm','np','other','na'],
  status: ['student','work','both','neither','other'],
  stress_frequency: ['never','rarely','sometimes','often','always','no_stress'],
  stress_genre: ['pop','ballad','classical_piano','lofi_ambient','rock_metal','hiphop_rnb','traditional','other','none'],
  purpose: ['destress','study_work','sleep','commute','entertain','other','none']
};
const LIMITS = {age:[18,65],listen_min:[0,1440],genre_like:[0,10],stress_week:[0,10]};
const PREVIOUS_MAX_AGE = 120;
const AGE_BANDS = [[18,24],[25,34],[35,44],[45,54],[55,64],[65,PREVIOUS_MAX_AGE]];

function workbook_() { return SpreadsheetApp.openById(SHEET_ID); }

function setup() {
  const book = workbook_();
  const responseTab = book.getSheetByName('Responses');
  if (!responseTab || String(responseTab.getRange(1,1,1,HEADERS.length).getValues()[0]) !== String(HEADERS))
    throw new Error('Expected the Survey A response headers.');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { ensureDetailColumns_(responseTab); }
  finally { lock.releaseLock(); }
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('ADMIN_KEY')) {
    const key = Utilities.getUuid() + Utilities.getUuid();
    const tab = book.getSheetByName('Admin access') || book.insertSheet('Admin access');
    tab.getRange('A1:A3').setValues([['관리자 접속 키 / Admin access key'],[key],['https://jungpookshi-gif.github.io/music-healing-survey-a/admin/']]);
    tab.setColumnWidth(1,590);
    properties.setProperty('ADMIN_KEY', key);
  }
}
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return json_({service:VERSION, detailsSupported:true, ageRange:LIMITS.age, ageGenreAvailable:true, pairedStressAvailable:true}); }
function validate_(data, maxAge = LIMITS.age[1]) {
  if (!data || data.schema !== VERSION || data.consent !== true ||
      !['vi','ko','en','zh','mn'].includes(data.language) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id) ||
      typeof data.submittedAt !== 'string' || !Number.isFinite(Date.parse(data.submittedAt))) throw Error('invalid');
  const a = data.answers;
  if (!a || typeof a !== 'object' || Object.keys(a).some(k => !KEYS.includes(k))) throw Error('invalid');
  const optional = ['status','listen_min','purpose'];
  if (a.stress_genre === 'none') optional.push('genre_like');
  for (const k of KEYS) {
    if (a[k] === null || a[k] === undefined) {
      if (!optional.includes(k)) throw Error('missing');
      continue;
    }
    if (CHOICES[k] && !CHOICES[k].includes(a[k])) throw Error('choice');
    if (LIMITS[k] && (!Number.isInteger(a[k]) || a[k]<LIMITS[k][0] || a[k]>(k === 'age' ? maxAge : LIMITS[k][1]))) throw Error('range');
  }
  if (['never','no_stress'].includes(a.stress_frequency) !== (a.stress_genre === 'none') ||
      (a.stress_genre === 'none' && a.genre_like != null)) throw Error('inapplicable');
  const details = data.details;
  if (details === undefined) return;
  if (!details || typeof details !== 'object' || Array.isArray(details) ||
      Object.keys(details).some(k => !DETAIL_KEYS.includes(k) ||
        typeof details[k] !== 'string' || details[k].length > DETAIL_LIMITS[k])) throw Error('details');
}

function ensureDetailColumns_(tab) {
  const first = HEADERS.length + 1;
  const needed = HEADERS.length + DETAIL_KEYS.length - tab.getMaxColumns();
  if (needed > 0) tab.insertColumnsAfter(tab.getMaxColumns(), needed);
  const range = tab.getRange(1, first, 1, DETAIL_KEYS.length);
  const current = range.getValues()[0];
  if (DETAIL_KEYS.every((key, index) => current[index] === key)) return;
  if (current.some((key, index) => key !== '' && key !== DETAIL_KEYS[index]))
    throw Error('Unexpected Survey A detail headers.');
  tab.getRange(2, first, tab.getMaxRows() - 1, DETAIL_KEYS.length).setNumberFormat('@');
  range.setValues([DETAIL_KEYS]);
}

function detailText_(value) {
  const text = value ? value.trim() : '';
  // Keep entries that look like formulas as text in Sheets.
  return /^[=+\-@']/.test(text) ? "'" + text : text;
}

function store_(data) {
  // Accept retries of responses already saved under the former age limit.
  validate_(data, PREVIOUS_MAX_AGE);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const tab = workbook_().getSheetByName('Responses');
    ensureDetailColumns_(tab);
    const last = tab.getLastRow();
    const existing = last > 1 && tab.getRange(2,1,last-1,1).createTextFinder(data.id).matchEntireCell(true).findNext();
    if (existing) {
      const stored = tab.getRange(existing.getRow(), HEADERS.length + 1, 1, DETAIL_KEYS.length).getValues()[0];
      const detailsSaved = DETAIL_KEYS.every((key, index) => {
        const expected = data.details?.[key]?.trim() ?? '';
        return stored[index] === expected || stored[index] === detailText_(expected);
      });
      return {ok:true,id:data.id,detailsSaved};
    }
    if (data.answers.age > LIMITS.age[1]) return {ok:false,error:'age'};
    const values = KEYS.map(k => data.answers[k] == null ? '' : data.answers[k]);
    const details = DETAIL_KEYS.map(k => detailText_(data.details?.[k]));
    tab.appendRow([data.id,new Date().toISOString(),new Date(data.submittedAt).toISOString(),data.language,VERSION,true].concat(values,details));
    SpreadsheetApp.flush();
    return {ok:true,id:data.id,detailsSaved:true};
  } finally { lock.releaseLock(); }
}

function summarize_(key) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!expected || key !== expected) return {ok:false,error:'access'};
  const tab = workbook_().getSheetByName('Responses');
  const rows = tab.getDataRange().getValues().slice(1).filter(row => row[4] === VERSION && row[5] === true);
  const counts = {};
  for (const k of KEYS) counts[k] = {};
  const stressByFrequency = {};
  const ageGenre = {};
  const minutesStress = {};
  const genreStress = {};
  const genreProfile = {};
  for (const row of rows) {
    for (let j=0;j<KEYS.length;j++) {
      const value = row[6+j], column = counts[KEYS[j]];
      if (value !== '' && value != null) column[value] = (column[value] || 0)+1;
    }
    const freq = row[11], stress = row[15];
    if (Number.isInteger(stress)) {
      const group = stressByFrequency[freq] || {n:0,sum:0};
      group.n++; group.sum+=stress; stressByFrequency[freq]=group;
    }
    const age = row[6], minutes = row[10], genre = row[12], liking = row[14];
    const hasGenre = genre !== 'none' && CHOICES.stress_genre.includes(genre);
    if (Number.isInteger(stress) && stress >= 0 && stress <= 10) {
      if (Number.isInteger(minutes) && minutes >= 0 && minutes <= 1440) {
        const scores = minutesStress[minutes] || (minutesStress[minutes] = {});
        scores[stress] = (scores[stress] || 0) + 1;
      }
      if (hasGenre) {
        const scores = genreStress[genre] || (genreStress[genre] = {});
        scores[stress] = (scores[stress] || 0) + 1;
        if (Number.isInteger(liking) && liking >= 0 && liking <= 10) {
          const profile = genreProfile[genre] || (genreProfile[genre] = {liking:{},stress:{}});
          profile.liking[liking] = (profile.liking[liking] || 0) + 1;
          profile.stress[stress] = (profile.stress[stress] || 0) + 1;
        }
      }
    }
    if (Number.isInteger(age) && hasGenre) {
      const band = AGE_BANDS.find(([low,high]) => age >= low && age <= high);
      if (band) {
        const genres = ageGenre[band[0]] || (ageGenre[band[0]] = {});
        genres[genre] = (genres[genre] || 0) + 1;
      }
    }
  }
  return {ok:true,total:rows.length,counts:counts,stressByFrequency:stressByFrequency,ageGenre:ageGenre,minutesStress:minutesStress,genreStress:genreStress,genreProfile:genreProfile};
}
function doPost(e) {
  try {
    if (!e || !e.parameter) return json_({ok:false,error:'request'});
    if (e.parameter.action === 'summary') return json_(summarize_(e.parameter.key));
    const raw = e.parameter.payload;
    if (!raw || raw.length>8000) return json_({ok:false,error:'size'});
    return json_(store_(JSON.parse(raw)));
  } catch (_) { return json_({ok:false,error:'request'}); }
}
