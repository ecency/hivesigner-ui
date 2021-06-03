module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'plugin:nuxt/recommended'
  ],
  plugins: [],
  // add your custom rules here
  rules: {
    'require-await': 'off',
    'no-console': 'off',
    'import/no-mutable-exports': 'off',
    camelcase: 'off',
    'vue/no-v-html': 'off'
  }
}
