import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, uploadProductImage, getImageUrl, deleteProductImage } from '../lib/supabase';
import { categories } from '../data';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, X, Upload, Image as ImageIcon, MapPin, ChevronDown } from 'lucide-react';

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
            setAdditionalImagePreviews(prev => [...prev, ...validPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    setFormData(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, ...validFiles]
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

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    if (index === formData.features.length - 1 && value.trim() !== '') {
      newFeatures.push('');
    }
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData({ ...formData, features: newFeatures });
    }
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
    <div className="min-h-screen flex flex-col bg-gray-50">
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg shadow-sm">
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          {uploadErrors.length > 0 && (
            <div className="mb-6 bg-red-50 p-4 rounded-lg shadow-sm">
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
          
          {loading && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="mr-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">{t('common.uploading')}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">{t('product.productDetails')}</h2>
              <p className="text-gray-500 text-sm mt-1">{t('product.fillInformation')}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Main Image Upload */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('product.mainImage')} <span className="text-red-500">*</span>
                </label>
                <label
                  htmlFor="main-image"
                  className="relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100"
                >
                  {mainImagePreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={mainImagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                        <p className="text-white font-medium">{t('product.changeMainImage')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <ImageIcon className="w-16 h-16 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-600 font-medium">
                        {t('product.uploadMainImage')}
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP, GIF (max 10MB)</p>
                    </div>
                  )}
                  <input
                    id="main-image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    required
                  />
                </label>
              </div>

              {/* Product Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('product.title')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder={t('product.titlePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('product.price')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-4 pr-16 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder={t('product.pricePlaceholder')}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 font-medium">MRU</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('product.description')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  rows={4}
                  placeholder={t('product.descriptionPlaceholder')}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
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
                      <option value="">{t('categories.all')}</option>
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
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
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

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('product.location')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder={t('product.locationPlaceholder')}
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Features/Specifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('product.features')}
                  </label>
                </div>
                <div className="space-y-3">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400"
                        placeholder={t('product.featurePlaceholder')}
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('product.additionalImages')}
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {additionalImagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={preview}
                        alt={`Additional ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label
                    className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center p-4">
                      <Plus className="w-8 h-8 text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500 text-center">{t('product.addMore')}</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesChange}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-3"></div>
                      {t('common.uploading')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      {t('product.publishListing')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}