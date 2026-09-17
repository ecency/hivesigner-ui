// Small per-device UI preferences (language). Node selection and timeouts are
// the SDK's job now, so there is no custom-node setting.
import { isLanguage, type Language } from '@/i18n/languages';

const LANG_KEY = 'hs_lang';

export type { Language } from '@/i18n/languages';

/**
 * The language the user picked on this device, or null when they never did.
 * Only a pick is stored: a language detected from the browser is worked out
 * again on every visit, so a language added later reaches people too.
 */
export function getStoredLanguage(): Language | null {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (isLanguage(v)) return v;
  } catch {
    // storage blocked; nothing stored as far as we can tell
  }
  return null;
}

export function setLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // best effort
  }
}
