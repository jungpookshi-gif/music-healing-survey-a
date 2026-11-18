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

test('collector preserves old rows and stores optional details once, outside aggregates', () => {
 const headers = [...header.split(','),'',''];
 const rows = [headers,['old','','','ko',VERSION,true,24,'na','kr','',0,'never','none','','',0]];
 const tab = {
   getLastRow: () => rows.length,
   getMaxColumns: () => headers.length,
   getMaxRows: () => 100,
   getDataRange: () => ({getValues: () => rows}),
   getRange(row, column, _height, width) {
     return {
       getValues: () => [rows[row-1].slice(column-1,column-1+width)],
       setValues: ([values]) => values.forEach((value,i) => { rows[row-1][column-1+i] = value; }),
       setNumberFormat() {},
       createTextFinder(id) {
         return {matchEntireCell: () => ({findNext: () => {
           const index = rows.findIndex(entry => entry[0] === id);
           return index === -1 ? null : {getRow: () => index + 1};
         }})};
       }
     };
   },
   appendRow: row => rows.push(Array.from(row))
 };
 const env = {
   LockService: {getScriptLock: () => ({waitLock() {},releaseLock() {}})},
   PropertiesService: {getScriptProperties: () => ({getProperty: () => 'fixture-only'})},
   SpreadsheetApp: {openById: () => ({getSheetByName: () => tab}),flush() {}}
 };
 vm.createContext(env);
 vm.runInContext(readFileSync(new URL('../backend/Code.gs',import.meta.url),'utf8'),env);
 const payload = {
   id:'89e52cd3-8157-4ee1-82ca-1c65d64f667e', submittedAt:new Date().toISOString(),
   consent:true, language:'mn', schema:VERSION,
   answers:{age:24,gender:'na',culture:'mn',stress_frequency:'no_stress',stress_genre:'none',stress_week:0},
   details:{participant_name:' Сарнай ', feedback:'=1+1'}
 };
 assert.equal(env.store_(payload).detailsSaved,true);
 assert.deepEqual(headers.slice(-2),['participant_name','feedback']);
 assert.deepEqual(rows[2].slice(-2),['Сарнай',"'=1+1"]);
 assert.equal(rows[1].length,16);
 assert.equal(env.store_(payload).detailsSaved,true);
 assert.equal(env.store_({...payload, details:{feedback:'different'}}).detailsSaved,false);
 assert.equal(rows.length,3);
 assert.throws(() => env.validate_({...payload, details:{feedback:'a'.repeat(1001)}}));
 assert.throws(() => env.validate_({...payload, details:{email:'unrequested'}}));
 const summary = env.summarize_('fixture-only');
 assert.equal(summary.total,2);
 assert.equal(summary.counts.participant_name,undefined);
 assert.equal(summary.counts.feedback,undefined);
});
