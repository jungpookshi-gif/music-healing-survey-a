import {connectSurveyShare, surveyInviteUrl} from '../sharing.js';
import test from 'node:test';import assert from 'node:assert/strict';import {fields,options} from '../schema.js';import {text} from '../i18n.js';import {validAnswer} from '../logic.js';
test('exactly ten substantive questions, all translated',()=>{assert.equal(fields.length,10);assert.equal(new Set(fields.map(f=>f.key)).size,10);fields.forEach(f=>assert.equal(f.label.length,5));Object.values(text).forEach(t=>assert.equal(t.length,5));Object.values(options).flat().forEach(o=>assert.equal(o.length,6));});
test('zero is valid, unanswered required scales are not',()=>{const f=fields.find(f=>f.key==='stress_week');assert.equal(validAnswer(f,{}),false);assert.equal(validAnswer(f,{stress_week:0}),true);for(const v of [-1,11,1.5,NaN])assert.equal(validAnswer(f,{stress_week:v}),false);});
test('numeric limits and non-listener conditional missing',()=>{const age=fields.find(f=>f.key==='age'),minutes=fields.find(f=>f.key==='listen_min'),like=fields.find(f=>f.key==='genre_like');assert.equal(validAnswer(age,{age:17}),false);assert.equal(validAnswer(age,{age:18}),true);assert.equal(validAnswer(minutes,{listen_min:1441}),false);assert.equal(validAnswer(minutes,{listen_min:0}),true);assert.equal(validAnswer(like,{stress_genre:'none'}),true);assert.equal(validAnswer(like,{stress_genre:'pop'}),false);});

test('the questionnaire accepts completed ages 18 through 65 inclusive', () => {
  const age = fields.find(field => field.key === 'age');
  for (const value of [18,65]) assert.equal(validAnswer(age,{age:value}),true);
  for (const value of [17,66,120,64.5,'65']) assert.equal(validAnswer(age,{age:value}),false);
});

test('the invitation link opens a fresh survey with only the chosen language', () => {
  const page = 'https://example.test/music-healing-survey-a/index.html?lang=vi&name=Test&response=fixture#done';
  assert.equal(surveyInviteUrl(page, 'ko'), 'https://example.test/music-healing-survey-a/?lang=ko');
});

test('mobile sharing uses the public URL and the same button copies when share is unavailable', async () => {
  const nodes = {
    '#share-survey': {}, '#copy-survey-link': {}, '#share-status': {},
    '#survey-link-wrap': {hidden:true}, '#survey-link': {}
  };
  const section = {querySelector: selector => nodes[selector]};
  const url = 'https://example.test/survey/?lang=vi';
  let shared, copied;
  connectSurveyShare(section, url, key => key, {
    canShare: () => true,
    share: async invitation => { shared = invitation; },
  });
  await nodes['#share-survey'].onclick();
  assert.deepEqual(shared, {url});

  connectSurveyShare(section, url, key => key, {
    clipboard:{writeText:async value => { copied = value; }}
  });
  assert.notEqual(nodes['#share-survey'].hidden, true);
  await nodes['#share-survey'].onclick();
  assert.equal(copied, url);
  assert.equal(nodes['#share-status'].textContent, 'linkCopied');
});

test('a blocked clipboard leaves a selectable survey link', async () => {
  const nodes = {
    '#share-survey': {}, '#copy-survey-link': {}, '#share-status': {},
    '#survey-link-wrap': {hidden:true}, '#survey-link': {focus(){},select(){this.selected = true;}}
  };
  const url = 'https://example.test/survey/?lang=mn';
  connectSurveyShare({querySelector: selector => nodes[selector]}, url, key => key, {});
  await nodes['#copy-survey-link'].onclick();
  assert.equal(nodes['#survey-link-wrap'].hidden, false);
  assert.equal(nodes['#survey-link'].value, url);
  assert.equal(nodes['#survey-link'].selected, true);
  assert.equal(nodes['#share-status'].textContent, 'copyManually');
});

test('an in-app browser that rejects sharing reveals the URL and still offers KakaoTalk copying', async () => {
  const nodes = {
    '#share-survey': {}, '#copy-survey-link': {}, '#share-status': {},
    '#survey-link-wrap': {hidden:true}, '#survey-link': {focus(){},select(){this.selected=true;}}
  };
  const url = 'https://example.test/survey/?lang=ko';
  const section = {querySelector: selector => nodes[selector],ownerDocument:{execCommand:action=>action==='copy'}};
  connectSurveyShare(section,url,key=>key,{
    canShare:()=>false,
    share:async ()=>{throw new DOMException('No targets','AbortError');},
    clipboard:{writeText:async ()=>{throw new DOMException('Clipboard blocked','NotAllowedError');}}
  });
  await nodes['#share-survey'].onclick();
  assert.equal(nodes['#survey-link-wrap'].hidden,false);
  assert.equal(nodes['#share-status'].textContent,'shareUseCopy');
  await nodes['#copy-survey-link'].onclick();
  assert.equal(nodes['#survey-link'].value,url);
  assert.equal(nodes['#survey-link'].selected,true);
  assert.equal(nodes['#share-status'].textContent,'linkCopied');
});
