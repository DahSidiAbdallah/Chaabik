import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Star } from 'lucide-react';
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
    <Link to={`/product/${id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-w-16 aspect-h-9">
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-48"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.log('Image load error:', image, 'URL used:', imageUrl);
              if (target.src !== '/placeholder-image.jpg') {
                target.src = '/placeholder-image.jpg';
              }
            }}
          />
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-sm font-medium text-gray-800">
            {condition}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {description}
          </p>
          
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{location}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-blue-600">
              ${price.toLocaleString()}
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <Star className="w-4 h-4 mr-1 text-yellow-400" />
              <span>{seller.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center text-sm text-gray-600">
            <span>{seller.name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}