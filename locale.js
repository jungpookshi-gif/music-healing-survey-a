export const languages = ['vi', 'ko', 'en', 'zh', 'mn'];

export function initialLanguage(url) {
  const requested = new URL(url).searchParams.get('lang');
  return languages.includes(requested) ? requested : 'ko';
}
