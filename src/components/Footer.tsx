import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-3 gap-8">
        <div>
          <div className="flex items-center mb-4">
            <span className="text-xl font-bold text-yellow-400">CHAABIK</span>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {t('footer.description')}
          </p>
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">{t('footer.newsletter')}</h3>
            <div className="flex">
              <input 
                type="email" 
                placeholder={t('footer.subscribe')} 
                className="p-2 text-sm border border-r-0 border-gray-300 flex-grow"
              />
              <button className="bg-blue-500 text-white p-2 rounded-r">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">{t('footer.sell')}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link 
                to="/auth" 
                state={{ mode: 'signup' }}
                className="text-gray-600 hover:text-gray-900"
              >
                {t('footer.createProfile')}
              </Link>
            </li>
            <li>
              <Link 
                to="/profile" 
                className="text-gray-600 hover:text-gray-900"
              >
                {t('footer.myListings')}
              </Link>
            </li>
            <li>
              <Link 
                to="/add-product" 
                className="text-gray-600 hover:text-gray-900"
              >
                {t('footer.addNewListing')}
              </Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">{t('footer.helpInfo')}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/faq" className="text-gray-600 hover:text-gray-900">{t('footer.faq')}</Link></li>
            <li><Link to="/contact" className="text-gray-600 hover:text-gray-900">{t('footer.contact')}</Link></li>
            <li><Link to="/terms" className="text-gray-600 hover:text-gray-900">{t('footer.terms')}</Link></li>
            <li><Link to="/privacy" className="text-gray-600 hover:text-gray-900">{t('footer.privacy')}</Link></li>
            <li><Link to="/rules" className="text-gray-600 hover:text-gray-900">{t('footer.rules')}</Link></li>
            <li><Link to="/safety" className="text-gray-600 hover:text-gray-900">{t('footer.safety')}</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between text-sm text-gray-500">
          <div>
            <Link to="/terms" className="text-gray-600 hover:text-gray-900">{t('footer.terms')}</Link>
            <span className="mx-3">|</span>
            <Link to="/privacy" className="text-gray-600 hover:text-gray-900">{t('footer.privacy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}