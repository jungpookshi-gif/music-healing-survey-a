export function surveyInviteUrl(pageUrl, language) {
  const invite = new URL('./', pageUrl);
  invite.searchParams.set('lang', language);
  return invite.href;
}

export function connectSurveyShare(section, url, t, device = navigator) {
  const share = section.querySelector('#share-survey');
  const copy = section.querySelector('#copy-survey-link');
  const status = section.querySelector('#share-status');
  const manual = section.querySelector('#survey-link-wrap');
  const link = section.querySelector('#survey-link');
  link.value = url;

  function copyBySelection() {
    manual.hidden = false;
    link.focus();
    link.select();
    try {
      return section.ownerDocument?.execCommand?.('copy') === true;
    } catch {
      return false;
    }
  }

  async function copyLink() {
    let copied = false;
    try {
      await device.clipboard.writeText(url);
      copied = true;
    } catch {
      copied = copyBySelection();
    }
    status.textContent = t(copied ? 'linkCopied' : 'copyManually');
  }

  share.onclick = async () => {
    status.textContent = '';
    if (typeof device.share !== 'function') return copyLink();
    try {
      await device.share({url});
    } catch {
      // In-app browsers can expose share() but block it or have no targets.
      manual.hidden = false;
      status.textContent = t('shareUseCopy');
    }
  };
  copy.onclick = copyLink;
}
