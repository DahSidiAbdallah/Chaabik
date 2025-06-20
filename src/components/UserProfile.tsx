import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit, Trash, Eye, Check, X, ShoppingBag, Pencil } from 'lucide-react';
import { getImageUrl } from '../lib/supabase';
import { AvatarUpload } from './AvatarUpload';
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [listingToEdit, setListingToEdit] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    price: '',
    location: '',
    description: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

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
        
        // Update total_sales in seller_profile if it doesn't match the actual count
        const soldItemsCount = listings ? listings.filter(item => item.is_sold).length : 0;
        
        if (profile && profile.total_sales !== soldItemsCount) {
          const { error: updateError } = await supabase
            .from('seller_profiles')
            .update({ total_sales: soldItemsCount })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('Error updating total_sales:', updateError);
          } else {
            // Update local state with the correct count
            setProfile({
              ...profile,
              total_sales: soldItemsCount
            });
          }
        }
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
      
      // Update the seller's total_sales count
      const newSoldCount = userListings.filter(listing => 
        (listing.id === listingId ? !currentStatus : listing.is_sold)
      ).length;
      
      // Update the profile in the database
      const { error: profileError } = await supabase
        .from('seller_profiles')
        .update({ total_sales: newSoldCount })
        .eq('id', user.id);
        
      if (profileError) {
        console.error('Error updating total_sales:', profileError);
      } else {
        // Update local state
        setProfile({
          ...profile,
          total_sales: newSoldCount
        });
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(t('errors.unknown'));
    }
  };

  const handleEditListing = (listing: any) => {
    setListingToEdit(listing);
    setEditFormData({
      title: listing.title,
      price: listing.price.toString(),
      location: listing.location,
      description: listing.description,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!listingToEdit) return;
    
    try {
      setIsUpdating(true);
      
      // Validate form data
      if (!editFormData.title.trim() || !editFormData.price.trim() || !editFormData.location.trim()) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Parse price to ensure it's a number
      const price = parseFloat(editFormData.price);
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price');
        return;
      }
      
      // Update the listing
      const { error } = await supabase
        .from('products')
        .update({
          title: editFormData.title,
          price: price,
          location: editFormData.location,
          description: editFormData.description,
        })
        .eq('id', listingToEdit.id);
        
      if (error) {
        console.error('Error updating listing:', error);
        setError('Failed to update listing');
        return;
      }
      
      // Update the local state
      setUserListings(userListings.map(listing => 
        listing.id === listingToEdit.id 
          ? { 
              ...listing, 
              title: editFormData.title,
              price: price,
              location: editFormData.location,
              description: editFormData.description,
            } 
          : listing
      ));
      
      // Close the modal
      setEditModalOpen(false);
      setListingToEdit(null);
    } catch (err) {
      console.error('Edit error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
        
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
        <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t('common.backToHome')}
            </button>
            
            <Link 
              to="/add-product" 
              className="bg-yellow-400 text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors flex items-center justify-center w-full sm:w-auto"
            >
              <span className="mr-2">+</span>
              {t('product.addNew')}
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Profile Header */}
            <div className="px-4 py-6 sm:px-6 sm:py-8 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <div className="flex-shrink-0 flex justify-center">
                  <AvatarUpload
                    userId={user?.id}
                    avatarUrl={profile?.avatar_url}
                    onUpload={async (filePath) => {
                      // Update avatar_url in seller_profiles
                      const { error } = await supabase
                        .from('seller_profiles')
                        .update({ avatar_url: filePath })
                        .eq('id', user.id);
                      if (!error) {
                        // Refetch profile after upload
                        const { data: updatedProfile } = await supabase
                          .from('seller_profiles')
                          .select('*')
                          .eq('id', user.id)
                          .single();
                        setProfile(updatedProfile);
                      }
                    }}
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.name || 'User'}</h1>
                  <p className="text-sm text-gray-500">
                    {t('product.memberSince')} {new Date(profile?.created_at || user?.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                  <p className="text-sm text-gray-500">{profile?.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('product.sales')}: {profile?.total_sales || 0}
                  </p>
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
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
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
                                onClick={() => handleEditListing(listing)}
                                className="p-1 rounded-full bg-indigo-100 text-indigo-700"
                                title={t('product.edit')}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
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

      {/* Edit Listing Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 text-blue-600 mb-4">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                <h3 className="text-lg font-semibold">{t('product.editListing')}</h3>
              </div>
              <button 
                onClick={() => {
                  setEditModalOpen(false);
                  setListingToEdit(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('product.title')}
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('product.price')}
                </label>
                <div className="flex rounded-md overflow-hidden">
                  <div className="bg-gray-100 flex items-center justify-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-md">
                    <span className="text-gray-600 font-medium">MRU</span>
                  </div>
                  <input
                    id="edit-price"
                    type="number"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('product.location')}
                </label>
                <input
                  id="edit-location"
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('product.description')}
                </label>
                <textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setListingToEdit(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('common.updating', 'Updating...')}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {t('common.save')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}