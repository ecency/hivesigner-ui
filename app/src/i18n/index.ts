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

export default i18n;
