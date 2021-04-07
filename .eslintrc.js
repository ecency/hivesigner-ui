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
  plugins: [
  ],
  // add your custom rules here
  rules: {
    'space-before-function-paren': 'off',
    'comma-dangle': 'off',
    'require-await': 'off',
    'multiline-ternary': 'off'
  }
}
