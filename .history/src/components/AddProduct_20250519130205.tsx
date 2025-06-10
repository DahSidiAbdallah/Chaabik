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
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('product.back')}
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left side - Image Upload */}
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-medium text-gray-800 mb-6">{t('product.add')}</h2>
            
            {/* Main Image Upload */}
            <div className="mb-6">
              <label
                htmlFor="main-image"
                className="relative flex flex-col items-center justify-center w-full h-96 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-gray-50"
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
                    <ImageIcon className="w-16 h-16 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-500">
                      {t('product.images')}
                    </p>
                    <p className="text-xs text-gray-500">Upload images or use Drag & Drop</p>
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

            {/* Additional Images */}
            <div className="grid grid-cols-4 gap-3">
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
                className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
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

          {/* Right side - Item Details */}
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-medium text-gray-800 mb-6">{t('product.title')}</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-600 mb-1">
                  {t('product.title')}
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-600 mb-1">
                  {t('product.price')}
                </label>
                <input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-1">
                  {t('product.description')}
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-600 mb-1">
                  {t('product.category')}
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400 appearance-none"
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

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-600 mb-1">
                  {t('product.condition')}
                </label>
                <select
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400 appearance-none"
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

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-600 mb-1">
                  {t('product.location')}
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-md transition-colors"
              >
                {loading ? t('common.uploading') : t('product.add')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}