import {fields,options} from './schema.js';
import {text} from './i18n.js';
import {validAnswer,makePayload,noStressListening} from './logic.js';
const langs=['vi','ko','en','zh'];
let lang=new URL(location.href).searchParams.get('lang')||'vi';if(!langs.includes(lang))lang='vi';
let step=-1,answers={},consent=false,receipt=false,result=null,paused=false;
const config=window.SURVEY_CONFIG||{};
const endpoint=typeof config.endpoint==='string'&&/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.endpoint)?config.endpoint:'';
const app=document.querySelector('#app');
try{const saved=JSON.parse(sessionStorage.getItem('mhs-a-v2')||'null');if(saved&&saved.consent){answers=saved.answers||{};consent=true;}}catch{}
const t=k=>text[k][langs.indexOf(lang)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function remember(){try{sessionStorage.setItem('mhs-a-v2',JSON.stringify({consent,answers}));}catch{}}
function setAnswer(key,value) {
  const oldGenre = answers.stress_genre;
  answers[key] = value;
  if (key === 'stress_frequency') {
    if (noStressListening(answers)) answers.stress_genre = 'none';
    else if (oldGenre === 'none') delete answers.stress_genre;
  }
  if (answers.stress_genre !== oldGenre || answers.stress_genre === 'none') delete answers.genre_like;
  remember();
}
function render(){
 const researchLink = document.querySelector('#research-link');
 researchLink.textContent = ['Quản trị','연구 관리자','Research admin','研究管理'][langs.indexOf(lang)];
 researchLink.href = './admin/?lang='+lang;
 document.documentElement.lang=lang;document.title=t('title')+' · Survey A';
 document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
 document.querySelector('#motion').textContent=t(paused?'resume':'motion');
 document.querySelector('.arm').style.transform=`rotate(${-19+Math.max(0,step)*2}deg)`;
 if(step===-1){app.innerHTML=`<div class="card"><div class="eyebrow">${t('tag')}</div><h1>${t('studyTitle')}</h1><p>${t('desc')}</p><p class="help">${t('privacy')}</p><div class="notice">${t(endpoint?'online':'offline')}</div><label class="consent"><input id="consent" type="checkbox" ${consent?'checked':''}><span>${t('consent')}</span></label><button id="start" class="primary" ${consent?'':'disabled'}>${t('start')} →</button></div>`;document.querySelector('#consent').onchange=e=>{consent=e.target.checked;if(!consent){try{sessionStorage.removeItem('mhs-a-v2')}catch{}}else remember();document.querySelector('#start').disabled=!consent;};document.querySelector('#start').onclick=()=>{step=0;render();};return;}
 if(step===10){renderDone();return;}
 const f=fields[step],v=answers[f.key],special=f.key==='genre_like'&&answers.stress_genre==='none',required=f.required&&!special;
 app.innerHTML=`<div class="card"><div class="meta"><span>${f.code} · ${t('track')} ${step+1} / 10</span><span class="badge">${t(required?'required':'optional')}</span></div><h2 id="question">${esc(f.label[langs.indexOf(lang)])}</h2><div id="control"></div><p id="error" role="alert"></p><div class="actions"><button id="back" class="secondary">← ${t('back')}</button><button id="next" class="primary">${step===9?t(endpoint?'submit':'finish'):t('next')} →</button></div></div>`;
 const c=document.querySelector('#control');
 if (noStressListening(answers) && ['stress_genre','genre_like'].includes(f.key)) {
   c.textContent = t('inapp');
   app.querySelector('.badge').hidden = true;
 } else if(f.type==='choice'){c.innerHTML=`<div class="choices" role="radiogroup" aria-labelledby="question">${options[f.options].filter(o=>f.key!=='stress_genre'||o[0]!=='none').map(o=>`<label class="choice"><input type="radio" name="answer" value="${o[0]}" ${v===o[0]?'checked':''}><span>${esc(o[langs.indexOf(lang)+1])}</span></label>`).join('')}</div>`;c.querySelectorAll('input').forEach(i=>i.onchange=()=>setAnswer(f.key,i.value));}
 else if(f.type==='number'){c.innerHTML=`<input id="answer" aria-labelledby="question" type="number" inputmode="numeric" min="${f.key==='age'?18:0}" max="${f.key==='age'?120:1440}" step="1" value="${v??''}"><p class="help">${t(f.key==='age'?'ageHint':'listenHint')}</p>`;c.querySelector('input').oninput=e=>setAnswer(f.key,e.target.value===''?null:Number(e.target.value));}
 else{c.innerHTML=`<div class="scale-value"><output id="rating">${Number.isInteger(v)?v:'—'}</output><small> / 10</small></div><input id="range" type="range" min="0" max="10" step="1" value="${Number.isInteger(v)?v:5}" aria-labelledby="question" aria-valuetext="${Number.isInteger(v)?v:t('unanswered')}"><div class="ticks">${Array.from({length:11},(_,i)=>`<span>${i}</span>`).join('')}</div><div class="endpoints"><span>${t(f.key==='genre_like'?'lowlike':'lowstress')}</span><span>${t(f.key==='genre_like'?'highlike':'highstress')}</span></div><input id="numeric" type="number" min="0" max="10" step="1" aria-labelledby="question" value="${v??''}"><p class="help">${t('scalehelp')}</p>${special?`<p class="help">${t('notapp')}</p>`:''}`;
 const range=c.querySelector('#range'),num=c.querySelector('#numeric');function rating(n){setAnswer(f.key,n);c.querySelector('#rating').textContent=n??'—';range.setAttribute('aria-valuetext',n===null?t('unanswered'):String(n));}range.onpointerup=()=>{num.value=range.value;rating(Number(range.value));};range.oninput=()=>{num.value=range.value;rating(Number(range.value));};num.oninput=()=>{const n=num.value===''?null:Number(num.value);rating(n);if(n!==null&&n>=0&&n<=10)range.value=n;};}
 if(!required && !special){const skip=document.createElement('button');skip.className='quiet';skip.textContent=t('skip');skip.onclick=()=>{delete answers[f.key];remember();advance();};c.append(skip);}
 document.querySelector('#back').onclick=()=>{step--;render();};document.querySelector('#next').onclick=()=>{if(!validAnswer(f,answers)){document.querySelector('#error').textContent=t(f.type==='number'?'number':'choose');return;}advance();};
}
async function advance(){if(step<9){step++;render();return;}if(!fields.every(f=>validAnswer(f,answers))){step=fields.findIndex(f=>!validAnswer(f,answers));render();return;}
 if(!result)result=makePayload(answers,lang);else result={...result,language:lang,answers:{...answers}};
 if(endpoint){const button=document.querySelector('#next');button.disabled=true;try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);let res;try{res=await fetch(endpoint,{method:'POST',body:new URLSearchParams({payload:JSON.stringify(result)}),signal:controller.signal,redirect:'follow'});}finally{clearTimeout(timer);}const body=await res.json();if(!res.ok||body.ok!==true||body.id!==result.id)throw new Error('Unconfirmed');receipt=true;}catch{document.querySelector('#error').textContent=t('failed');button.disabled=false;let dl=document.querySelector('#backup');if(!dl){dl=document.createElement('button');dl.id='backup';dl.className='quiet';dl.textContent=t('download');dl.onclick=download;app.querySelector('.card').append(dl);}return;}}
 step=10;try{sessionStorage.removeItem('mhs-a-v2');}catch{}render();}
function download(){const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='survey-a-'+result.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function renderDone(){app.innerHTML=`<div class="card"><div class="successmark">◎</div><div class="eyebrow">SURVEY A · COMPLETE</div><h1>${t('done')}</h1><div class="notice">${t(receipt?'sent':'localdone')}</div><div class="actions"><button class="secondary" id="edit">${t('edit')}</button><button class="primary" id="download">${t('download')}</button></div></div>`;document.querySelector('#download').onclick=download;document.querySelector('#edit').onclick=()=>{step=0;render();};if(receipt)document.querySelector('#edit').disabled=true;}
 document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url);render();});document.querySelector('#motion').onclick=()=>{paused=!paused;document.body.classList.toggle('paused',paused);document.querySelector('#motion').textContent=t(paused?'resume':'motion');};render();
