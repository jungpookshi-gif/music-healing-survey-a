export function surveyInviteUrl(pageUrl, language) {
  const invite = new URL('./', pageUrl);
  invite.searchParams.set('lang', language);
  return invite.href;
}

let kakaoSdk;
export function loadKakaoShare(key, browser = window) {
  if (typeof key !== 'string' || !key.trim()) return Promise.resolve(null);
  kakaoSdk ??= new Promise(resolve => {
    const script = browser.document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.5/kakao.min.js';
    script.integrity = 'sha384-v6JKY3z4FUkWq21oZDHZe74YvuPk/WUrVLrDHTBojHXClOSa3iXy7sCXPY1jkFbj';
    script.crossOrigin = 'anonymous';
    script.onerror = () => resolve(null);
    script.onload = () => {
      try {
        const sdk = browser.Kakao;
        if (!sdk.isInitialized()) sdk.init(key.trim());
        resolve(sdk.isInitialized() && typeof sdk.Share?.sendScrap === 'function'
          ? url => sdk.Share.sendScrap({requestUrl: url})
          : null);
      } catch {
        resolve(null);
      }
    };
    browser.document.head.append(script);
  });
  return kakaoSdk;
}

export function connectSurveyShare(section, url, t, {device = navigator, kakao = null} = {}) {
  const share = section.querySelector('#share-survey');
  const platforms = section.querySelector('#share-platforms');
  const alternatives = section.querySelector('#share-platform-options');
  const hint = section.querySelector('#share-device-hint');
  const kakaoButton = section.querySelector('#share-kakao');
  const status = section.querySelector('#share-status');
  const supportsNative = typeof device.share === 'function';

  const facebook = new URL('https://www.facebook.com/sharer/sharer.php');
  facebook.searchParams.set('u', url);
  section.querySelector('#share-facebook').href = facebook.href;
  const message = encodeURIComponent(url);
  section.querySelector('#share-whatsapp').href = 'https://wa.me/?text=' + message;
  section.querySelector('#share-line').href = 'https://line.me/R/share?text=' + message;
  alternatives.hidden = !supportsNative;
  hint.hidden = !supportsNative;

  function showPlatforms() {
    platforms.hidden = false;
    share.setAttribute('aria-expanded', 'true');
    alternatives.setAttribute('aria-expanded', 'true');
  }

  async function shareWithDevice(unavailableMessage, prompt = '') {
    status.textContent = prompt;
    if (supportsNative) {
      try {
        await device.share({url});
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          status.textContent = '';
          showPlatforms();
          return;
        }
      }
    }
    showPlatforms();
    status.textContent = t(unavailableMessage);
  }

  let kakaoShare = null;
  if (kakao) void kakao.then(send => { kakaoShare = send; });

  kakaoButton.onclick = async () => {
    status.textContent = '';
    if (kakaoShare) {
      try {
        await kakaoShare(url);
        return;
      } catch {
        // Keep device sharing available if the SDK cannot open its picker.
      }
    }
    await shareWithDevice('shareKakaoUnavailable', supportsNative ? t('shareKakaoChoose') : '');
  };

  alternatives.onclick = showPlatforms;
  share.onclick = () => shareWithDevice('shareAppsUnavailable');
}
