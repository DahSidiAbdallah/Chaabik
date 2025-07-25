import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Star, Calendar, ShoppingBag } from 'lucide-react';
import { getImageUrl } from '../lib/supabase';

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
  const formattedDate = React.useMemo(() => {
    if (!createdAt) return seller.joinedDate; // Fallback to seller join date if no item date
    
    const date = new Date(createdAt);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }, [createdAt, seller.joinedDate]);

  return (
    <Link to={`/product/${id}`} className="block group">
      <div className="bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md h-full border border-gray-100">
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className={`h-40 xs:h-48 sm:h-56 w-full object-cover object-center group-hover:opacity-90 transition-opacity ${is_sold ? 'opacity-70' : ''}`}
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
              <div className="bg-red-600 text-white px-4 xs:px-6 py-1 xs:py-2 rounded-full text-sm xs:text-lg font-bold transform rotate-[-20deg] shadow-lg">
                {t('product.sold')}
              </div>
            </div>
          )}
          
          {/* Price tag */}
          <div className="absolute top-2 right-2">
            <div className={`${is_sold ? 'bg-gray-200 text-gray-700' : 'bg-yellow-400 text-black'} px-3 py-1 rounded-full text-sm font-medium shadow-md`}>
              {is_sold ? (
                <span>{t('product.soldOut')}</span>
              ) : (
                <>{price.toLocaleString()} MRU</>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-3 xs:p-4">
          <h3 className="text-base xs:text-lg font-medium text-gray-900 line-clamp-1 mb-2">
            {title}
          </h3>
          
          <div className="flex items-center mb-2">
            <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-gray-200 mr-2 overflow-hidden flex-shrink-0">
              {/* Placeholder for seller avatar */}
              <div className="w-full h-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
            </div>
            <span className="text-xs xs:text-sm text-gray-600 truncate">{seller.name}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          
          <div className="flex items-center mb-2">
            <div className="flex mr-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 xs:w-4 xs:h-4 ${i < Math.round(seller.rating) ? 'text-yellow-400' : 'text-gray-200'}`} 
                  fill={i < Math.round(seller.rating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">{seller.rating.toFixed(1)}</span>
          </div>
          
          <p className="text-xs xs:text-sm text-gray-600 line-clamp-2 mb-3 min-h-[2.5rem]">
            {description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2 mt-auto border-gray-100">
            <div>
              <span className="text-gray-500">{t('product.condition')}:</span> <span className="font-medium">{condition}</span>
            </div>
            <span className="hidden group-hover:inline-block text-blue-600 font-medium">
              {t('common.viewDetails')} →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}