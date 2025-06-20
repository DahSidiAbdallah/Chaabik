import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Plus, Minus } from 'lucide-react';


interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="w-full py-6 flex justify-between items-center text-left"
        onClick={onToggle}
      >
        <span className="text-lg font-medium text-gray-900">{question}</span>
        {isOpen ? (
          <Minus className="w-5 h-5 text-gray-500" />
        ) : (
          <Plus className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  const { t } = useTranslation();
  const [openItem, setOpenItem] = React.useState<number | null>(null);

  const faqs = [
    {
      question: t('faq.howToPost'),
      answer: t('faq.howToPostAnswer')
    },
    {
      question: t('faq.accountNeeded'),
      answer: t('faq.accountNeededAnswer')
    },
    {
      question: t('faq.postingFee'),
      answer: t('faq.postingFeeAnswer')
    },
    {
      question: t('faq.editListing'),
      answer: t('faq.editListingAnswer')
    },
    {
      question: t('faq.reportIssue'),
      answer: t('faq.reportIssueAnswer')
    },
    {
      question: t('faq.deleteAccount'),
      answer: t('faq.deleteAccountAnswer')
    },
    {
      question: t('faq.paymentMethods'),
      answer: t('faq.paymentMethodsAnswer')
    },
    {
      question: t('faq.listingDuration'),
      answer: t('faq.listingDurationAnswer')
    }
  ];

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
              <HelpCircle className="w-8 h-8 text-blue-600 mr-3" />
              {t('faq.title')}
            </h1>

            <div className="divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openItem === index}
                  onToggle={() => setOpenItem(openItem === index ? null : index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}