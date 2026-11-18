import test from 'node:test';
import assert from 'node:assert/strict';
import {fields} from '../schema.js';
import {validAnswer,VERSION} from '../logic.js';
import {fromCsv,mean,parseCsv} from '../admin/analysis.js';
import {distributionStats,scatterStats} from '../admin/relationship-analysis.js';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const header='id,received_at,submitted_at,language,schema,consent,'+fields.map(f=>f.key).join(',');
const sample='abc,,,ko,'+VERSION+',TRUE,24,na,kr,,0,never,none,,,0';
const listeningRows = [
 ['one','','','vi',VERSION,true,24,'na','vn','',30,'often','pop','',8,6],
 ['two','','','vi',VERSION,true,25,'na','vn','',15,'sometimes','ballad','',5,8],
 ['three','','','vi',VERSION,true,72,'na','vn','',0,'often','pop','',0,0],
 ['four','','','vi',VERSION,true,35,'na','vn','','','no_stress','none','','',0]
];
const listeningCsv = [header,...listeningRows.map(row=>row.join(','))].join('\n');
test('CSV excludes old versions and duplicates, counts zero and conditional missing correctly',()=>{
 const {summary,excluded}=fromCsv([header,sample,sample,sample.replace('abc','old').replace('/v2','/v1')].join('\r\n'));
 assert.equal(summary.total,1);assert.equal(excluded,2);assert.equal(mean(summary.counts.stress_week),0);
 assert.equal(mean(summary.counts.genre_like),null);assert.deepEqual(summary.stressByFrequency.never,{n:1,sum:0});
 assert.equal(fromCsv(header).summary.total,0);assert.throws(()=>fromCsv('x,y\n1,2'));assert.deepEqual(parseCsv('"a,b","c""d"'),[['a,b','c"d']]);
});
test('earlier responses over age 65 remain in CSV analysis', () => {
 const {summary,excluded} = fromCsv(header+'\n'+sample.replace(',24,',',72,'));
 assert.equal(summary.counts.age[72],1);
 assert.equal(excluded,0);
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

test('joint chart counts pair answers within the same response in both data sources', () => {
 const rows=[header.split(','),...listeningRows];
 const env={PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'fixture-only'})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>rows})})})}};
 vm.createContext(env);
 vm.runInContext(readFileSync(new URL('../backend/Code.gs',import.meta.url),'utf8'),env);
 const frontend=fromCsv(listeningCsv).summary;
 assert.deepEqual(frontend.ageGenre,{18:{pop:1},25:{ballad:1},65:{pop:1}});
 assert.deepEqual(frontend.minutesStress,{0:{0:1},15:{8:1},30:{6:1}});
 assert.deepEqual(frontend.genreStress,{pop:{0:1,6:1},ballad:{8:1}});
 assert.deepEqual(JSON.parse(JSON.stringify(env.summarize_('fixture-only'))),frontend);
});

test('joint chart statistics retain repeated coordinates, rank ties, and boxplot outliers', () => {
 const paired=scatterStats({0:{0:2},15:{4:1},30:{10:2}});
 assert.equal(paired.n,5);
 assert.equal(paired.points.length,3);
 assert.equal(paired.rho,1);
 assert.equal(scatterStats({0:{0:3,5:2}}).rho,null);
 assert.equal(scatterStats({0:{10:2},15:{4:1},30:{0:2}}).rho,-1);
 const box=distributionStats({0:1,5:3,6:3,10:1});
 assert.deepEqual([box.q1,box.median,box.q3,box.lowerWhisker,box.upperWhisker],[5,5.5,6,5,6]);
});

test('collector preserves old rows and stores optional details once, outside aggregates', () => {
 const headers = [...header.split(','),'',''];
 const priorId = 'ab60fbc1-7377-4161-9bd7-bcec46df2b25';
 const rows = [headers,[priorId,'','','ko',VERSION,true,72,'na','kr','',0,'never','none','','',0]];
 const tab = {
   getLastRow: () => rows.length,
   getMaxColumns: () => headers.length,
   getMaxRows: () => 100,
   getDataRange: () => ({getValues: () => rows}),
   getRange(row, column, _height, width) {
     return {
       getValues: () => [Array.from({length:width},(_,i)=>rows[row-1][column-1+i]??'')],
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
 const upperBoundary = {...payload.answers,age:65};
 assert.doesNotThrow(() => env.validate_({...payload,answers:upperBoundary}));
 assert.throws(() => env.validate_({...payload,answers:{...payload.answers,age:17}}));
 assert.throws(() => env.validate_({...payload,answers:{...payload.answers,age:66}}));
 const pastAge = {...payload.answers,age:72};
 assert.equal(env.store_({...payload,id:priorId,answers:pastAge,details:{}}).detailsSaved,true);
 const blocked = env.store_({...payload,id:'aa442c28-d60f-428a-aab5-05f026c8fe05',answers:pastAge});
 assert.equal(blocked.ok,false);
 assert.equal(blocked.error,'age');
 assert.equal(rows.length,3);
 assert.throws(() => env.validate_({...payload, details:{feedback:'a'.repeat(1001)}}));
 assert.throws(() => env.validate_({...payload, details:{email:'unrequested'}}));
 const summary = env.summarize_('fixture-only');
 assert.equal(summary.total,2);
 assert.equal(summary.counts.participant_name,undefined);
 assert.equal(summary.counts.feedback,undefined);
});

test('administrator dashboard requires a successful server password check and locks on sign-out', async t => {
 const elements = new Map();
 const makeElement = (tag) => ({
   tag,
   hidden:false, inert:false, value:'', textContent:'', style:{}, children:[],
   append(...children){ this.children.push(...children); },
   replaceChildren(...children){ this.children=children; },
   setAttribute(){}, focus(){ this.focused=true; }
 });
 const element = id => {
   if(!elements.has(id)) elements.set(id,makeElement());
   return elements.get(id);
 };
 const environment = {
   document:{documentElement:{},getElementById:element,createElement:makeElement,createElementNS:(_ns,tag)=>makeElement(tag),querySelectorAll:()=>[]},
   location:{href:'https://example.test/admin/?lang=en'},
   window:{SURVEY_CONFIG:{endpoint:'https://script.google.com/macros/s/fixture/exec'},addEventListener(){}},
   fetch:async (_url,{body}) => {
     assert.equal(body.get('action'),'summary');
     const valid = body.get('key')==='test-password';
     const result = valid ? fromCsv(listeningCsv).summary : {ok:false,error:'access'};
     if(valid) for (const key of ['ageGenre','minutesStress','genreStress']) delete result[key];
     return {ok:true,json:async()=>result};
   }
 };
 for(const [key,value] of Object.entries(environment)) {
   const original=Object.getOwnPropertyDescriptor(globalThis,key);
   Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
   t.after(()=>original?Object.defineProperty(globalThis,key,original):delete globalThis[key]);
 }
 await import('../admin/dashboard.js');
 assert.equal(element('dashboard').hidden,true);
 assert.equal(element('dashboard').inert,true);
 assert.equal(element('kpis').children.length,0);
 assert.equal(element('charts').children.length,0);
 assert.equal(element('table-body').children.length,0);
 assert.equal(element('login-panel').hidden,false);
 await element('csv').onchange({target:{files:[{text(){assert.fail('CSV processing is locked before login');}}]}});
 const submit = key => {
   element('key').value=key;
   return element('login').onsubmit({preventDefault(){}});
 };
 await submit('wrong');
 assert.equal(element('dashboard').hidden,true);
 assert.equal(element('login-status').textContent,'Incorrect administrator password.');
 assert.equal(element('key').value,'');
 await submit('test-password');
 assert.equal(element('dashboard').hidden,false);
 assert.equal(element('dashboard').inert,false);
 assert.equal(element('login-panel').hidden,true);
 assert.equal(element('kpis').children.length,3);
 const charts=element('charts');
 assert.equal(charts.children.length,6);
 assert.equal(charts.children[0].children[0].textContent,'Genres listened to when stressed');
 const plotCard = card => card.children.find(child=>child.className==='chart-frame');
 assert.ok(charts.children.slice(0,4).every(card=>plotCard(card)?.children[0].tag==='svg'));
 assert.equal(plotCard(charts.children[4]),undefined);
 assert.equal(plotCard(charts.children[5]),undefined);
 assert.equal(element('table-body').children.length,fields.length);
 await element('csv').onchange({target:{files:[{text:async()=>listeningCsv}]}});
 assert.equal(charts.children.length,6);
 assert.equal(charts.children[0].children[0].textContent,'Age group × genre listened to when stressed');
 assert.equal(charts.children[0].children.find(child=>child.className==='insight').textContent,'3 cells tie for the largest count at 1 each, out of 3 genre answers.');
 assert.equal(charts.children[4].children[0].textContent,'Listening time × stress score');
 assert.equal(charts.children[5].children[0].textContent,'Stress scores by music genre');
 for(const card of charts.children) {
   assert.equal(plotCard(card).children[0].tag,'svg');
   const report=card.children.find(child=>child.className==='chart-report');
   const copy=report.children[1].children.map(p=>p.textContent).join(' ');
   assert.ok((copy.match(/\p{L}+/gu) ?? []).length>=300,card.children[0].textContent);
 }
 assert.equal(element('key').value,'');
 element('sign-out').onclick();
 assert.equal(element('dashboard').hidden,true);
 assert.equal(element('kpis').children.length,0);
 assert.equal(charts.children.length,0);
 assert.equal(element('table-body').children.length,0);
});
