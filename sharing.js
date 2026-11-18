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
  const system = section.querySelector('#share-other-apps');
  const kakaoButton = section.querySelector('#share-kakao');
  const status = section.querySelector('#share-status');
  const supportsNative = typeof device.share === 'function';

  const telegram = new URL('https://t.me/share/url');
  telegram.searchParams.set('url', url);
  section.querySelector('#share-telegram').href = telegram.href;
  const facebook = new URL('https://www.facebook.com/sharer/sharer.php');
  facebook.searchParams.set('u', url);
  section.querySelector('#share-facebook').href = facebook.href;
  system.hidden = !supportsNative;

  function showPlatforms() {
    platforms.hidden = false;
    share.setAttribute('aria-expanded', 'true');
  }

  async function shareWithDevice() {
    status.textContent = '';
    try {
      await device.share({url});
    } catch {
      // Missing targets and restricted in-app browsers can both reject the picker.
      showPlatforms();
    }
  }

  let kakaoShare = null;
  if (kakao) {
    void kakao.then(send => {
      if (!send) return;
      kakaoShare = send;
      kakaoButton.hidden = false;
      kakaoButton.onclick = async () => {
        status.textContent = '';
        try {
          await send(url);
        } catch {
          status.textContent = t('shareKakaoUnavailable');
        }
      };
    });
  }

  system.onclick = shareWithDevice;
  share.onclick = () => {
    if (supportsNative && !kakaoShare) return shareWithDevice();
    showPlatforms();
  };
}
