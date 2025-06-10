import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Star } from 'lucide-react';
import { getImageUrl } from '../lib/supabase';
import { useConditionStyles } from '../lib/hooks/useConditionStyles';
import { formatTimeAgo } from '../lib/utils';

interface ListingCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  image: string;
  condition: string;
  createdAt?: string; // Add optional date when the item was listed
  is_sold?: boolean; // Whether the item is sold
  seller: {
    name: string;
    rating: number;
    phone: string;
    joinedDate: string;
    totalSales: number;
    responseRate: number;
  };
}

export function ListingCard({
  id,
  title,
  description,
  price,
  location,
  image,
  condition,
  createdAt,
  is_sold = false,
  seller
}: ListingCardProps) {
  const { t } = useTranslation();
  const { className: conditionClassName, Icon: ConditionIcon } = useConditionStyles(condition);
  
  // Handle the image URL differently based on its format
  const imageUrl = React.useMemo(() => {
    // If it's a full URL (starts with http or https), use it directly
    if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
      return image;
    }
    
    // If it's a filename (like 1747132858821.png), use the getImageUrl function
    if (image && !image.includes('/')) {
      // For images stored directly in the root of the bucket
      return getImageUrl(image);
    }
    
    // If it's a path (like folder/filename.png), use getImageUrl
    if (image) {
      return getImageUrl(image);
    }
    
    // Fallback to placeholder
    return '/placeholder-image.jpg';
  }, [image]);

  // Format the date for display
  const timeAgo = React.useMemo(() => {
    return formatTimeAgo(createdAt);
  }, [createdAt]);

  return (
    <Link to={`/product/${id}`} className="block group h-full">
      <div className="bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md h-full border border-gray-100 flex flex-col">
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className={`h-36 xs:h-40 sm:h-48 w-full object-cover object-center group-hover:opacity-90 transition-opacity ${is_sold ? 'opacity-70' : ''}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/placeholder-image.jpg') {
                target.src = '/placeholder-image.jpg';
              }
            }}
          />
          
          {/* Sold indicator */}
          {is_sold && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-red-600 text-white px-3 xs:px-4 py-1 rounded-full text-xs xs:text-sm font-bold transform rotate-[-20deg] shadow-lg">
                {t('product.sold')}
              </div>
            </div>
          )}
          
          {/* Price tag */}
          <div className="absolute top-2 right-2">
            <div className={`${is_sold ? 'bg-gray-200 text-gray-700' : 'bg-yellow-400 text-black'} px-2 xs:px-3 py-1 rounded-full text-xs xs:text-sm font-medium shadow-md`}>
              {is_sold ? (
                <span>{t('product.soldOut')}</span>
              ) : (
                <>{price.toLocaleString()} MRU</>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-2 xs:p-3 sm:p-4 flex-grow flex flex-col">
          <h3 className="text-sm xs:text-base sm:text-lg font-medium text-gray-900 line-clamp-1 mb-1 xs:mb-2">
            {title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-y-1 mb-1 xs:mb-2">
            <div className="flex items-center mr-3 w-full xs:w-auto">
              <div className="w-4 h-4 xs:w-5 xs:h-5 rounded-full bg-gray-200 mr-1 overflow-hidden flex-shrink-0">
                {/* Placeholder for seller avatar */}
                <div className="w-full h-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              </div>
              <span className="text-xs text-gray-600 truncate max-w-[120px]">{seller.name}</span>
            </div>
            
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate max-w-[120px]">{location}</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 line-clamp-2 mb-3 min-h-[2rem] flex-grow">
            {description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2 mt-auto border-gray-100">
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${conditionClassName}`}>
                <ConditionIcon className="w-3 h-3 mr-1" />
                {t(`product.condition${condition.replace(/\s/g, '')}`)}
              </span>
            </div>
            {/* Display formatted time ago */}
            {timeAgo && (
              <span className="text-xs text-gray-500">{timeAgo}</span>
            )}
            <span className="hidden group-hover:inline-block text-blue-600 font-medium whitespace-nowrap">
              {t('common.viewDetails')} →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}