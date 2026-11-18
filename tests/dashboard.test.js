import test from 'node:test';
import assert from 'node:assert/strict';
import {fields} from '../schema.js';
import {validAnswer,VERSION} from '../logic.js';
import {fromCsv,mean,parseCsv} from '../admin/analysis.js';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const header='id,received_at,submitted_at,language,schema,consent,'+fields.map(f=>f.key).join(',');
const sample='abc,,,ko,'+VERSION+',TRUE,24,na,kr,,0,never,none,,,0';
test('CSV excludes old versions and duplicates, counts zero and conditional missing correctly',()=>{
 const {summary,excluded}=fromCsv([header,sample,sample,sample.replace('abc','old').replace('/v2','/v1')].join('\r\n'));
 assert.equal(summary.total,1);assert.equal(excluded,2);assert.equal(mean(summary.counts.stress_week),0);
 assert.equal(mean(summary.counts.genre_like),null);assert.deepEqual(summary.stressByFrequency.never,{n:1,sum:0});
 assert.equal(fromCsv(header).summary.total,0);assert.throws(()=>fromCsv('x,y\n1,2'));assert.deepEqual(parseCsv('"a,b","c""d"'),[['a,b','c"d']]);
});
test('revised questionnaire rejects contradictory skip patterns',()=>{
 const genre=fields.find(f=>f.key==='stress_genre'),like=fields.find(f=>f.key==='genre_like');
 assert.equal(validAnswer(genre,{stress_genre:'pop',stress_frequency:'no_stress'}),false);
 assert.equal(validAnswer(like,{stress_genre:'none',genre_like:5}),false);
});
test('server validates v2, denies unauthenticated statistics, and summarizes the same rows as CSV',()=>{
 const rows=[header.split(','),['abc','','','ko',VERSION,true,24,'na','kr','',0,'never','none','','',0]];
 const env={PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'fixture-only'})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>rows})})})}};
 vm.createContext(env);vm.runInContext(readFileSync(new URL('../backend/Code.gs',import.meta.url),'utf8'),env);
 assert.equal(env.summarize_('').ok,false);const frontend=fromCsv(header+'\n'+sample).summary;
 assert.deepEqual(JSON.parse(JSON.stringify(env.summarize_('fixture-only'))),frontend);
 const payload={id:'89e52cd3-8157-4ee1-82ca-1c65d64f667e',submittedAt:new Date().toISOString(),consent:true,language:'ko',schema:VERSION,
 answers:{age:24,gender:'na',culture:'kr',stress_frequency:'no_stress',stress_genre:'none',stress_week:0}};
 env.validate_(payload);assert.throws(()=>env.validate_({...payload,answers:{...payload.answers,genre_like:0}}));
});
