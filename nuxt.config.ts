import { ADDITIONAL_ROUTES } from './src/additional-routes'

const translations = require('./src/assets/data/translations.json')
const numberFormats = require('./src/assets/data/number-formats.json')

export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,
  srcDir: './src',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'hivesigner',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    'primer/index.scss',
    '@vue/ui/dist/vue-ui.css',
    '@/assets/scss/styles.scss'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '~/plugins/idle-detector.ts',
    '~/plugins/hivesigner.ts',
    '~/plugins/vue-ui.ts',
    '~/plugins/filters.ts'
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/style-resources',
    // 'nuxt-i18n'
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},

  // Vue i18n
  // i18n: {
  //   locales: ['en', 'fr'],
  //   defaultLocale: 'en',
  //   vueI18n: {
  //     fallbackLocale: 'en',
  //     messages: translations,
  //     numberFormats
  //   }
  // },

  // router
  router: {
    extendRoutes(routes: any[]) {
      ADDITIONAL_ROUTES.forEach(route => routes.push(route))
    }
  }
}
