import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { ListingCard } from './ListingCard';
import { Footer } from './Footer';
import { ArrowLeft, User, Phone, Clock, ShoppingBag } from 'lucide-react';

export function SellerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [seller, setSeller] = useState<any>(null);
  const [sellerListings, setSellerListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSellerProfile() {
      try {
        setLoading(true);
        
        // Fetch seller profile
        const { data: profile, error: profileError } = await supabase
          .from('seller_profiles')
          .select('*')
          .eq('id', id)
          .single();
          
        if (profileError) {
          console.error('Error fetching seller profile:', profileError);
          setError(t('errors.sellerNotFound'));
          return;
        }
        
        setSeller(profile);
        
        // Fetch seller's listings
        const { data: listings, error: listingsError } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', id)
          .order('created_at', { ascending: false });
          
        if (listingsError) {
          console.error('Error fetching seller listings:', listingsError);
          setError(t('errors.listingsNotFound'));
          return;
        }
        
        // Map the listings to the expected format
        const mappedListings = listings.map(listing => ({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          category: listing.category,
          location: listing.location,
          image: listing.image_url,
          condition: listing.condition,
          features: Array.isArray(listing.features) ? listing.features : [],
          createdAt: listing.created_at,
          is_sold: listing.is_sold,
          seller: {
            name: profile.name,
            rating: profile.rating,
            phone: profile.phone,
            joinedDate: profile.created_at,
            totalSales: profile.total_sales,
            responseRate: profile.response_rate
          }
        }));
        
        setSellerListings(mappedListings);
      } catch (err) {
        console.error('Error:', err);
        setError(t('errors.unknown'));
      } finally {
        setLoading(false);
      }
    }
    
    fetchSellerProfile();
  }, [id, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('common.goBack')}
          </button>
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error || t('errors.sellerNotFound')}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('common.goBack')}
          </button>

          {/* Seller Profile Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-8 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-5">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-2xl font-bold">
                    {seller.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{seller.name}</h1>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {t('product.memberSince')} {new Date(seller.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ShoppingBag className="w-4 h-4 mr-1" />
                      {seller.total_sales} {t('product.sales')}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="w-4 h-4 mr-1" />
                      {seller.phone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seller's Listings */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {t('sellerProfile.listings')}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({sellerListings.length})
              </span>
            </h2>
            
            {sellerListings.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white rounded-lg shadow">
                <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('sellerProfile.noListings')}</h3>
                <p className="text-gray-500">{t('sellerProfile.noListingsMessage')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sellerListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    description={listing.description}
                    price={listing.price}
                    location={listing.location}
                    image={listing.image}
                    condition={listing.condition}
                    createdAt={listing.createdAt}
                    is_sold={listing.is_sold}
                    seller={listing.seller}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}