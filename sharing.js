export function surveyInviteUrl(pageUrl, language) {
  const invite = new URL('./', pageUrl);
  invite.searchParams.set('lang', language);
  return invite.href;
}

export function surveyShareSection(t, selectedApp = '') {
  return `<section class="survey-share" aria-labelledby="share-title">
    <h2 id="share-title">${t('shareHeading')}</h2>
    <div class="share-actions">
      <button class="secondary" type="button" id="share-kakao"${selectedApp === 'messenger' ? ' hidden' : ''}>KakaoTalk</button>
      <button class="secondary" type="button" id="share-messenger"${selectedApp === 'kakao' ? ' hidden' : ''}>Facebook Messenger</button>
    </div>
    <p id="share-status" role="status"></p>
    <div id="share-browser-links" hidden>
      <a id="share-open-chrome" class="secondary" target="_blank" rel="noopener" hidden>${t('shareOpenChrome')}</a>
      <a id="share-open-browser" class="secondary" target="_blank" rel="noopener">${t('shareOpenPage')}</a>
    </div>
  </section>`;
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

export function connectSurveyShare(section, url, t, {device = navigator, kakao = null, offerBrowser = true} = {}) {
  const kakaoButton = section.querySelector('#share-kakao');
  const messengerButton = section.querySelector('#share-messenger');
  const status = section.querySelector('#share-status');
  const browserLinks = section.querySelector('#share-browser-links');
  const openChrome = section.querySelector('#share-open-chrome');
  const openBrowser = section.querySelector('#share-open-browser');
  const sharePage = new URL('share.html', url);
  const language = new URL(url).searchParams.get('lang');
  if (language) sharePage.searchParams.set('lang', language);

  function updateBrowserLinks(app) {
    const link = new URL(sharePage);
    if (app) link.searchParams.set('app', app);
    const opensChrome = Boolean(app) && link.protocol === 'https:' && /\bAndroid\b/i.test(device.userAgent ?? '');
    openBrowser.href = link.href;
    openChrome.hidden = !opensChrome;
    if (opensChrome) {
      openChrome.href = `intent://${link.host}${link.pathname}${link.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(link.href)};end`;
    }
    browserLinks.hidden = false;
  }

  function showBrowserHelp(app) {
    if (offerBrowser) updateBrowserLinks(app);
    status.textContent = t(offerBrowser ? 'shareBrowserHelp' : 'shareAppsUnavailable');
  }

  if (offerBrowser) updateBrowserLinks();

  async function shareWithDevice(app, prompt) {
    if (offerBrowser) updateBrowserLinks();
    if (typeof device.share !== 'function') {
      showBrowserHelp(app);
      return;
    }
    status.textContent = t(prompt);
    try {
      await device.share({url});
    } catch (error) {
      if (error?.name === 'AbortError') status.textContent = '';
      else showBrowserHelp(app);
    }
  }

  let kakaoShare = null;
  if (kakao) void kakao.then(send => { kakaoShare = send; });

  kakaoButton.onclick = async () => {
    status.textContent = '';
    if (kakaoShare) {
      try {
        if (offerBrowser) updateBrowserLinks();
        await kakaoShare(url);
        return;
      } catch {
        // Keep device sharing available if the SDK cannot open its picker.
      }
    }
    await shareWithDevice('kakao', 'shareKakaoChoose');
  };

  messengerButton.onclick = () => shareWithDevice('messenger', 'shareMessengerChoose');
}
