import React from 'react';
import { useTranslation } from 'react-i18next';
import gbFlag from '../assets/flags/gb.svg';
import frFlag from '../assets/flags/fr.svg';
import mrFlag from '../assets/flags/mr.svg';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: '🇬🇧 EN' },
    { code: 'fr', label: '🇫🇷 FR' },
    { code: 'ar', label: '🇲🇷 عربي' },
  ];

  const flagSrc: Record<string, string> = {
    en: gbFlag,
    fr: frFlag,
    ar: mrFlag,
  };


  const [open, setOpen] = React.useState(false);
  const selected = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="relative inline-block text-left" tabIndex={0} onBlur={() => setOpen(false)}>
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 pr-8 rounded-full bg-white border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm font-medium text-gray-700 transition-colors min-w-[90px]"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <img src={flagSrc[selected.code]} alt="flag" className="w-5 h-5 rounded-full" />
        <span>{selected.label.replace(/^[^ ]+ /, '')}</span>
        <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <ul className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1" role="listbox">
          {languages.map(lang => (
            <li
              key={lang.code}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-yellow-50 text-sm ${i18n.language === lang.code ? 'bg-yellow-100 font-semibold' : ''}`}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              role="option"
              aria-selected={i18n.language === lang.code}
            >
              <img src={flagSrc[lang.code]} alt="flag" className="w-5 h-5 rounded-full" />
              <span>{lang.label.replace(/^[^ ]+ /, '')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}