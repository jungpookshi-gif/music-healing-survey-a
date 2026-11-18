import {connectSurveyShare, loadKakaoShare, surveyInviteUrl, surveyShareSection} from '../sharing.js';
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
    '#share-kakao': {}, '#share-messenger': {}, '#share-status': {},
    '#share-browser-links': {hidden:true}, '#share-open-chrome': {hidden:true}, '#share-open-browser': {}
  };
  return {nodes, section:{querySelector:selector=>nodes[selector]}};
}

test('Messenger calls the system picker immediately with only the public URL', async () => {
  const {nodes,section}=shareControls();
  const url='https://example.test/survey/?lang=vi';
  let shared;
  connectSurveyShare(section,url,key=>key,{device:{share:async data=>{shared=data;}}});
  const sharing=nodes['#share-messenger'].onclick();
  assert.deepEqual(shared,{url});
  await sharing;
  assert.equal(nodes['#share-status'].textContent,'shareMessengerChoose');
});

test('blocked sharing offers a separate page that remembers the selected app and language', async () => {
  const url='https://example.test/survey/?lang=ko';
  const clipboard={writeText(){assert.fail('Sharing must never copy');}};
  for (const device of [
    {clipboard},
    {clipboard,share:async()=>{throw new DOMException('Sharing blocked','NotAllowedError');}}
  ]) {
    const {nodes,section}=shareControls();
    connectSurveyShare(section,url,key=>key,{device});
    const recovery=nodes['#share-open-browser'];
    await nodes['#share-messenger'].onclick();
    assert.equal(nodes['#share-status'].textContent,'shareBrowserHelp');
    assert.equal(nodes['#share-browser-links'].hidden,false);
    assert.equal(nodes['#share-open-chrome'].hidden,true);
    assert.equal(recovery.href,'https://example.test/survey/share.html?lang=ko&app=messenger');
    await nodes['#share-kakao'].onclick();
    assert.equal(recovery.href,'https://example.test/survey/share.html?lang=ko&app=kakao');
  }
});

test('Android recovery opens Chrome using a fallback with only the language and selected app', async () => {
  const {nodes,section}=shareControls();
  const url='https://example.test/survey/?lang=vi&response=private#done';
  connectSurveyShare(section,url,key=>key,{device:{userAgent:'Mozilla/5.0 (Linux; Android 14)'}});
  await nodes['#share-kakao'].onclick();
  const fallback='https://example.test/survey/share.html?lang=vi&app=kakao';
  const recovery=nodes['#share-open-chrome'];
  assert.equal(recovery.hidden,false);
  assert.equal(recovery.href,`intent://example.test/survey/share.html?lang=vi&app=kakao#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(fallback)};end`);
  assert.equal(nodes['#share-open-browser'].href,fallback);
});

test('the separate sharing page has the correct app button and cannot link to itself on failure', async () => {
  const {nodes,section}=shareControls();
  const markup=surveyShareSection(value=>value,'messenger');
  assert.match(markup,/id="share-kakao" hidden/);
  assert.match(markup,/id="share-messenger">Facebook Messenger/);
  connectSurveyShare(section,'https://example.test/survey/',key=>key,{device:{},offerBrowser:false});
  await nodes['#share-messenger'].onclick();
  assert.equal(nodes['#share-browser-links'].hidden,true);
  assert.equal(nodes['#share-status'].textContent,'shareAppsUnavailable');
});

test('dismissing the phone share menu clears the sharing prompt', async () => {
  const {nodes,section}=shareControls();
  connectSurveyShare(section,'https://example.test/survey/',key=>key,{
    device:{share:async()=>{throw new DOMException('Cancelled','AbortError');}}
  });
  await nodes['#share-messenger'].onclick();
  assert.equal(nodes['#share-status'].textContent,'');
  assert.equal(nodes['#share-browser-links'].hidden,true);
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
  await nodes['#share-kakao'].onclick();
  assert.equal(key,'browser-test-key');
  assert.deepEqual(request,{requestUrl:url});
});
