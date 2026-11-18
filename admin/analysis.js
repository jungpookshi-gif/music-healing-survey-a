import {fields,options} from '../schema.js';
import {VERSION,validAnswer} from '../logic.js';

export function emptySummary() {
  return {ok:true,total:0,counts:Object.fromEntries(fields.map(f=>[f.key,{}])),stressByFrequency:{}};
}

// CSV exported by Google Sheets. Quoted fields may contain commas or newlines.
export function parseCsv(text) {
  const rows=[];
  let row=[], field='', quoted=false;
  const source=text.replace(/^\uFEFF/,'');
  for(let i=0;i<source.length;i++) {
    const char=source[i];
    if(char==='"') {
      if(quoted && source[i+1]==='"') { field+='"'; i++; }
      else quoted=!quoted;
    } else if(char===',' && !quoted) {row.push(field);field='';}
    else if((char==='\n' || char==='\r') && !quoted) {
      if(char==='\r' && source[i+1]==='\n') i++;
      row.push(field);rows.push(row);row=[];field='';
    } else field+=char;
  }
  if(quoted) throw Error('csv');
  if(field!=='' || row.length) {row.push(field);rows.push(row);}
  return rows;
}

export function fromCsv(content) {
  const [header,...rows]=parseCsv(content);
  const keys=['id','schema','consent',...fields.map(f=>f.key)];
  if(!header || !keys.every(k=>header.includes(k)) || new Set(header).size!==header.length) throw Error('headers');
  const index=Object.fromEntries(header.map((value,i)=>[value,i]));
  const seen=new Set(),summary=emptySummary();
  let excluded=0;
  for(const row of rows) {
    if(row.every(value=>!value.trim())) continue;
    const read=k=>(row[index[k]]??'').trim();
    if(read('schema')!==VERSION || read('consent').toLowerCase()!=='true' || !read('id') || seen.has(read('id'))) {excluded++;continue;}
    const answers={};
    for(const field of fields) {
      const value=read(field.key);
      if(value!=='') answers[field.key]=field.type==='choice'?value:Number(value);
    }
    if(!fields.every(f=>validAnswer(f,answers))) {excluded++;continue;}
    seen.add(read('id'));
    summary.total++;
    for(const [key,value] of Object.entries(answers)) {
      const counts=summary.counts[key];
      counts[value]=(counts[value]||0)+1;
    }
    const group=summary.stressByFrequency[answers.stress_frequency]??={n:0,sum:0};
    group.n++;group.sum+=answers.stress_week;
  }
  return {summary,excluded};
}

export function mean(counts) {
  const entries=Object.entries(counts);
  const n=entries.reduce((sum,[,count])=>sum+count,0);
  return n?entries.reduce((sum,[value,count])=>sum+Number(value)*count,0)/n:null;
}

export function barsFor(field,counts,langIndex) {
  if(field.type==='choice') return options[field.options].map(o=>({label:o[langIndex+1],value:counts[o[0]]||0}));
  if(field.type==='scale') return Array.from({length:11},(_,i)=>({label:String(i),value:counts[i]||0}));
  const breaks=field.key==='age'?[[18,24],[25,34],[35,44],[45,54],[55,64],[65,120]]:[[0,0],[1,29],[30,59],[60,119],[120,239],[240,1440]];
  return breaks.map(([low,high])=>({
    label:low===high?String(low):low+'–'+high,
    value:Object.entries(counts).reduce((sum,[k,n])=>sum+(Number(k)>=low&&Number(k)<=high?n:0),0)
  }));
}
