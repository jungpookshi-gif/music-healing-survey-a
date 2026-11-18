import {connectSurveyShare, loadKakaoShare, surveyInviteUrl} from '../sharing.js';
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

function shareControls() {
  const nodes = {
    '#share-survey': {setAttribute(name,value){this[name]=value;}},
    '#share-platforms': {hidden:true}, '#share-other-apps': {hidden:true},
    '#share-kakao': {}, '#share-facebook': {}, '#share-whatsapp': {}, '#share-line': {}, '#share-status': {}
  };
  return {nodes, section:{querySelector:selector=>nodes[selector]}};
}

test('the share button presents platforms and the system picker receives only the public URL', async () => {
  const {nodes,section}=shareControls();
  const url='https://example.test/survey/?lang=vi';
  let shared;
  connectSurveyShare(section,url,key=>key,{device:{share:async data=>{shared=data;}}});
  assert.equal(nodes['#share-platforms'].hidden,true);
  await nodes['#share-survey'].onclick();
  assert.equal(nodes['#share-platforms'].hidden,false);
  assert.equal(shared,undefined);
  assert.equal(nodes['#share-other-apps'].hidden,false);
  await nodes['#share-other-apps'].onclick();
  assert.deepEqual(shared,{url});
});

test('chat platform links work even when a device share picker is unavailable', async () => {
  const url='https://example.test/survey/?lang=ko';
  const clipboard={writeText(){assert.fail('Sharing must never copy');}};
  for (const device of [
    {clipboard},
    {clipboard,share:async()=>{throw new DOMException('No targets','AbortError');}}
  ]) {
    const {nodes,section}=shareControls();
    connectSurveyShare(section,url,key=>key,{device});
    await nodes['#share-survey'].onclick();
    assert.equal(nodes['#share-platforms'].hidden,false);
    assert.equal(nodes['#share-survey']['aria-expanded'],'true');
    await nodes['#share-kakao'].onclick();
    assert.equal(nodes['#share-status'].textContent,'shareKakaoUnavailable');
    const facebook=new URL(nodes['#share-facebook'].href);
    assert.equal(facebook.origin+facebook.pathname,'https://www.facebook.com/sharer/sharer.php');
    assert.equal(facebook.searchParams.get('u'),url);
    const whatsapp=new URL(nodes['#share-whatsapp'].href);
    assert.equal(whatsapp.origin,'https://wa.me');
    assert.equal(whatsapp.searchParams.get('text'),url);
    const line=new URL(nodes['#share-line'].href);
    assert.equal(line.origin+line.pathname,'https://line.me/R/share');
    assert.equal(line.searchParams.get('text'),url);
  }
});

test('KakaoTalk uses the device picker when the SDK is not configured', async () => {
  const {nodes,section}=shareControls();
  const url='https://example.test/survey/?lang=vi';
  let shared;
  connectSurveyShare(section,url,key=>key,{device:{share:data=>{shared=data;}}});
  await nodes['#share-kakao'].onclick();
  assert.deepEqual(shared,{url});
  assert.equal(nodes['#share-status'].textContent,'shareKakaoChoose');
});

test('configured Kakao SDK passes the public URL to the KakaoTalk recipient picker', async () => {
  const url='https://example.test/survey/?lang=mn';
  let script, key, request;
  const browser={
    document:{createElement:()=>({}),head:{append(element){script=element;}}},
    Kakao:{
      isInitialized:()=>Boolean(key),
      init(value){key=value;},
      Share:{sendScrap(payload){request=payload;}}
    }
  };
  assert.equal(await loadKakaoShare('',browser),null);
  assert.equal(script,undefined);
  const kakao=loadKakaoShare('browser-test-key',browser);
  const {nodes,section}=shareControls();
  connectSurveyShare(section,url,value=>value,{device:{},kakao});
  assert.equal(script.crossOrigin,'anonymous');
  script.onload();
  await kakao;
  await nodes['#share-survey'].onclick();
  await nodes['#share-kakao'].onclick();
  assert.equal(key,'browser-test-key');
  assert.deepEqual(request,{requestUrl:url});
});
