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
  image_url: string;
  condition: string;
  created_at: string;
  seller_profile?: {
    name: string;
    phone: string;
  };
}

export function ListingCard({
  id,
  title,
  description,
  price,
  location,
  image_url,
  condition,
  created_at,
  seller_profile
}: ListingCardProps) {
  const { t } = useTranslation();
  const imageUrl = getImageUrl(image_url);

  return (
    <Link to={`/product/${id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-w-16 aspect-h-9">
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-48"
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
              <Clock className="w-4 h-4 mr-1" />
              <span>{new Date(created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {seller_profile && (
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Star className="w-4 h-4 mr-1 text-yellow-400" />
              <span>{seller_profile.name}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}