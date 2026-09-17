import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { isChunkLoadError, reloadOnce } from '@/lib/chunk-reload';
import { getStoredLanguage, setLanguage } from '@/lib/prefs';
import {
  browserLanguages,
  detectLanguage,
  LANGUAGE_CODES,
  type Language,
  languageInfo,
} from './languages';
import { english, loaders } from './locales';

// Starts in English, the only dictionary in the bundle, and moves to the
// user's language once its dictionary has loaded (see `languageReady`).
//
// The dictionaries use single-brace {item} placeholders (Vue i18n style, kept
// from the previous app), so i18next's interpolation is configured to match.
i18n.use(initReactI18next).init({
  resources: { en: { translation: english } },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: [...LANGUAGE_CODES],
  // `zh-TW` is a dictionary of its own; never look for a plain `zh`.
  load: 'currentOnly',
  interpolation: {
    escapeValue: false,
    prefix: '{',
    suffix: '}',
  },
});

// The document follows the dictionary: `lang` for screen readers, fonts and
// hyphenation, `dir` so Arabic and Persian lay out right to left.
const syncDocument = (lng: string) => {
  try {
    const info = languageInfo(lng);
    document.documentElement.lang = info.htmlLang ?? info.code;
    document.documentElement.dir = info.rtl ? 'rtl' : 'ltr';
  } catch {
    // no document (tests without DOM)
  }
};
syncDocument(i18n.language);
i18n.on('languageChanged', syncDocument);

/** Fetch a language's dictionary if it is not here yet. */
export async function loadLanguage(lang: Language): Promise<void> {
  if (lang === 'en' || i18n.hasResourceBundle(lang, 'translation')) return;
  const { default: dictionary } = await loaders[lang]();
  i18n.addResourceBundle(lang, 'translation', dictionary);
}

// Only the newest request may change the language: a slow dictionary must not
// override a language picked while it was loading.
let latest = 0;

/**
 * Show the app in `lang`. `remember` is for a language the user picked: it is
 * stored, and if its file is gone because a release replaced this page's
 * files, the page reloads once to pick it up. Resolves false when the
 * language could not be loaded; the page then stays as it was.
 */
export async function switchLanguage(
  lang: Language,
  { remember = false }: { remember?: boolean } = {},
): Promise<boolean> {
  const request = ++latest;
  try {
    await loadLanguage(lang);
  } catch (error) {
    if (remember && request === latest) {
      setLanguage(lang);
      if (isChunkLoadError(error)) reloadOnce();
    }
    return false;
  }
  if (request !== latest) return false;
  if (remember) setLanguage(lang);
  await i18n.changeLanguage(lang);
  return true;
}

/** The language to start in: the user's pick, else the browser's. */
export function initialLanguage(): Language {
  return getStoredLanguage() ?? detectLanguage(browserLanguages());
}

/** Settles once the starting language is shown, or could not be loaded. */
export const languageReady: Promise<void> = (() => {
  const lang = initialLanguage();
  return lang === 'en'
    ? Promise.resolve()
    : switchLanguage(lang).then(() => undefined);
})();

export default i18n;
