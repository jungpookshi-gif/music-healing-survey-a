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
  const invitation = {title: t('shareTitle'), text: t('inviteText'), url};

  link.value = url;
  share.hidden = typeof device.share !== 'function' ||
    (typeof device.canShare === 'function' && !device.canShare(invitation));

  share.onclick = async () => {
    status.textContent = '';
    try {
      await device.share(invitation);
    } catch (error) {
      if (error?.name !== 'AbortError') status.textContent = t('shareUseCopy');
    }
  };

  copy.onclick = async () => {
    try {
      await device.clipboard.writeText(url);
      status.textContent = t('linkCopied');
    } catch {
      manual.hidden = false;
      link.focus();
      link.select();
      status.textContent = t('copyManually');
    }
  };
}
