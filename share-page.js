import {text} from './i18n.js?v=13';
import {connectSurveyShare, loadKakaoShare, surveyInviteUrl, surveyShareSection} from './sharing.js?v=15';
import {initialLanguage, languages} from './locale.js';

const params = new URL(location.href).searchParams;
const language = initialLanguage(location.href);
const t = key => text[key][languages.indexOf(language)];
const selectedApp = params.get('app');
const inviteUrl = surveyInviteUrl(location.href, language);

document.documentElement.lang = language === 'zh' ? 'zh-Hans' : language;
document.title = `${t('shareHeading')} · Music Healing`;
const surveyLink = document.querySelector('#survey-link');
surveyLink.href = inviteUrl;
surveyLink.textContent = t('shareOpenSurvey');

const panel = document.querySelector('#share-panel');
panel.innerHTML = surveyShareSection(t, selectedApp);
connectSurveyShare(panel.firstElementChild, inviteUrl, t, {
  offerBrowser: false,
  kakao: selectedApp === 'messenger' ? null : loadKakaoShare(window.SURVEY_CONFIG?.kakaoJavaScriptKey)
});
