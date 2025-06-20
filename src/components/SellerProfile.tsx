import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Calendar, ShoppingBag } from 'lucide-react';
import { ListingCard } from './ListingCard';
import { Footer } from './Footer';
import { formatTimeAgo } from '../lib/utils';

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
      if (!id) {
        setError('Seller ID is required');
        setLoading(false);
        return;
      }

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
          setError('Seller not found');
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
          setError('Error loading listings');
          return;
        }
        
        // Count sold items
        const soldItemsCount = listings ? listings.filter(item => item.is_sold).length : 0;
        
        // Update total_sales in seller_profile if it doesn't match
        if (profile && profile.total_sales !== soldItemsCount) {
          const { error: updateError } = await supabase
            .from('seller_profiles')
            .update({ total_sales: soldItemsCount })
            .eq('id', id);
            
          if (updateError) {
            console.error('Error updating total_sales:', updateError);
          } else {
            // Update local state
            setSeller({
              ...profile,
              total_sales: soldItemsCount
            });
          }
        }
        
        setSellerListings(listings || []);
      } catch (err) {
        console.error('Error fetching seller data:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSellerProfile();
  }, [id]);

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
            {error || 'Seller not found'}
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

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Seller Profile Header */}
            <div className="px-6 py-8 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-5">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {seller.name?.charAt(0) || '?'}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{seller.name}</h1>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      <span>{t('product.memberSince')} {new Date(seller.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ShoppingBag className="w-4 h-4 mr-1.5" />
                      <span>{seller.total_sales} {t('product.sales')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller's Listings */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {seller.name}'s {t('product.myListings')}
              </h2>
              
              {sellerListings.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">{t('product.noListings')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sellerListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      id={listing.id}
                      title={listing.title}
                      description={listing.description}
                      price={listing.price}
                      location={listing.location}
                      image={listing.image_url}
                      condition={listing.condition}
                      createdAt={listing.created_at}
                      is_sold={listing.is_sold}
                      seller={{
                        name: seller.name,
                        rating: seller.rating || 5,
                        phone: seller.phone || '',
                        joinedDate: seller.created_at,
                        totalSales: seller.total_sales || 0,
                        responseRate: seller.response_rate || 100
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}