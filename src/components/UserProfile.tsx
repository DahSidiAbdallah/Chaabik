import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit, Trash, Eye, Check, X, ShoppingBag, Pencil } from 'lucide-react';
import { getImageUrl, uploadProductImage, deleteProductImage } from '../lib/supabase';
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
  const [editImages, setEditImages] = useState<string[]>([]); // URLs of existing images
  const [newImages, setNewImages] = useState<File[]>([]); // New files to upload
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Previews for new files
  const [mainImage, setMainImage] = useState<string | null>(null); // Main image URL or preview
  const [mainImageFile, setMainImageFile] = useState<File | null>(null); // Main image file

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
  }, []); // Only run on mount

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
      // Optimistically update local state (optional: can comment out if you want to wait for DB)
      // setUserListings(userListings.map(listing =>
      //   listing.id === listingId ? { ...listing, is_sold: !currentStatus } : listing
      // ));

      // Update in DB
      const { error } = await supabase
        .from('products')
        .update({ is_sold: !currentStatus })
        .eq('id', listingId);

      if (error) {
        console.error('Error updating listing status:', error);
        setError(`${t('errors.updateStatusFailed')}: ${error.message || 'Failed to update listing status'}`);
        return;
      }

      // Only update local state if DB update succeeded
      setUserListings(userListings.map(listing =>
        listing.id === listingId ? { ...listing, is_sold: !currentStatus } : listing
      ));

      // Update the seller's total_sales count
      const newSoldCount = userListings.filter(listing =>
        (listing.id === listingId ? !currentStatus : listing.is_sold)
      ).length;

      const { error: profileError } = await supabase
        .from('seller_profiles')
        .update({ total_sales: newSoldCount })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating total_sales:', profileError);
      } else {
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
    setMainImage(listing.image_url ? getImageUrl(listing.image_url) : null);
    setMainImageFile(null);
    // Assume additional images are in listing.features as URLs
    const additional = Array.isArray(listing.features)
      ? listing.features.filter((f: string) => typeof f === 'string' && (f.startsWith('http') || f.startsWith('/')))
      : [];
    setEditImages(additional);
    setNewImages([]);
    setImagePreviews([]);
    setEditModalOpen(true);
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setMainImage(URL.createObjectURL(file));
    }
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleRemoveExistingImage = (idx: number) => {
    setEditImages(editImages.filter((_, i) => i !== idx));
  };

  const handleRemoveNewImage = (idx: number) => {
    setNewImages(newImages.filter((_, i) => i !== idx));
    setImagePreviews(imagePreviews.filter((_, i) => i !== idx));
  };

  const handleSaveEdit = async () => {
    if (!listingToEdit) return;
    try {
      setIsUpdating(true);
      setError(null);
      if (!editFormData.title.trim() || !editFormData.price.trim() || !editFormData.location.trim()) {
        setError('Please fill in all required fields');
        return;
      }
      const price = parseFloat(editFormData.price);
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price');
        return;
      }
      // Upload main image if changed
      let mainImageUrl = listingToEdit.image_url;
      if (mainImageFile) {
        mainImageUrl = await uploadProductImage(mainImageFile, user.id);
      }
      // Upload new additional images
      let additionalImageUrls = [...editImages];
      for (const file of newImages) {
        const url = await uploadProductImage(file, user.id);
        additionalImageUrls.push(url);
      }
      // Update the listing
      const { error } = await supabase
        .from('products')
        .update({
          title: editFormData.title,
          price: price,
          location: editFormData.location,
          description: editFormData.description,
          image_url: mainImageUrl,
          features: additionalImageUrls,
        })
        .eq('id', listingToEdit.id);
      if (error) {
        setError('Failed to update listing');
        return;
      }
      // Update local state
      setUserListings(userListings.map(listing =>
        listing.id === listingToEdit.id
          ? {
              ...listing,
              title: editFormData.title,
              price: price,
              location: editFormData.location,
              description: editFormData.description,
              image_url: mainImageUrl,
              features: additionalImageUrls,
            }
          : listing
      ));
      setEditModalOpen(false);
      setListingToEdit(null);
    } catch (err) {
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

      {/* Edit Listing Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-0 max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <div className="flex items-center gap-2 text-blue-600">
                <Edit className="w-5 h-5" />
                <h3 className="text-lg font-bold">{t('product.editListing')}</h3>
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
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm mx-6 mt-4">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
              {/* Left: Images */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 3.13a4 4 0 010 7.75M12 7v.01M12 7a4 4 0 00-4 4v1a4 4 0 004 4 4 4 0 004-4v-1a4 4 0 00-4-4z" /></svg>
                    {t('product.addImages')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{t('product.imageHelp')}</p>
                </div>
                {/* Main Image Upload */}
                <div className="mb-4">
                  <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer transition-colors hover:border-yellow-300 bg-gray-50">
                    {mainImage ? (
                      <div className="relative w-full h-full">
                        <img src={mainImage} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                        <button type="button" onClick={e => { e.preventDefault(); setMainImage(null); setMainImageFile(null); }} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"><X className="w-5 h-5 text-red-500" /></button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        <span className="text-gray-700 font-medium text-sm mb-1">{t('product.dragOrClick')}</span>
                        <span className="text-xs text-gray-400 mb-2">{t('product.mainImageHelp')}</span>
                        <span className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 transition-colors rounded-md text-sm font-medium">{t('product.browseFiles')}</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainImageChange} />
                  </label>
                </div>
                {/* Additional Images */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('product.additionalImages')}</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {editImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square border border-yellow-200 rounded-lg overflow-hidden">
                        <img src={getImageUrl(img)} alt="listing" className="w-full h-full object-cover rounded-lg" />
                        <button type="button" onClick={() => handleRemoveExistingImage(idx)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"><X className="w-4 h-4 text-red-500" /></button>
                      </div>
                    ))}
                    {imagePreviews.map((img, idx) => (
                      <div key={idx} className="relative aspect-square border border-yellow-200 rounded-lg overflow-hidden">
                        <img src={img} alt="preview" className="w-full h-full object-cover rounded-lg" />
                        <button type="button" onClick={() => handleRemoveNewImage(idx)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"><X className="w-4 h-4 text-red-500" /></button>
                      </div>
                    ))}
                    {/* Add more images slot */}
                    <label className="aspect-square flex items-center justify-center border border-dashed border-gray-200 rounded-lg cursor-pointer transition-colors hover:border-yellow-300 bg-gray-50">
                      <div className="text-gray-400 flex flex-col items-center">
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        <span className="text-xs">{t('product.addMore')}</span>
                      </div>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
                    </label>
                  </div>
                </div>
              </div>
              {/* Right: Details Form */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{t('product.details')}</h3>
                  <p className="text-sm text-gray-500 mb-4">{t('product.detailsHelp')}</p>
                </div>
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">{t('product.title')}</label>
                  <input id="edit-title" type="text" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" required />
                </div>
                <div>
                  <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-2">{t('product.price')}</label>
                  <div className="flex rounded-lg overflow-hidden">
                    <div className="bg-gray-100 flex items-center justify-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg">
                      <span className="text-gray-600 font-medium whitespace-nowrap">MRU</span>
                    </div>
                    <input id="edit-price" type="number" value={editFormData.price} onChange={e => setEditFormData({ ...editFormData, price: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" required />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('product.priceCurrency')}</p>
                </div>
                <div>
                  <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-2">{t('product.location')}</label>
                  <input id="edit-location" type="text" value={editFormData.location} onChange={e => setEditFormData({ ...editFormData, location: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" required />
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">{t('product.description')}</label>
                  <textarea id="edit-description" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" required />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => { setEditModalOpen(false); setListingToEdit(null); }} className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">{t('common.cancel')}</button>
                  <button type="button" onClick={handleSaveEdit} disabled={isUpdating} className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-70 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center justify-center">
                    {isUpdating ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t('common.updating', 'Updating...')}</>) : (<><Check className="w-4 h-4 mr-2" />{t('common.save')}</>)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}