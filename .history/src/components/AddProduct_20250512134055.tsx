import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, uploadProductImage, getImageUrl, deleteProductImage } from '../lib/supabase';
import { categories } from '../data';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';

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
        navigate('/auth');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.backToHome')}
        </button>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">{t('product.addNew')}</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {uploadErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400">
                <h4 className="text-red-700 font-medium mb-2">{t('errors.uploadErrors')}</h4>
                <ul className="list-disc list-inside">
                  {uploadErrors.map((error, index) => (
                    <li key={index} className="text-red-600 text-sm">
                      {error.file.name}: {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-gray-900 mb-4">
                    {t('product.images')}
                  </label>
                  
                  {/* Main Image Upload */}
                  <div className="mb-6">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="main-image"
                        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          mainImagePreview ? 'border-blue-600' : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {mainImagePreview ? (
                          <div className="relative w-full h-full">
                            <img
                              src={mainImagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                              <p className="text-white font-medium">Change main image</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-12 h-12 text-gray-400 mb-3" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 800x400px)</p>
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
                  </div>

                  {/* Additional Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('product.additionalImages')}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {additionalImagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={preview}
                            alt={`Additional ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
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
                        className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                      >
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Add image</span>
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
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-1 gap-y-8">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      {t('product.title')}
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      {t('product.description')}
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        {t('product.price')} (MRU)
                      </label>
                      <input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        {t('product.category')}
                      </label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        required
                      >
                        <option value="">{t('product.selectCategory')}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {t(`categories.${category.name}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        {t('product.location')}
                      </label>
                      <input
                        id="location"
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                        {t('product.condition')}
                      </label>
                      <select
                        id="condition"
                        value={formData.condition}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        required
                      >
                        <option value="">{t('product.selectCondition')}</option>
                        <option value="New">{t('product.conditionNew')}</option>
                        <option value="Like New">{t('product.conditionLikeNew')}</option>
                        <option value="Good">{t('product.conditionGood')}</option>
                        <option value="Fair">{t('product.conditionFair')}</option>
                        <option value="Poor">{t('product.conditionPoor')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('product.features')}
                    </label>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            placeholder={index === formData.features.length - 1 ? t('product.addFeature') : ""}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          {index < formData.features.length - 1 && (
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 relative"
                >
                  {loading ? (
                    <>
                      <div className="absolute inset-0 bg-blue-600 rounded-md overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="relative">{t('common.uploading')}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      {t('product.addProduct')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}