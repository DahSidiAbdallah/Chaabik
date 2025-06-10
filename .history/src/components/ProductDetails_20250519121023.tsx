import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Star, Phone, Clock, Package, BadgeCheck, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { listings as fallbackListings } from '../data';
import { getImageUrl } from '../lib/supabase';

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true);
        
        // Try to fetch from Supabase products table
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            seller:seller_id(
              name, 
              phone,
              rating,
              total_sales,
              response_rate,
              created_at
            )
          `)
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching product:', error);
          
          // Fall back to static data if there's an error
          const fallbackProduct = fallbackListings.find(l => l.id === id);
          if (fallbackProduct) {
            setProduct(fallbackProduct);
          } else {
            setError('Product not found');
          }
          return;
        }
        
        if (data) {
          // Map the database product to the format the UI expects
          const mappedProduct = {
            id: data.id,
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category,
            location: data.location,
            image: data.image_url, // Map image_url to image
            condition: data.condition,
            features: Array.isArray(data.features) ? data.features : [],
            seller: {
              name: data.seller?.name || 'Anonymous',
              rating: data.seller?.rating || 4.5,
              phone: data.seller?.phone || '',
              joinedDate: data.seller?.created_at || new Date().toISOString(),
              totalSales: data.seller?.total_sales || 0,
              responseRate: data.seller?.response_rate || 95
            }
          };
          
          setProduct(mappedProduct);
        } else {
          // If no data returned, check static listings
          const fallbackProduct = fallbackListings.find(l => l.id === id);
          if (fallbackProduct) {
            setProduct(fallbackProduct);
          } else {
            setError('Product not found');
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('product.back')}
        </button>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error || 'Product not found'}
        </div>
      </div>
    );
  }

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
            src={
              product.image && (product.image.startsWith('http://') || product.image.startsWith('https://'))
                ? product.image
                : product.image
                ? getImageUrl(product.image)
                : '/placeholder-image.jpg'
            }
            alt={product.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log('Product details image error:', product.image);
              const img = e.target as HTMLImageElement;
              if (img.src !== '/placeholder-image.jpg') {
                img.src = '/placeholder-image.jpg';
              }
            }}
          />
          <div className="absolute top-4 right-4 bg-yellow-400 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
            {product.condition}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                {product.location}
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600">{product.price.toLocaleString()} MRU</div>
          </div>

          <div className="prose max-w-none text-gray-600 mb-6">
            {product.description}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('product.features')}</h2>
                <ul className="grid gap-2">
                  {product.features.map((feature, index) => (
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
                      <div className="text-lg font-medium text-gray-900">{product.seller.name}</div>
                      <div className="flex items-center text-yellow-400 ml-2">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="ml-1 text-gray-900">{product.seller.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {t('product.memberSince')} {new Date(product.seller.joinedDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      {product.seller.totalSales} {t('product.sales')}
                    </div>
                    <div>{t('product.responseRate')}: {product.seller.responseRate}%</div>
                  </div>

                  <button
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
                    onClick={() => window.location.href = `tel:${product.seller.phone}`}
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