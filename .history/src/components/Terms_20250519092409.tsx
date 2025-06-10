import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';

export function Terms() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('terms.title')}</h1>
            
            <div className="prose prose-blue max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.acceptance')}</h2>
                <p className="text-gray-600">{t('terms.acceptanceText')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.userObligations')}</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>{t('terms.obligation1')}</li>
                  <li>{t('terms.obligation2')}</li>
                  <li>{t('terms.obligation3')}</li>
                  <li>{t('terms.obligation4')}</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.prohibitedItems')}</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>{t('terms.prohibited1')}</li>
                  <li>{t('terms.prohibited2')}</li>
                  <li>{t('terms.prohibited3')}</li>
                  <li>{t('terms.prohibited4')}</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.transactions')}</h2>
                <p className="text-gray-600">{t('terms.transactionsText')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.privacy')}</h2>
                <p className="text-gray-600">{t('terms.privacyText')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.liability')}</h2>
                <p className="text-gray-600">{t('terms.liabilityText')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.changes')}</h2>
                <p className="text-gray-600">{t('terms.changesText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.contact')}</h2>
                <p className="text-gray-600">{t('terms.contactText')}</p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 