import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLanguage } from '@/lib/prefs';
import { resources, supportedLngs } from './locales';

// The reused dictionaries use single-brace {item} placeholders (Vue i18n
// style), so i18next's interpolation is configured to match them rather than
// rewriting every string to {{item}}.
i18n.use(initReactI18next).init({
  resources,
  lng: getLanguage(),
  fallbackLng: 'en',
  supportedLngs: [...supportedLngs],
  interpolation: {
    escapeValue: false,
    prefix: '{',
    suffix: '}',
  },
});

// The document language follows the dictionary, for screen readers and for
// crawlers that read `lang` off the shell. Applied once for the language init
// chose (a stored `ru` would otherwise sit under lang="en" until the first
// change) and then on every change.
const syncLang = (lng: string) => {
  try {
    document.documentElement.lang = lng;
  } catch {
    // no document (tests without DOM)
  }
};
syncLang(i18n.language);
i18n.on('languageChanged', syncLang);

export default i18n;
