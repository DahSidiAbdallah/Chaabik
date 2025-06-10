import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit, Trash, Eye, Check, X, ShoppingBag } from 'lucide-react';
import { getImageUrl } from '../lib/supabase';
import { Footer } from './Footer';

export function UserProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth', { state: { mode: 'signin', returnTo: '/profile' } });
          return;
        }
        
        setUser(user);
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('seller_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError('Error loading profile');
          return;
        }
        
        setProfile(profile);
        
        // Fetch user listings
        const { data: listings, error: listingsError } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
          
        if (listingsError) {
          console.error('Error fetching listings:', listingsError);
          setError('Error loading listings');
          return;
        }
        
        setUserListings(listings || []);
      } catch (err) {
        console.error('Profile error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [navigate]);

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;
    
    try {
      // Delete the listing
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', listingToDelete);
        
      if (error) {
        console.error('Error deleting listing:', error);
        setError(t('errors.deleteListingFailed'));
        return;
      }
      
      // Update the listings list
      setUserListings(userListings.filter(listing => listing.id !== listingToDelete));
      setDeleteModalOpen(false);
      setListingToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError('An unexpected error occurred');
    }
  };

  const handleToggleSoldStatus = async (listingId: string, currentStatus: boolean) => {
    try {
      // Make a more specific update with just the fields we need
      const updateData = { 
        is_sold: !currentStatus
        // updated_at will be set automatically by the trigger
      };
      
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', listingId);
        
      if (error) {
        console.error('Error updating listing status:', error);
        const errorMessage = error.message || 'Failed to update listing status';
        setError(`${t('errors.updateStatusFailed')}: ${errorMessage}`);
        return;
      }
      
      // Update the local state to reflect the change
      setUserListings(userListings.map(listing => 
        listing.id === listingId ? { ...listing, is_sold: !currentStatus } : listing
      ));
    } catch (err) {
      console.error('Update error:', err);
      setError(t('errors.unknown'));
    }
  };

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

  if (error && !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('common.backToHome')}
          </button>
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
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
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t('common.backToHome')}
            </button>
            
            <Link 
              to="/add-product" 
              className="bg-yellow-400 text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors flex items-center"
            >
              <span className="mr-2">+</span>
              {t('product.addNew')}
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Profile Header */}
            <div className="px-6 py-8 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-5">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.name || 'User'}</h1>
                  <p className="text-sm text-gray-500">
                    {t('product.memberSince')} {new Date(profile?.created_at || user?.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                  <p className="text-sm text-gray-500">{profile?.phone}</p>
                </div>
              </div>
            </div>

            {/* Listings */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('product.myListings')}</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}
              
              {userListings.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('product.noListings')}</h3>
                  <p className="text-gray-500 mb-6">{t('product.readyToSell')}</p>
                  <Link 
                    to="/add-product" 
                    className="px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-colors"
                  >
                    {t('product.addNew')}
                  </Link>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          {t('product.title')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('product.price')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('product.status')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('product.dateAdded')}
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">{t('product.actions')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {userListings.map((listing) => (
                        <tr key={listing.id} className={listing.is_sold ? "bg-gray-50" : ""}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <img 
                                  className="h-10 w-10 rounded-md object-cover" 
                                  src={listing.image_url ? getImageUrl(listing.image_url) : '/placeholder-image.jpg'} 
                                  alt="" 
                                />
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900 line-clamp-1">{listing.title}</div>
                                <div className="text-gray-500">{listing.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="text-gray-900 font-medium">{listing.price.toLocaleString()} MRU</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              listing.is_sold 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {listing.is_sold ? t('product.sold') : t('product.available')}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(listing.created_at).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleToggleSoldStatus(listing.id, !!listing.is_sold)}
                                className={`p-1 rounded-full ${listing.is_sold ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                                title={listing.is_sold ? t('product.markAsAvailable') : t('product.markAsSold')}
                              >
                                {listing.is_sold ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                              </button>
                              <Link
                                to={`/product/${listing.id}`}
                                className="p-1 rounded-full bg-blue-100 text-blue-700"
                                title={t('product.view')}
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => {
                                  setListingToDelete(listing.id);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1 rounded-full bg-red-100 text-red-700"
                                title={t('product.delete')}
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Trash className="w-6 h-6" />
              <h3 className="text-lg font-semibold">{t('confirmation.confirmDelete')}</h3>
            </div>
            <p className="text-gray-600 mb-6">{t('confirmation.deleteConfirmMessage')}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setListingToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteListing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('product.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 