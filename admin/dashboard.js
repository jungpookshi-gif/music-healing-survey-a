import {fields,options} from '../schema.js';
import {fromCsv,mean,barsFor} from './analysis.js?v=4';
import {words,shortNames} from './labels.js';

const languages=['vi','ko','en','zh'];
const query=new URL(location.href);
let lang=languages.includes(query.searchParams.get('lang'))?query.searchParams.get('lang'):'vi';
let summary=null, source='', excluded=0, status='', sequence=0;
const configured=window.SURVEY_CONFIG?.endpoint || '';
const endpoint=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(configured)?configured:'';
const el=id=>document.getElementById(id);
const t=key=>words[key][languages.indexOf(lang)];
const number=(value,digits=0)=>new Intl.NumberFormat(lang,{maximumFractionDigits:digits}).format(value);
function node(tag,content,className) {
  const element=document.createElement(tag);
  if(content!==null) element.textContent=content;
  if(className) element.className=className;
  return element;
}
function bar(label,amount,maximum,caption) {
  const row=node('div',null,'bar-row');
  const line=node('div',null,'row-label');
  line.append(node('span',label),node('span',caption));
  const track=node('div',null,'track'),fill=node('div',null,'fill');
  track.setAttribute('aria-hidden','true');
  fill.style.width=(maximum?Math.min(100,amount/maximum*100):0)+'%';
  track.append(fill);row.append(line,track);
  return row;
}
function questionCard(field,i) {
  const card=node('article',null,'card');
  const heading=node('div',null,'chart-head');
  heading.append(node('h3',shortNames[i][languages.indexOf(lang)]),node('small',field.code));
  card.append(heading);
  if(!summary) {card.append(node('p',t('closed'),'meta'));return card;}
  const counts=summary.counts[field.key];
  const bars=barsFor(field,counts,languages.indexOf(lang));
  const n=bars.reduce((s,b)=>s+b.value,0);
  card.append(node('p',t('valid')+' '+number(n)+' · '+t('unavailable')+' '+number(summary.total-n),'meta'));
  if(!n){card.append(node('p',t('empty'),'insight'));return card;}
  const plot=node('div',null,'bars');
  for(const item of bars) plot.append(bar(item.label,item.value,n,number(item.value)+' · '+number(item.value/n*100,1)+'%'));
  const max=Math.max(...bars.map(b=>b.value));
  const leaders=bars.filter(b=>b.value===max);
  const lead=leaders.map(b=>b.label).join(' / ');
  const statement=(leaders.length===1?t('top'):t('tie'))+' · '+lead+' ('+number(max)+'/'+number(n)+', '+number(max/n*100,1)+'%).';
  let avg='';
  if(field.type!=='choice') {
    const units=field.type==='scale'?'/10':field.key==='age'?' '+t('ageUnit'):' '+t('minutesUnit');
    avg=' '+t('avg')+' '+number(mean(counts),1)+units+'.';
  }
  card.append(plot,node('p',statement+avg,'insight'));
  return card;
}
function render() {
  document.documentElement.lang=lang;
  document.title=t('workspace')+' · Survey A';
  for(const id of ['workspace','title','sub','connect','private','overall','clear','online']) el(id).textContent=t(id);
  el('key-label').textContent=t('key');el('file-label').textContent=t('file');
  el('connection-info').textContent=t(endpoint?'help':'pending');
  el('online').disabled=!endpoint||status==='loading';el('key').disabled=!endpoint;
  el('clear').hidden=!summary && status!=='loading';
  el('status').textContent=status?t(status):source?t(source)+(source==='local'?' · '+t('omitted')+' '+excluded:''):t('closed');
  document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  const kpis=el('kpis');kpis.replaceChildren();
  for(const [id,value] of [['total',summary?.total],['stress',summary?mean(summary.counts.stress_week):null],['minutes',summary?mean(summary.counts.listen_min):null]]) {
    const box=node('div',null,'kpi');
    box.append(node('small',t(id)),node('strong',value==null?'—':number(value,1),'value'));
    kpis.append(box);
  }
  const relation=el('relation');relation.replaceChildren(node('h2',t('compare')));
  if(summary?.total) {
    for(const option of options.stress_frequency) {
      const group=summary.stressByFrequency[option[0]];
      if(group?.n) relation.append(bar(option[languages.indexOf(lang)+1],group.sum/group.n,10,number(group.sum/group.n,1)+'/10 · n='+group.n));
    }
    relation.append(node('p',t('groupHelp'),'insight'));
  } else relation.append(node('p',t(summary?'zero':'closed'),'meta'));
  const sections=el('sections');sections.replaceChildren();
  for(const [label,indices] of [['freq',[4,5,6,7]],['ratings',[8,9]],['people',[0,1,2,3]]]) {
    const grid=node('div',null,'grid');
    for(const i of indices) grid.append(questionCard(fields[i],i));
    sections.append(node('h2',t(label),'section-title'),grid);
  }
}
function reset() {
  sequence++;summary=null;source='';excluded=0;status='';el('csv').value='';el('key').value='';render();
}
el('clear').onclick=reset;
el('login').onsubmit=async event=>{
  event.preventDefault();
  if(!endpoint)return;
  const key=el('key').value.trim();
  reset();
  const current=sequence,controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),25000);
  status='loading';render();
  try {
    const response=await fetch(endpoint,{method:'POST',body:new URLSearchParams({action:'summary',key}),cache:'no-store',signal:controller.signal});
    const value=await response.json();
    if(!response.ok || !value.ok || !Number.isInteger(value.total) || !value.counts) throw Error();
    if(sequence===current){summary=value;source='live';status='';}
  } catch {if(sequence===current) status='fail';}
  finally{clearTimeout(timer);render();}
};
el('csv').onchange=async event=>{
  const file=event.target.files[0];
  if(!file)return;
  reset();const current=sequence;
  try {
    const data=fromCsv(await file.text());
    if(sequence===current){summary=data.summary;excluded=data.excluded;source='local';}
  } catch {if(sequence===current) status='fail';}
  render();
};
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{
  lang=b.dataset.lang;query.searchParams.set('lang',lang);history.replaceState(null,'',query);render();
});
render();
