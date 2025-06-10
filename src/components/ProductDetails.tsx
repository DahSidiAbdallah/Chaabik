import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Star, Phone, Clock, Package, BadgeCheck, ArrowLeft, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { listings as fallbackListings } from '../data';
import { getImageUrl } from '../lib/supabase';
import { formatTimeAgo } from '../lib/utils';

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCurrentUserSeller, setIsCurrentUserSeller] = useState(false);

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
              id,
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
          // Separate features from additional images
          const features = [];
          const additionalImages = [];
          
          if (Array.isArray(data.features)) {
            for (const item of data.features) {
              // If it's a URL, it's probably an image
              if (typeof item === 'string' && (
                  item.startsWith('http') || 
                  item.startsWith('/') || 
                  item.includes('.jpg') || 
                  item.includes('.png') || 
                  item.includes('.jpeg') ||
                  item.includes('.webp'))) {
                additionalImages.push(item);
              } else {
                features.push(item);
              }
            }
          }

          // Make sure to retrieve the phone number from the seller profile table
          let sellerPhone = '';
          if (data.seller && data.seller.phone) {
            sellerPhone = data.seller.phone;
            
            // Ensure proper formatting with +222 prefix if not already present
            if (!sellerPhone.startsWith('+')) {
              if (sellerPhone.startsWith('222')) {
                sellerPhone = '+' + sellerPhone;
              } else {
                sellerPhone = '+222' + sellerPhone;
              }
            }
          }
          
          // Map the database product to the format the UI expects
          const mappedProduct = {
            id: data.id,
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category,
            location: data.location,
            image: data.image_url, // Main image
            additionalImages: additionalImages, // Separate array for additional images
            condition: data.condition,
            features: features, // Only actual features, not images
            is_sold: data.is_sold || false, // Whether the item is marked as sold
            seller_id: data.seller_id, // Store seller ID to check if current user is the seller
            createdAt: data.created_at, // Add createdAt for the product itself
            seller: {
              name: data.seller?.name || 'Anonymous',
              rating: data.seller?.rating || 4.5, // This will be removed from display
              phone: sellerPhone,
              joinedDate: data.seller?.created_at || new Date().toISOString(),
              totalSales: data.seller?.total_sales || 0, // This will be removed from display
              responseRate: data.seller?.response_rate || 95 // This will be removed from display
            }
          };
          
          setProduct(mappedProduct);
          setSelectedImage(mappedProduct.image);
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

  // Check if current user is the seller of this product
  useEffect(() => {
    async function checkCurrentUser() {
      if (!product) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user && product.seller_id === user.id) {
        setIsCurrentUserSeller(true);
      }
    }
    
    checkCurrentUser();
  }, [product]);
  
  const toggleSoldStatus = async () => {
    if (!product || !isCurrentUserSeller) return;
    
    try {
      setIsUpdating(true);
      
      // Update the product in the database with specific fields
      const updateData = { 
        is_sold: !product.is_sold 
        // updated_at will be set automatically by the trigger
      };
      
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id);
        
      if (error) {
        console.error('Error updating product:', error);
        // Show an error notification or message to the user
        return;
      }
      
      // Update local state
      setProduct({
        ...product,
        is_sold: !product.is_sold
      });
    } catch (err) {
      console.error('Error toggling sold status:', err);
      // Show an error message to the user
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to get full image URL
  const getFullImageUrl = (imagePath: string | null): string => {
    if (!imagePath) return '/placeholder-image.jpg';
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    return getImageUrl(imagePath);
  };

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
        <div className="grid md:grid-cols-2 gap-4">
          {/* Main Image and Thumbnails */}
          <div className="space-y-4">
            <div className="relative h-96 bg-gray-100 rounded">
              <img
                src={getFullImageUrl(selectedImage || product.image)}
                alt={product.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src !== '/placeholder-image.jpg') {
                    img.src = '/placeholder-image.jpg';
                  }
                }}
              />
              <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-medium">
                {product.condition}
              </div>

              {/* Add Sold indicator */}
              {product.is_sold && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-600 text-white px-6 py-2 rounded-full text-xl font-bold transform rotate-[-20deg] shadow-lg">
                    {t('product.sold')}
                  </div>
                </div>
              )}
            </div>
            
            {/* Thumbnails row */}
            {product.additionalImages && product.additionalImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                <div 
                  className={`aspect-square cursor-pointer border-2 ${selectedImage === product.image ? 'border-yellow-400' : 'border-transparent'}`}
                  onClick={() => setSelectedImage(product.image)}
                >
                  <img 
                    src={getFullImageUrl(product.image)} 
                    alt="Main"
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                {product.additionalImages.slice(0, 4).map((img: string, index: number) => (
                  <div 
                    key={index}
                    className={`aspect-square cursor-pointer border-2 ${selectedImage === img ? 'border-yellow-400' : 'border-transparent'}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <img 
                      src={getFullImageUrl(img)} 
                      alt={`Additional ${index + 1}`}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {product.location}
                </div>
                {product.createdAt && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTimeAgo(product.createdAt)}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-teal-600">{product.price.toLocaleString()} MRU</div>
            </div>

            {/* Add Sold Status Toggle for product owner */}
            {isCurrentUserSeller && (
              <div className="mb-4">
                <button
                  onClick={toggleSoldStatus}
                  disabled={isUpdating}
                  className={`flex items-center ${
                    product.is_sold 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } px-4 py-2 rounded-md font-medium transition-colors`}
                >
                  {isUpdating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : (
                    <ShoppingBag className="w-4 h-4 mr-2" />
                  )}
                  {product.is_sold ? t('product.markAsAvailable') : t('product.markAsSold')}
                </button>
              </div>
            )}

            <div className="prose max-w-none text-gray-600 mb-6">
              {product.description}
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('product.features')}</h2>
                <ul className="grid gap-2">
                  {product.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2 mb-2">
                      <span className="text-yellow-500 font-medium">•</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </ul>
              </div>
            )}

            {/* Seller Info */}
            <div className="bg-gray-50 p-6 rounded-lg mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('product.sellerInfo')}</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-lg font-medium text-gray-900">{product.seller.name}</div>
                    {/* REMOVED Seller Rating */}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {t('product.memberSince')} {new Date(product.seller.joinedDate).toLocaleDateString()}
                  </div>
                  {/* REMOVED Total Sales */}
                  {/* REMOVED Response Rate */}
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {product.seller.phone || t('common.notProvided')}
                  </div>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black py-3 px-4 rounded-lg transition-colors"
                  onClick={() => {
                    // Ensure phone number is properly formatted for tel: protocol
                    let phoneNumber = product.seller.phone;
                    if (!phoneNumber.startsWith('+')) {
                      phoneNumber = '+' + phoneNumber;
                    }
                    window.location.href = `tel:${phoneNumber}`;
                  }}
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
  );
}