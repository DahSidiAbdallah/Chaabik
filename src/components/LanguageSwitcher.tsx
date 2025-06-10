import React from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          i18n.language === 'en' 
            ? 'bg-yellow-400 text-blue-600' 
            : 'text-gray-600 hover:bg-yellow-50'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => i18n.changeLanguage('fr')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          i18n.language === 'fr'
            ? 'bg-yellow-400 text-blue-600'
            : 'text-gray-600 hover:bg-yellow-50'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => i18n.changeLanguage('ar')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          i18n.language === 'ar'
            ? 'bg-yellow-400 text-blue-600'
            : 'text-gray-600 hover:bg-yellow-50'
        }`}
      >
        عربي
      </button>
    </div>
  );
}