import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Tag, ChevronRight } from 'lucide-react';
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
    <Link to={`/product/${id}`} className="block group mb-3 sm:mb-4 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded-lg">
      <div className={`relative bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-200 flex flex-col sm:flex-row sm:h-36 md:h-40 ${is_sold ? 'opacity-60 filter grayscale-[60%]' : ''}`}>
        {/* Image Container - Standardized Height */}
        <div className="w-full h-48 sm:w-36 sm:h-full md:w-40 md:h-full flex-shrink-0 bg-gray-100 group-hover:opacity-95 transition-opacity">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover object-center"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.jpg'; }}
          />
        </div>
        
        {/* Details Container (main flex child for text content) */}
        <div className="p-3 sm:p-4 flex-grow flex flex-col w-full">
          {/* Upper part of details: Title, Price, and Time Ago (on the far right) */}
          <div className="flex justify-between items-start mb-1 sm:mb-2 w-full">
            {/* Left side: Title and Price */}
            <div className="flex-grow min-w-0 pr-2">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 line-clamp-2 group-hover:text-yellow-700 transition-colors">
                {title}
              </h3>
              {!is_sold && (
                <div className="flex items-center text-sm text-yellow-700 font-bold mt-0.5">
                  <Tag className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  <span>{price.toLocaleString()} MRU</span>
                </div>
              )}
              {is_sold && (
                 <div className="text-sm text-red-600 font-semibold mt-0.5">
                    {t('product.soldOut')}
                 </div>
              )}
            </div>
            {/* Right side: Time Ago */}
            {timeAgo && (
              <div className="flex-shrink-0 text-xs sm:text-sm text-gray-500 whitespace-nowrap pl-2 sm:pl-3 pt-0.5">
                <div className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-gray-400 flex-shrink-0" />
                  <span>{timeAgo}</span>
                </div>
              </div>
            )}
          </div>

          {/* Middle spacer (pushes bottom content down) */}
          <div className="flex-grow"></div> 

          {/* Bottom section: Location, Condition, and View Details link */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 mt-2 pt-2 sm:pt-3 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 mb-2 sm:mb-0">
              <div className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400 flex-shrink-0" />
                <span className="truncate max-w-[180px] sm:max-w-[200px]">{location}</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${conditionClassName}`}>
                <ConditionIcon className="w-3.5 h-3.5 mr-1.5" />
                {t(`product.condition${condition.replace(/\s/g, '')}`)}
              </span>
            </div>
            <span className="hidden sm:group-hover:flex items-center text-blue-600 font-semibold whitespace-nowrap text-sm mt-1 sm:mt-0 self-start sm:self-auto">
              {t('common.viewDetails')}
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Sold Overlay */}
        {is_sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 pointer-events-none rounded-lg">
            <div className="bg-red-700 text-white px-5 py-1.5 rounded-md text-base sm:text-lg font-bold transform -rotate-12 shadow-2xl border-2 border-white/80">
              {t('product.sold')}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
} 