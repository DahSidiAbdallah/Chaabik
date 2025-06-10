import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Star, Phone, Clock, Package, BadgeCheck, ArrowLeft } from 'lucide-react';
import { listings } from '../data';

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const listing = listings.find(l => l.id === id);

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p>Product not found</p>
      </div>
    );
  }

  // Convert price to MRU
  const priceInMRU = Math.round(listing.price * 38.5);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {t('product.back')}
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="relative h-96">
          <img
            src={listing.image}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-yellow-400 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
            {listing.condition}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                {listing.location}
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600">{priceInMRU.toLocaleString()} MRU</div>
          </div>

          <div className="prose max-w-none text-gray-600 mb-6">
            {listing.description}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('product.features')}</h2>
                <ul className="grid gap-2">
                  {listing.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <BadgeCheck className="w-5 h-5 mr-2 text-blue-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('product.sellerInfo')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-lg font-medium text-gray-900">{listing.seller.name}</div>
                      <div className="flex items-center text-yellow-400 ml-2">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="ml-1 text-gray-900">{listing.seller.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {t('product.memberSince')} {new Date(listing.seller.joinedDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      {listing.seller.totalSales} {t('product.sales')}
                    </div>
                    <div>{t('product.responseRate')}: {listing.seller.responseRate}%</div>
                  </div>

                  <button
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
                    onClick={() => window.location.href = `tel:${listing.seller.phone}`}
                  >
                    <Phone className="w-5 h-5" />
                    {t('product.contactSeller')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}