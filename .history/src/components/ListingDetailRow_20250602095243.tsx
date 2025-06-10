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
    if (image && (image.startsWith('http://') || image.startsWith('https://'))) return image;
    if (image && !image.includes('/')) return getImageUrl(image);
    if (image) return getImageUrl(image);
    return '/placeholder-image.jpg';
  }, [image]);

  const timeAgo = formatTimeAgo(createdAt);

  return (
    <Link to={`/product/${id}`} className="block group mb-3 sm:mb-4 w-full">
      <div className={`relative bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 flex flex-col sm:flex-row ${is_sold ? 'opacity-60 filter grayscale-[50%]' : ''}`}>
        {/* Image Container */}
        <div className="w-full h-48 sm:w-40 sm:h-auto md:w-48 flex-shrink-0 bg-gray-100">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover object-center group-hover:opacity-90 transition-opacity"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.jpg'; }}
          />
        </div>
        
        {/* Details Container */}
        <div className="p-3 sm:p-4 flex-grow flex flex-col justify-between w-full">
          <div>
            {/* Top section: Title and Price */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-1 sm:mb-2">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 line-clamp-2 group-hover:text-yellow-600 order-1 sm:order-none w-full sm:w-auto">
                {title}
              </h3>
              <div className={`${is_sold ? 'bg-gray-300 text-gray-600' : 'bg-yellow-400 text-black'} px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm whitespace-nowrap ml-0 sm:ml-2 mt-1 sm:mt-0 order-none sm:order-1 self-start sm:self-auto`}>
                {is_sold ? t('product.soldOut') : <>{price.toLocaleString()} MRU</>}
              </div>
            </div>

            {/* Middle section: Location, Time, Condition as a row */}
            <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0 sm:space-x-3 mb-2 sm:mb-3">
              <div className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{location}</span>
              </div>
              {timeAgo && (
                <div className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-gray-400 flex-shrink-0" />
                  <span>{timeAgo}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom section: Condition and View Details */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-2 sm:pt-3 border-t border-gray-100">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${conditionClassName}`}>
              <ConditionIcon className="w-3.5 h-3.5 mr-1.5" />
              {t(`product.condition${condition.replace(/\s/g, '')}`)}
            </span>
            <span className="hidden sm:group-hover:inline-block text-blue-600 font-semibold whitespace-nowrap text-sm">
              {t('common.viewDetails')} →
            </span>
          </div>
        </div>

        {/* Sold Overlay - improved visibility */}
        {is_sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 pointer-events-none">
            <div className="bg-red-600 text-white px-6 py-2 rounded-md text-lg font-bold transform rotate-[-12deg] shadow-xl border-2 border-white">
              {t('product.sold')}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
} 