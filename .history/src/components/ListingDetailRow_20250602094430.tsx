import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock } from 'lucide-react';
import { getImageUrl } from '../lib/supabase';
import { useConditionStyles } from '../lib/hooks/useConditionStyles';
import { formatTimeAgo } from '../lib/utils';

interface ListingDetailRowProps {
  id: string;
  title: string;
  price: number;
  location: string;
  image: string;
  condition: string;
  createdAt?: string;
  is_sold?: boolean;
  // No seller details needed for this row view as per current plan
}

export function ListingDetailRow({
  id,
  title,
  price,
  location,
  image,
  condition,
  createdAt,
  is_sold = false,
}: ListingDetailRowProps) {
  const { t } = useTranslation();
  const { className: conditionClassName, Icon: ConditionIcon } = useConditionStyles(condition);

  const imageUrl = React.useMemo(() => {
    if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
      return image;
    }
    if (image && !image.includes('/')) {
      return getImageUrl(image);
    }
    if (image) {
      return getImageUrl(image);
    }
    return '/placeholder-image.jpg';
  }, [image]);

  const timeAgo = formatTimeAgo(createdAt);

  return (
    <Link to={`/product/${id}`} className="block group mb-4">
      <div className={`bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-200 flex ${is_sold ? 'opacity-70' : ''}`}>
        <div className="w-32 h-32 flex-shrink-0 sm:w-40 sm:h-40">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover object-center group-hover:opacity-90 transition-opacity"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/placeholder-image.jpg') {
                target.src = '/placeholder-image.jpg';
              }
            }}
          />
        </div>
        <div className="p-3 sm:p-4 flex-grow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 line-clamp-2 group-hover:text-yellow-600">
                {title}
              </h3>
              <div className={`${is_sold ? 'bg-gray-200 text-gray-700' : 'bg-yellow-400 text-black'} px-2 py-1 rounded-full text-xs sm:text-sm font-medium shadow-sm whitespace-nowrap ml-2 flex-shrink-0`}>
                {is_sold ? t('product.soldOut') : <>{price.toLocaleString()} MRU</>}
              </div>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-1">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            {timeAgo && (
              <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                <span>{timeAgo}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${conditionClassName}`}>
              <ConditionIcon className="w-3 h-3 mr-1" />
              {t(`product.condition${condition.replace(/\s/g, '')}`)}
            </span>
            <span className="hidden group-hover:inline-block text-blue-600 font-medium whitespace-nowrap">
              {t('common.viewDetails')} →
            </span>
          </div>
        </div>
        {is_sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
            <div className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold transform rotate-[-15deg] shadow-lg">
              {t('product.sold')}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
} 