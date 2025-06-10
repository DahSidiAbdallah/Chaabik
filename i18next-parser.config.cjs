// filepath: i18next-parser.config.cjs
module.exports = {
  locales: ['en', 'fr', 'ar'],
  output: 'src/i18n/locales/$LOCALE.json',
  input: ['src/**/*.{js,jsx,ts,tsx}'],
  keySeparator: false,
  namespaceSeparator: false,
  sort: true,
  lexers: {
    jsx: ['JsxLexer'],
    js: ['JsLexer'],
    ts: ['JsLexer'],
    tsx: ['JsxLexer'],
    default: ['JsxLexer']
  },
  defaultValue: '',
  // Keep existing values in translation files
  keepRemoved: true,
  // Add new keys to all languages
  createOldCatalogs: false
};
