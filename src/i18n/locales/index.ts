// The locale dictionaries are reused UNCHANGED from the Nuxt app
// (src/assets/js/translations). They are plain default-exported objects and
// use single-brace interpolation ({item}); i18n init below configures i18next's
// interpolation to match, so no key or string is rewritten here.
import en from './en-US.js';
import ru from './ru-RU.js';

export const resources = {
  en: { translation: en },
  ru: { translation: ru },
} as const;

export const supportedLngs = ['en', 'ru'] as const;
