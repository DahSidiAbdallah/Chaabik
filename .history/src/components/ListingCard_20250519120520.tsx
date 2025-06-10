import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Star } from 'lucide-react';
import { getImageUrl } from '../lib/supabase';

interface ListingCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  image: string;
  condition: string;
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

  return (
    <Link to={`/product/${id}`} className="block group">
      <div className="bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg">
          <img
            src={imageUrl}
            alt={title}
            className="h-48 sm:h-64 w-full object-cover object-center group-hover:opacity-90 transition-opacity"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/placeholder-image.jpg') {
                target.src = '/placeholder-image.jpg';
              }
            }}
          />
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
              {title}
            </h3>
            <div className="bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
              ${price.toLocaleString()}
            </div>
          </div>
          
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 overflow-hidden">
              {/* Placeholder for seller avatar */}
              <div className="w-full h-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
            </div>
            <span className="text-sm text-gray-600">{seller.name}</span>
            <div className="mx-2 text-gray-300">•</div>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{location}</span>
            </div>
          </div>
          
          <div className="flex mb-3">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < Math.round(seller.rating) ? 'text-yellow-400' : 'text-gray-200'}`} 
                fill={i < Math.round(seller.rating) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {description}
          </p>
          
          <div className="text-xs text-gray-500 border-t pt-2 mt-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                Condition: <span className="font-medium">{condition}</span>
              </div>
              <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-4 py-1.5 rounded-full text-xs transition-colors hidden group-hover:block">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}