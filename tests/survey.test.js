import test from 'node:test';import assert from 'node:assert/strict';import {fields,options} from '../schema.js';import {text} from '../i18n.js';import {validAnswer} from '../logic.js';
test('exactly ten substantive questions, all translated',()=>{assert.equal(fields.length,10);assert.equal(new Set(fields.map(f=>f.key)).size,10);fields.forEach(f=>assert.equal(f.label.length,5));Object.values(text).forEach(t=>assert.equal(t.length,5));Object.values(options).flat().forEach(o=>assert.equal(o.length,6));});
test('zero is valid, unanswered required scales are not',()=>{const f=fields.find(f=>f.key==='stress_week');assert.equal(validAnswer(f,{}),false);assert.equal(validAnswer(f,{stress_week:0}),true);for(const v of [-1,11,1.5,NaN])assert.equal(validAnswer(f,{stress_week:v}),false);});
test('numeric limits and non-listener conditional missing',()=>{const age=fields.find(f=>f.key==='age'),minutes=fields.find(f=>f.key==='listen_min'),like=fields.find(f=>f.key==='genre_like');assert.equal(validAnswer(age,{age:17}),false);assert.equal(validAnswer(age,{age:18}),true);assert.equal(validAnswer(minutes,{listen_min:1441}),false);assert.equal(validAnswer(minutes,{listen_min:0}),true);assert.equal(validAnswer(like,{stress_genre:'none'}),true);assert.equal(validAnswer(like,{stress_genre:'pop'}),false);});

test('the questionnaire accepts completed ages 18 through 65 inclusive', () => {
  const age = fields.find(field => field.key === 'age');
  for (const value of [18,65]) assert.equal(validAnswer(age,{age:value}),true);
  for (const value of [17,66,120,64.5,'65']) assert.equal(validAnswer(age,{age:value}),false);
});
