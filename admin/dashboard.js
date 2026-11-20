import {fields} from '../schema.js?v=4';
import {initialLanguage, languages} from '../locale.js';
import {ageBands,fromCsv,mean,barsFor} from './analysis.js?v=7';
import {words,shortNames} from './labels.js?v=11';
import {renderCharts} from './charts.js?v=4';
import {renderGenreMap} from './genre-map.js?v=1';

const query=new URL(location.href);
let lang=initialLanguage(query.href);
let onlineSummary=null, summary=null, source='', excluded=0, status='', sequence=0;
let genreSnapshot=null;
const configured=window.SURVEY_CONFIG?.endpoint || '';
const endpoint=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(configured)?configured:'';
const el=id=>document.getElementById(id);
const t=(key,values)=>{
  const label=words[key][languages.indexOf(lang)];
  return values ? label.replace(/\{(\w+)\}/g, (_, name) => values[name]) : label;
};
const number=(value,digits=0)=>new Intl.NumberFormat(lang,{maximumFractionDigits:digits}).format(value);
function node(tag,content,className) {
  const element=document.createElement(tag);
  if(content!==null) element.textContent=content;
  if(className) element.className=className;
  return element;
}
function renderTable(langIndex) {
  const row=node('tr',null);
  for(const label of ['question','valid','unavailable','distribution']) {
    const cell=node('th',t(label));
    cell.setAttribute('scope','col');
    row.append(cell);
  }
  el('table-head').replaceChildren(row);
  const body=el('table-body');
  body.replaceChildren();
  fields.forEach((field,index)=>{
    const counts=summary.counts[field.key];
    const rows=barsFor(field,counts,langIndex).filter(item=>item.value);
    const answered=rows.reduce((n,item)=>n+item.value,0);
    const fieldName=node('th',null);
    fieldName.setAttribute('scope','row');
    fieldName.append(node('span',field.code,'field-code'),node('span',shortNames[index][langIndex]));
    const detail=node('td',answered ? null : '—');
    if(answered) {
      const disclosure=node('details',null);
      const breakdown=node('dl',null);
      for(const item of rows) breakdown.append(node('dt',item.label),node('dd',number(item.value)));
      disclosure.append(node('summary',t('distribution')),breakdown);
      detail.append(disclosure);
    }
    const line=node('tr',null);
    line.append(fieldName,node('td',number(answered),'table-value'),
      node('td',number(Math.max(0,summary.total-answered)),'table-value'),detail);
    body.append(line);
  });
}
function render() {
  document.documentElement.lang=lang==='zh'?'zh-Hans':lang;
  document.title=t('workspace')+' · Survey A';
  const signedIn = onlineSummary !== null;
  el('login-panel').hidden=signedIn;
  el('dashboard').hidden=!signedIn;
  el('dashboard').inert=!signedIn;
  el('sign-in-title').textContent=t('signIn');
  el('key-label').textContent=t('key');
  el('online').textContent=t('online');
  el('online').disabled=!endpoint||status==='loading';
  el('key').disabled=!endpoint||status==='loading';
  el('key').setAttribute('aria-invalid',String(status==='badPassword'));
  el('login-status').textContent=signedIn?'':!endpoint?t('pending'):status?t(status):'';
  document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  if (!signedIn) {
    for (const id of ['kpis','charts','table-head','table-body']) el(id).replaceChildren();
    renderGenreMap(el('genre-map'),null);
    el('study-scope').textContent='';
    return;
  }
  for (const id of ['workspace','title','sub','connect','private','overall','clear']) el(id).textContent=t(id);
  el('sign-out').textContent=t('signOut');
  el('file-label').textContent=t('file');
  el('charts-title').textContent=t('charts');
  el('table-title').textContent=t('table');
  el('table-note').textContent=t('tableCulture');
  el('clear').hidden=source!=='local';
  el('status').textContent=status?t(status):t(source)+(source==='local'?' · '+t('omitted')+' '+excluded:'');
  const kpis=el('kpis');kpis.replaceChildren();
  for(const [id,value] of [['total',summary?.total],['stress',summary?mean(summary.counts.stress_week):null],['minutes',summary?mean(summary.counts.listen_min):null]]) {
    const box=node('div',null,'kpi');
    box.append(node('small',t(id)),node('strong',value==null?'—':number(value,1),'value'));
    kpis.append(box);
  }
  const langIndex=languages.indexOf(lang);
  const [firstAge]=ageBands[0], [,lastAge]=ageBands.at(-1);
  const validAges=Object.entries(summary.counts.age).filter(([key])=>{
    const age=Number(key);
    return Number.isInteger(age)&&age>=firstAge&&age<=lastAge;
  });
  const ageTotal=validAges.reduce((sum,[,n])=>sum+n,0);
  const young=validAges.reduce((sum,[age,n])=>Number(age)<=34 ? sum+n : sum,0);
  el('study-scope').textContent=ageTotal
    ? `${t('studyScope')} ${t('ageProfile',{young:number(young),total:number(ageTotal),share:number(young/ageTotal*100,1)})}` : t('studyScope');
  renderGenreMap(el('genre-map'),summary,{langIndex,number,t,snapshot:genreSnapshot,onSnapshot:snapshot=>{
    genreSnapshot=snapshot;
    render();
  }});
  renderCharts(el('charts'),summary,{langIndex,reportLang:lang==='ko'?'ko':'vi',number,t});
  renderTable(langIndex);
}
function setOnlineView() {
  summary=onlineSummary;source='live';excluded=0;status='';
  el('csv').value='';
}

function lock() {
  sequence++;
  onlineSummary=null;
  genreSnapshot=null;
  setOnlineView();
  el('key').value='';
  render();
}

el('sign-out').onclick=()=>{
  lock();
  el('key').focus();
};
window.addEventListener('pagehide',lock);

el('clear').onclick=()=>{
  sequence++;
  setOnlineView();
  render();
};

el('login').onsubmit=async event=>{
  event.preventDefault();
  if(!endpoint||onlineSummary||status==='loading')return;
  const key=el('key').value.trim();
  el('key').value='';
  if(!key)return;
  const current=++sequence,controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),25000);
  status='loading';render();
  try {
    const response=await fetch(endpoint,{
      method:'POST',body:new URLSearchParams({action:'summary',key}),cache:'no-store',signal:controller.signal
    });
    const value=await response.json();
    if(sequence!==current)return;
    if(response.ok && value.ok===false && value.error==='access') {
      status='badPassword';
    } else if(response.ok && value.ok===true && Number.isInteger(value.total) &&
      value.stressByFrequency && fields.every(field=>value.counts?.[field.key])) {
      onlineSummary=value;
      setOnlineView();
    } else {
      status='loginFailed';
    }
  } catch {
    if(sequence===current)status='loginFailed';
  } finally {
    clearTimeout(timer);
    if(sequence===current) {
      render();
      if(onlineSummary)el('title').focus();
      else el('key').focus();
    }
  }
};

el('csv').onchange=async event=>{
  const file=event.target.files[0];
  if(!onlineSummary||!file)return;
  const current=++sequence;
  try {
    const data=fromCsv(await file.text());
    if(sequence!==current)return;
    summary=data.summary;excluded=data.excluded;source='local';status='';
  } catch {
    if(sequence===current)status='fail';
  }
  render();
};
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{
  lang=b.dataset.lang;query.searchParams.set('lang',lang);history.replaceState(null,'',query);render();
});
render();
