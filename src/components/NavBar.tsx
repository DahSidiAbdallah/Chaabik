import { categories } from '../data';
import { UserMenu } from './UserMenu';
import { LanguageSwitcher } from './LanguageSwitcher';
import { supabase, isAuthenticated } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ChaabikLogo from '../assets/Chaabik.png';

export function NavBar() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const hasSession = await isAuthenticated();
        if (!hasSession) {
          setUser(null);
          setAuthChecked(true);
          return;
        }
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          if (error.message.includes('expired') || error.message.includes('missing')) {
            await supabase.auth.signOut();
          }
          setUser(null);
        } else {
          setUser(user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleAllCategories = () => {
    setSelectedCategory(null);
  };

  if (!authChecked) {
    return null;
  }

  return (
    <header className="bg-white py-4 shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <a href="/">
          <img src={ChaabikLogo} alt={t('logo.alt')} className="h-10 w-auto" />
        </a>
        <button
          className="lg:hidden flex items-center justify-center p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
          {categories.slice(0, 6).map(category => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`text-sm font-medium ${selectedCategory === category.id ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t(`categories.${category.name}`)}
            </button>
          ))}
        </div>
        <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
          {user ? (
            <UserMenu />
          ) : (
            <>
              <Link
                to="/auth"
                state={{ mode: 'signup' }}
                className="text-gray-700 px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50"
              >
                {t('auth.signUp')}
              </Link>
              <Link
                to="/auth"
                state={{ mode: 'signin' }}
                className="bg-yellow-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-500"
              >
                {t('auth.signIn')}
              </Link>
            </>
          )}
          <LanguageSwitcher />
        </div>
      </div>
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <PopupMenuCard
            onClose={() => setIsMobileMenuOpen(false)}
            user={user}
            t={t}
            selectedCategory={selectedCategory}
            handleAllCategories={handleAllCategories}
            handleCategorySelect={handleCategorySelect}
            categories={categories}
            i18n={i18n}
          />
        </>
      )}
    </header>
  );
}

function LanguagePills({ onSelect, current }: { onSelect: (lng: string) => void; current: string }) {
  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' }
  ];
  return (
    <div className="flex gap-2 mt-4 justify-center">
      {languages.map(lng => (
        <button
          key={lng.code}
          onClick={() => onSelect(lng.code)}
          className={`px-4 py-1 rounded-full border text-base font-semibold transition ${current === lng.code ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
        >
          {lng.label}
        </button>
      ))}
    </div>
  );
}

function PopupMenuCard({
  onClose,
  user,
  t,
  selectedCategory,
  handleAllCategories,
  handleCategorySelect,
  categories,
  i18n,
}: {
  onClose: () => void;
  user: User | null;
  t: any;
  selectedCategory: string | null;
  handleAllCategories: () => void;
  handleCategorySelect: (categoryId: string) => void;
  categories: any[];
  i18n: any;
}) {
  return (
    <div
      className="fixed top-6 right-1/2 translate-x-1/2 sm:right-6 sm:translate-x-0 z-50 animate-slide-in bg-white rounded-2xl shadow-2xl w-[92vw] max-w-xs sm:max-w-sm p-0 flex flex-col"
      style={{ minWidth: 260, maxHeight: '90vh' }}
    >
      <div className="relative flex-shrink-0">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 z-10"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="w-7 h-7" />
        </button>
      </div>
      <div
        className="flex flex-col items-stretch gap-3 mt-2 px-5 pb-7 pt-12 overflow-y-auto"
        style={{ maxHeight: 'calc(90vh - 16px)' }}
      >
        <button
          onClick={() => {
            handleAllCategories();
            onClose();
          }}
          className={`text-lg font-semibold text-left rounded-lg px-3 py-2 transition ${!selectedCategory ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          {t('categories.all')}
        </button>
        {categories.slice(0, 6).map(category => (
          <button
            key={category.id}
            onClick={() => {
              handleCategorySelect(category.id);
              onClose();
            }}
            className={`text-lg font-semibold text-left rounded-lg px-3 py-2 transition ${selectedCategory === category.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            {t(`categories.${category.name}`)}
          </button>
        ))}
        <hr className="my-3" />
        <Link to="/terms" className="text-base font-medium rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-700 text-left block">Terms</Link>
        <Link to="/privacy" className="text-base font-medium rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-700 text-left block">Privacy</Link>
        <Link to="/faq" className="text-base font-medium rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-700 text-left block">FAQ</Link>
        <Link to="/rules" className="text-base font-medium rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-700 text-left block">Rules</Link>
        <Link to="/safety" className="text-base font-medium rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-700 text-left block">Safety Tips</Link>
        <hr className="my-3" />
        {user ? (
          <div className="mt-1"><UserMenu /></div>
        ) : (
          <div className="flex flex-col gap-2 mt-1">
            <Link
              to="/auth"
              state={{ mode: 'signup' }}
              className="text-gray-700 px-3 py-2 rounded-lg border border-gray-300 text-base font-semibold hover:bg-gray-50 text-center"
              onClick={onClose}
            >
              {t('auth.signUp')}
            </Link>
            <Link
              to="/auth"
              state={{ mode: 'signin' }}
              className="bg-yellow-400 text-gray-700 px-3 py-2 rounded-lg text-base font-semibold hover:bg-yellow-500 text-center"
              onClick={onClose}
            >
              {t('auth.signIn')}
            </Link>
          </div>
        )}
        <div className="mt-3">
          <LanguagePills onSelect={lng => i18n.changeLanguage(lng)} current={i18n.language} />
        </div>
      </div>
    </div>
  );
}

const style = document.createElement('style');
style.innerHTML = `
@keyframes slide-in {
  from { opacity: 0; transform: translateY(-30px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-slide-in {
  animation: slide-in 0.25s cubic-bezier(.4,0,.2,1);
}

@media (min-width: 480px) {
  .xs\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`;
if (typeof window !== 'undefined' && !document.getElementById('popup-slidein-style')) {
  style.id = 'popup-slidein-style';
  document.head.appendChild(style);
}

export default NavBar;
