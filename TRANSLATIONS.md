# Chaabik Translation Management

This document provides instructions for managing translations in the Chaabik project.

## Translation System

Chaabik uses [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) for internationalization. The translation files are located in the `src/i18n/locales/` directory.

Currently, the application supports the following languages:
- English (en)
- French (fr)
- Arabic (ar)

## Automatic Translation Updates

To automatically scan for new translatable strings in the codebase and update the translation files:

```bash
npm run translations
```

This command will:
1. Extract all translatable strings from the source code
2. Update existing translation files (keeping existing translations)
3. Generate statistics on translation completeness

## Manual Steps

The automatic process will identify all translatable strings but won't translate them. To complete the translations:

1. Open the locale files in `src/i18n/locales/`
2. Fill in the missing translations
3. Ensure proper formatting in JSON files

## Adding a New Language

To add a new language:

1. Edit `i18next-parser.config.cjs` and add the new locale code to the `locales` array
2. Edit `src/i18n/index.ts` to import and register the new language
3. Run `npm run translations` to generate the new language file
4. Translate the content in the newly created file

## Translation Keys

In the codebase, translations are used with the `useTranslation` hook from react-i18next:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <p>{t('key.to.translation')}</p>;
}
```

For nested keys, use dot notation:

```typescript
t('header.search')
```

For translations with variables:

```typescript
t('categories.showingCategory', { category: 'Electronics' })
```

## Best Practices

1. **Use semantic keys** - Keys should describe the content's purpose, not its value
2. **Keep translations organized** - Group related translations using nested objects
3. **Be consistent** - Use the same format for similar content
4. **Consider context** - Provide context hints for translators when the meaning might be ambiguous
5. **Run translations check regularly** - Run `npm run translations` regularly to keep translations up to date

## Troubleshooting

If translations aren't working as expected:

1. Check that the key exists in the translation file
2. Ensure the translation file has been imported and registered in `src/i18n/index.ts`
3. Verify that the i18next configuration in `src/i18n/index.ts` is correct
4. Check the browser console for any errors related to i18next

## Automated Translation Services (Optional)

For projects with many translations, consider using:

1. [Lokalise](https://lokalise.com/)
2. [POEditor](https://poeditor.com/)

These services can streamline the translation process, especially for large projects with many languages.