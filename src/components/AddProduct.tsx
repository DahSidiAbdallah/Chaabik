import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, uploadProductImage, getImageUrl, deleteProductImage } from '../lib/supabase';
import { categories } from '../data';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronDown, Image as ImageIcon } from 'lucide-react';

interface UploadError {
  file: File;
  error: string;
}

export function AddProduct() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
    mainImage: null as File | null,
    additionalImages: [] as File[],
    condition: '',
    features: ['']
  });

  // Check if user profile exists
  useEffect(() => {
    async function checkUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to auth with return URL
        navigate('/auth', { state: { mode: 'signin', returnTo: '/add-product' } });
        return;
      }

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && !profile) {
        // If no profile exists, create a default one
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          setError(t('errors.notAuthenticated'));
          return;
        }

        // Create a basic profile
        const { data: newProfile, error: createError } = await supabase
          .from('seller_profiles')
          .insert({
            id: userData.user.id,
            name: userData.user.email?.split('@')[0] || 'User',
            phone: '+222XXXXXXXX' // Default placeholder
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create profile:', createError);
          setError(t('errors.profileCreationFailed'));
          return;
        }

        setUserProfile(newProfile);
      } else {
        setUserProfile(profile);
      }
    }

    checkUserProfile();
  }, [navigate, t]);

  const validateImage = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return t('errors.invalidFileType');
    }

    if (file.size > maxSize) {
      return t('errors.fileTooLarge', { maxSize: '10MB' });
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadErrors([]);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.notAuthenticated'));

      // Validate main image
      if (!formData.mainImage) {
        throw new Error(t('errors.mainImageRequired'));
      }

      // Upload main image
      let mainImageUrl = '';
      try {
        mainImageUrl = await uploadProductImage(formData.mainImage, user.id);
        setUploadProgress(50);
      } catch (error) {
        if (error instanceof Error) {
          setUploadErrors(prev => [...prev, { file: formData.mainImage!, error: error.message }]);
          throw new Error(t('errors.mainImageUploadFailed'));
        }
      }

      // Upload additional images
      const additionalImageUrls = [];
      for (let i = 0; i < formData.additionalImages.length; i++) {
        const file = formData.additionalImages[i];
        try {
          const url = await uploadProductImage(file, user.id);
          additionalImageUrls.push(url);
          setUploadProgress(50 + (50 * (i + 1) / formData.additionalImages.length));
        } catch (error) {
          if (error instanceof Error) {
            setUploadErrors(prev => [...prev, { file, error: error.message }]);
            // Continue with other uploads even if one fails
            continue;
          }
        }
      }

      // Insert product data
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          location: formData.location,
          condition: formData.condition,
          seller_id: user.id,
          image_url: mainImageUrl,
          is_sold: false, // Default to not sold when creating a new product
          features: [
            ...formData.features.filter(f => f.trim() !== ''),
            ...additionalImageUrls
          ]
        });

      if (insertError) {
        console.error('Product insertion error:', insertError);
        // If product insertion fails, clean up uploaded images
        await deleteProductImage(mainImageUrl);
        for (const url of additionalImageUrls) {
          await deleteProductImage(url);
        }
        throw insertError;
      }

      navigate('/');
    } catch (err) {
      console.error('Add product error:', err);
      setError(err instanceof Error ? err.message : t('errors.unknown'));
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateImage(file);
      if (validationError) {
        setUploadErrors([{ file, error: validationError }]);
        return;
      }

      setFormData({ ...formData, mainImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setUploadErrors([]);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newErrors: UploadError[] = [];
    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    files.forEach(file => {
      const validationError = validateImage(file);
      if (validationError) {
        newErrors.push({ file, error: validationError });
      } else {
        validFiles.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          validPreviews.push(reader.result as string);
          if (validPreviews.length === validFiles.length) {
            setAdditionalImagePreviews(prev => [...prev, ...validPreviews].slice(0, 4));
          }
        };
        reader.readAsDataURL(file);
      }
    });

    setFormData(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, ...validFiles].slice(0, 4)
    }));
    
    if (newErrors.length > 0) {
      setUploadErrors(prev => [...prev, ...newErrors]);
    }
  };

  const removeAdditionalImage = (index: number) => {
    setFormData({
      ...formData,
      additionalImages: formData.additionalImages.filter((_, i) => i !== index)
    });
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // If we're still checking the user profile, show a loading state
  if (userProfile === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white py-4 shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('product.back')}
          </button>
          <h1 className="text-xl font-bold text-gray-900">{t('product.addNew')}</h1>
          <div className="w-24"></div> {/* Spacer to balance the header */}
        </div>
      </header>

      <main className="flex-grow py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          {uploadErrors.length > 0 && (
            <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-100">
              <h3 className="text-red-700 font-medium mb-2">{t('errors.uploadProblems')}</h3>
              <ul className="text-red-600 text-sm space-y-1">
                {uploadErrors.map((err, i) => (
                  <li key={i}>
                    {err.file.name}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('product.addNew')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Image Upload */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-gray-500" />
                    {t('product.addImages')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{t('product.imageHelp')}</p>
                </div>
                
                {/* Main Image Upload */}
                <div className="mb-4">
                  <label
                    htmlFor="main-image"
                    className="relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer transition-colors hover:border-yellow-300 bg-gray-50"
                  >
                    {mainImagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={mainImagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setMainImagePreview(null);
                            setFormData({...formData, mainImage: null});
                          }}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="p-4 rounded-full bg-gray-100 mb-3">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {t('product.dragOrClick')}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">{t('product.mainImageHelp')}</p>
                        <span className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 transition-colors rounded-md text-sm font-medium">
                          {t('product.browseFiles')}
                        </span>
                      </div>
                    )}
                    <input
                      id="main-image"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleMainImageChange}
                    />
                  </label>
                </div>
                
                {/* Additional Images */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('product.additionalImages')}</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {/* Generate 4 upload slots */}
                    {[...Array(4)].map((_, index) => {
                      const hasImage = index < additionalImagePreviews.length;
                      return (
                        <div key={index} className="relative">
                          <label
                            htmlFor={`additional-image-${index}`}
                            className={`relative aspect-square flex items-center justify-center border ${hasImage ? 'border-yellow-200' : 'border-dashed border-gray-200'} rounded-lg cursor-pointer transition-colors ${hasImage ? 'bg-white' : 'hover:border-yellow-300 bg-gray-50'}`}
                          >
                            {hasImage ? (
                              <img
                                src={additionalImagePreviews[index]}
                                alt={`Additional ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-6 h-6 text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                            )}
                            <input
                              id={`additional-image-${index}`}
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleAdditionalImagesChange}
                            />
                          </label>
                          {hasImage && (
                            <button
                              type="button"
                              onClick={() => removeAdditionalImage(index)}
                              className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Form */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{t('product.details')}</h3>
                  <p className="text-sm text-gray-500 mb-4">{t('product.detailsHelp')}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('product.title')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder={t('product.titlePlaceholder')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('product.price')} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex rounded-lg overflow-hidden">
                        <div className="bg-gray-100 flex items-center justify-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg">
                          <span className="text-gray-600 font-medium whitespace-nowrap">MRU</span>
                        </div>
                        <input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{t('product.priceCurrency')}</p>
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('product.location')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="location"
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder={t('product.locationPlaceholder')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('product.description')} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={t('product.descriptionPlaceholder')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('product.category')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none"
                            required
                          >
                            <option value="">{t('product.selectCategory')}</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {t(`categories.${category.name}`)}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('product.condition')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="condition"
                            value={formData.condition}
                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none"
                            required
                          >
                            <option value="">{t('product.selectCondition')}</option>
                            <option value="New">{t('product.conditionNew')}</option>
                            <option value="Like New">{t('product.conditionLikeNew')}</option>
                            <option value="Good">{t('product.conditionGood')}</option>
                            <option value="Fair">{t('product.conditionFair')}</option>
                            <option value="Poor">{t('product.conditionPoor')}</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {loading && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-center">{t('common.uploading')} ({uploadProgress}%)</p>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-70 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('common.uploading')}
                        </>
                      ) : t('product.publishListing')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}