import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';

export function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.backToHome')}
        </Link>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('privacy.title')}</h1>
            
            <div className="prose prose-blue max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.collection')}</h2>
                <p className="text-gray-600">{t('privacy.collectionText')}</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
                  <li>{t('privacy.collection1')}</li>
                  <li>{t('privacy.collection2')}</li>
                  <li>{t('privacy.collection3')}</li>
                  <li>{t('privacy.collection4')}</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.usage')}</h2>
                <p className="text-gray-600">{t('privacy.usageText')}</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
                  <li>{t('privacy.usage1')}</li>
                  <li>{t('privacy.usage2')}</li>
                  <li>{t('privacy.usage3')}</li>
                  <li>{t('privacy.usage4')}</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.sharing')}</h2>
                <p className="text-gray-600">{t('privacy.sharingText')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.security')}</h2>
                <p className="text-gray-600">{t('privacy.securityText')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.cookies')}</h2>
                <p className="text-gray-600">{t('privacy.cookiesText')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.rights')}</h2>
                <p className="text-gray-600">{t('privacy.rightsText')}</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
                  <li>{t('privacy.rights1')}</li>
                  <li>{t('privacy.rights2')}</li>
                  <li>{t('privacy.rights3')}</li>
                  <li>{t('privacy.rights4')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.contact')}</h2>
                <p className="text-gray-600">{t('privacy.contactText')}</p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 