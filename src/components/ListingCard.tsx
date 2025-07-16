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
    id?: string; // Add seller ID for linking to seller profile
    name: string;
    avatar_url?: string;
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

  price,
  location,
  image,
  secondaryImages = [],
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
    <Link to={`/product/${id}`} className="block group">
      <div className="bg-transparent flex flex-col w-full min-w-0 group relative">
        {/* Square image container with hover overlay */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 border border-black/20">
          <img
            src={imageUrl}
            alt={title}
            className={`w-full h-full object-cover object-center transition-all duration-300 ${is_sold ? 'opacity-70' : ''} group-hover:blur-sm group-hover:opacity-60`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/placeholder-image.jpg') {
                target.src = '/placeholder-image.jpg';
              }
            }}
          />
          {/* Picture icon and count */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-full text-xs transition-all duration-300 group-hover:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7V6a2 2 0 012-2h12a2 2 0 012 2v1M4 7h16M4 7v11a2 2 0 002 2h12a2 2 0 002-2V7M8 11a2 2 0 100-4 2 2 0 000 4zm8 4l-3-4-4 5" /></svg>
            <span>{1 + (Array.isArray(secondaryImages) ? secondaryImages.length : 0)}</span>
          </div>
          {/* Price tag */}
          <div className="absolute top-2 right-2 z-10 transition-all duration-300 group-hover:opacity-50">
            <div className={`${is_sold ? 'bg-gray-200 text-gray-700' : 'bg-yellow-400 text-black'} px-3 py-1 rounded-full text-xs font-semibold shadow-md`}>
              {is_sold ? (
                <span>{t('product.soldOut')}</span>
              ) : (
                <>{price.toLocaleString()} MRU</>
              )}
            </div>
          </div>
          {/* Sold indicator */}
          {is_sold && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold rotate-[-20deg] shadow-lg">
                {t('product.sold')}
              </div>
            </div>
          )}
          {/* Hover overlay with button */}
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 w-full h-full flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
              <button className="pointer-events-auto px-6 py-2 rounded-full bg-white text-blue-700 font-semibold text-base shadow-lg transform transition-all duration-300 scale-90 group-hover:scale-100 group-hover:opacity-100 opacity-0">
                {t('common.viewDetails')}
              </button>
            </div>
          </div>
        </div>
        {/* Product details below image, aligned left, only name and location */}
        <div className="w-full flex flex-col items-start px-2 transition-all duration-300 group-hover:blur-sm group-hover:opacity-60">
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">{title}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <MapPin className="w-4 h-4" />
            <span className="truncate max-w-[120px]">{location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}