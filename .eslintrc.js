module.exports = {
  // app/ is the React SPA with its own toolchain (biome). The Nuxt ESLint config
  // has opposite rules (no semicolons, no trailing commas) and an older parser,
  // so linting it here produced ~1100 errors and broke the pipeline. The root
  // lint script passes --ignore-path .gitignore, which REPLACES .eslintignore,
  // so this has to be an ignorePatterns entry.
  ignorePatterns: ['app/'],

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
