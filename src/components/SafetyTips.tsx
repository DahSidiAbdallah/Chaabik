import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, UserCheck, Wallet, MessageSquare } from 'lucide-react';
import { Footer } from './Footer';

export function SafetyTips() {
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
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              {t('safety.title')}
            </h1>

            <div className="space-y-8">
              {/* Meeting in Person */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <UserCheck className="w-6 h-6 text-yellow-500 mr-2" />
                  {t('safety.meetingTitle')}
                </h2>
                <ul className="space-y-3 text-gray-600">
                  <li>• {t('safety.meetPublic')}</li>
                  <li>• {t('safety.bringCompanion')}</li>
                  <li>• {t('safety.meetDaytime')}</li>
                  <li>• {t('safety.informFamily')}</li>
                  <li>• {t('safety.trustInstinct')}</li>
                </ul>
              </section>

              {/* Payment Safety */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Wallet className="w-6 h-6 text-yellow-500 mr-2" />
                  {t('safety.paymentTitle')}
                </h2>
                <ul className="space-y-3 text-gray-600">
                  <li>• {t('safety.inspectFirst')}</li>
                  <li>• {t('safety.noWireTransfer')}</li>
                  <li>• {t('safety.keepReceipts')}</li>
                  <li>• {t('safety.countMoney')}</li>
                  <li>• {t('safety.avoidPrepay')}</li>
                </ul>
              </section>

              {/* Communication Safety */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="w-6 h-6 text-yellow-500 mr-2" />
                  {t('safety.communicationTitle')}
                </h2>
                <ul className="space-y-3 text-gray-600">
                  <li>• {t('safety.useAppChat')}</li>
                  <li>• {t('safety.protectPrivacy')}</li>
                  <li>• {t('safety.reportSuspicious')}</li>
                  <li>• {t('safety.verifyIdentity')}</li>
                </ul>
              </section>

              {/* Warning Signs */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
                  {t('safety.warningTitle')}
                </h2>
                <ul className="space-y-3 text-gray-600">
                  <li>• {t('safety.tooGoodTrue')}</li>
                  <li>• {t('safety.urgentPressure')}</li>
                  <li>• {t('safety.unwillingMeet')}</li>
                  <li>• {t('safety.requestPersonal')}</li>
                  <li>• {t('safety.foreignPayment')}</li>
                </ul>
              </section>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">
                  {t('safety.emergency')}
                  <br />
                  {t('safety.policeNumber')}
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