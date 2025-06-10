import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, AlertTriangle, Ban, Check } from 'lucide-react';
import { Footer } from './Footer';

export function Rules() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.backToHome')}
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              {t('rules.title')}
            </h1>

            <div className="space-y-8">
              {/* General Rules */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Check className="w-6 h-6 text-green-500 mr-2" />
                  {t('rules.generalTitle')}
                </h2>
                <ul className="space-y-3 text-gray-600">
                  <li>• {t('rules.accurate')}</li>
                  <li>• {t('rules.ownership')}</li>
                  <li>• {t('rules.realistic')}</li>
                  <li>• {t('rules.responsive')}</li>
                  <li>• {t('rules.respect')}</li>
                </ul>
              </section>

              {/* Prohibited Content */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Ban className="w-6 h-6 text-red-500 mr-2" />
                  {t('rules.prohibitedTitle')}
                </h2>
                <ul className="space-y-3 text-gray-600">
                  <li>• {t('rules.illegal')}</li>
                  <li>• {t('rules.counterfeit')}</li>
                  <li>• {t('rules.offensive')}</li>
                  <li>• {t('rules.misleading')}</li>
                  <li>• {t('rules.restricted')}</li>
                </ul>
              </section>

              {/* Listing Guidelines */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('rules.listingTitle')}
                </h2>
                <ul className="space-y-3 text-gray-600">
                  <li>• {t('rules.images')}</li>
                  <li>• {t('rules.description')}</li>
                  <li>• {t('rules.category')}</li>
                  <li>• {t('rules.price')}</li>
                  <li>• {t('rules.contact')}</li>
                </ul>
              </section>

              {/* Violations and Consequences */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
                  {t('rules.violationsTitle')}
                </h2>
                <ul className="space-y-3 text-gray-600">
                  <li>• {t('rules.warning')}</li>
                  <li>• {t('rules.removal')}</li>
                  <li>• {t('rules.suspension')}</li>
                  <li>• {t('rules.permanent')}</li>
                </ul>
              </section>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">
                  {t('rules.note')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}