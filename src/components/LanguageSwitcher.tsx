import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Fr from '../assets/flags/fr.svg';
import En from '../assets/flags/gb.svg';
import Ar from '../assets/flags/mr.svg';
import { ChevronDown } from 'lucide-react';
const LANGUAGES = [
  { code: 'en', label: 'English', flag: En },
  { code: 'fr', label: 'Français', flag: Fr },
  { code: 'ar', label: 'العربية', flag: Ar },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-400 text-blue-600 font-medium shadow hover:bg-yellow-300 transition-colors text-xs"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <img src={current.flag} alt={current.label + ' flag'} className="w-4 h-4 rounded-full" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className="w-6 h-6 ml-1" />
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setOpen(false);
              }}
              className={`flex items-center gap-1 w-full px-2 py-1 text-left hover:bg-yellow-50 transition-colors text-xs ${i18n.language === lang.code ? 'font-bold text-blue-600' : 'text-gray-700'}`}
              role="option"
              aria-selected={i18n.language === lang.code}
            >
              <img src={lang.flag} alt={lang.label + ' flag'} className="w-4 h-4 rounded-full" />
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}