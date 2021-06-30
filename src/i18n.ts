const numberFormats = require('./assets/data/number-formats.json')

export const i18n = {
  locales: [
    {
      code: 'en',
      name: 'English',
      file: 'en-US.js'
    },
    {
      code: 'ru',
      name: 'Русский',
      file: 'ru-RU.js'
    }
  ],
  defaultLocale: 'en',
  lazy: true,
  langDir: './assets/js/translations',
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_redirected',
    onlyOnRoot: true // recommended
  },
  vuex: false,
  strategy: 'no_prefix',
  vueI18n: {
    fallbackLocale: 'en',
    numberFormats
  }
}
