// Small per-device UI preferences (language). Node selection and timeouts are
// the SDK's job now, so there is no custom-node setting.
import { supportedLngs } from '@/i18n/locales';

const LANG_KEY = 'hs_lang';

export type Language = (typeof supportedLngs)[number];

export function getLanguage(): Language {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v && (supportedLngs as readonly string[]).includes(v))
      return v as Language;
  } catch {
    // storage blocked; fall through to default
  }
  return 'en';
}

export function setLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // best effort
  }
}
