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
  const kakaoButton = section.querySelector('#share-kakao');
  const messengerButton = section.querySelector('#share-messenger');
  const status = section.querySelector('#share-status');

  async function shareWithDevice(prompt) {
    if (typeof device.share !== 'function') {
      status.textContent = t('shareAppsUnavailable');
      return;
    }
    status.textContent = t(prompt);
    try {
      await device.share({url});
    } catch (error) {
      status.textContent = error?.name === 'AbortError' ? '' : t('shareAppsUnavailable');
    }
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
    await shareWithDevice('shareKakaoChoose');
  };

  messengerButton.onclick = () => shareWithDevice('shareMessengerChoose');
}
