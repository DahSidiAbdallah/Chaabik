import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, uploadProductImage, getImageUrl, deleteProductImage } from '../lib/supabase';
import { categories } from '../data';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronDown, Image as ImageIcon, X, Trash, Plus } from 'lucide-react';

interface UploadError {
  file: File;
  error: string;
}

export function EditListing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCurrentUserSeller, setIsCurrentUserSeller] = useState(false);
  const [originalImages, setOriginalImages] = useState<{
    mainImage: string | null;
    additionalImages: string[];
  }>({
    mainImage: null,
    additionalImages: []
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
    mainImage: null as File | null,
    additionalImages: [] as File[],
    condition: '',
    features: [''] as string[]
  });

  // Fetch the listing data
  useEffect(() => {
    async function fetchListing() {
      try {
        setInitialLoading(true);
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth', { state: { mode: 'signin', returnTo: `/profile` } });
          return;
        }

        // Fetch the listing
        const { data: listing, error: listingError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (listingError) {
          console.error('Error fetching listing:', listingError);
          setError('Error loading listing');
          return;
        }

        // Check if the current user is the seller
        if (listing.seller_id !== user.id) {
          setError('You do not have permission to edit this listing');
          return;
        }

        setIsCurrentUserSeller(true);

        // Separate features from additional images
        const features: string[] = [];
        const additionalImages: string[] = [];
        
        if (Array.isArray(listing.features)) {
          for (const item of listing.features) {
            // If it's a URL, it's probably an image
            if (typeof item === 'string' && (
                item.startsWith('http') || 
                item.startsWith('/') || 
                item.includes('.jpg') || 
                item.includes('.png') || 
                item.includes('.jpeg') ||
                item.includes('.webp'))) {
              additionalImages.push(item);
            } else if (item && typeof item === 'string') {
              features.push(item);
            }
          }
        }

        // Set original images for comparison later
        setOriginalImages({
          mainImage: listing.image_url,
          additionalImages
        });

        // Set form data
        setFormData({
          title: listing.title || '',
          description: listing.description || '',
          price: listing.price?.toString() || '',
          category: listing.category || '',
          location: listing.location || '',
          mainImage: null,
          additionalImages: [],
          condition: listing.condition || '',
          features: features.length > 0 ? features : ['']
        });

        // Set image previews
        if (listing.image_url) {
          setMainImagePreview(getImageUrl(listing.image_url));
        }
        
        setAdditionalImagePreviews(
          additionalImages.map(img => getImageUrl(img))
        );

      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while loading the listing');
      } finally {
        setInitialLoading(false);
      }
    }

    fetchListing();
  }, [id, navigate]);

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

      // Track which images need to be uploaded
      let mainImageUrl = originalImages.mainImage;
      let additionalImageUrls = [...originalImages.additionalImages];

      // Upload main image if changed
      if (formData.mainImage) {
        try {
          mainImageUrl = await uploadProductImage(formData.mainImage, user.id);
          setUploadProgress(30);
        } catch (error) {
          if (error instanceof Error) {
            setUploadErrors(prev => [...prev, { file: formData.mainImage!, error: error.message }]);
            throw new Error(t('errors.mainImageUploadFailed'));
          }
        }
      }

      // Upload additional images if added
      for (let i = 0; i < formData.additionalImages.length; i++) {
        const file = formData.additionalImages[i];
        try {
          const url = await uploadProductImage(file, user.id);
          additionalImageUrls.push(url);
          setUploadProgress(30 + (70 * (i + 1) / formData.additionalImages.length));
        } catch (error) {
          if (error instanceof Error) {
            setUploadErrors(prev => [...prev, { file, error: error.message }]);
            // Continue with other uploads even if one fails
            continue;
          }
        }
      }

      // Prepare features array (excluding images)
      const cleanFeatures = formData.features.filter(f => f.trim() !== '');

      // Update product data
      const { error: updateError } = await supabase
        .from('products')
        .update({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          location: formData.location,
          condition: formData.condition,
          image_url: mainImageUrl,
          features: [
            ...cleanFeatures,
            ...additionalImageUrls
          ]
        })
        .eq('id', id);

      if (updateError) {
        console.error('Product update error:', updateError);
        throw updateError;
      }

      navigate('/profile');
    } catch (err) {
      console.error('Edit product error:', err);
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
    // If it's an original image, mark it for removal
    if (index < originalImages.additionalImages.length) {
      const newAdditionalImages = [...originalImages.additionalImages];
      newAdditionalImages.splice(index, 1);
      setOriginalImages({
        ...originalImages,
        additionalImages: newAdditionalImages
      });
    } else {
      // If it's a newly added image, remove it from the formData
      const newIndex = index - originalImages.additionalImages.length;
      setFormData({
        ...formData,
        additionalImages: formData.additionalImages.filter((_, i) => i !== newIndex)
      });
    }
    
    // Update the previews
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addFeatureField = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    });
  };

  const updateFeature = (index: number, value: string) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    setFormData({
      ...formData,
      features: updatedFeatures.length > 0 ? updatedFeatures : ['']
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !isCurrentUserSeller) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-md w-full">
          <p className="font-medium">{error}</p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.backToHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white py-4 shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('common.backToHome')}
          </button>
          <h1 className="text-xl font-bold text-gray-900">{t('product.editListing')}</h1>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('product.editListing')}</h2>
            
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
                            // Don't clear originalImages.mainImage here - we'll handle that during submit
                          }}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                        >
                          <X className="w-5 h-5 text-red-500" />
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
                    {/* Show existing and new additional images */}
                    {additionalImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square border border-yellow-200 rounded-lg overflow-hidden">
                          <img
                            src={preview}
                            alt={`Additional ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(index)}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add more images slot */}
                    {additionalImagePreviews.length < 4 && (
                      <label
                        htmlFor="additional-image"
                        className="aspect-square flex items-center justify-center border border-dashed border-gray-200 rounded-lg cursor-pointer transition-colors hover:border-yellow-300 bg-gray-50"
                      >
                        <div className="text-gray-400 flex flex-col items-center">
                          <Plus className="w-6 h-6 mb-1" />
                          <span className="text-xs">{t('product.addMore')}</span>
                        </div>
                        <input
                          id="additional-image"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAdditionalImagesChange}
                        />
                      </label>
                    )}
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

                    {/* Features */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('product.features')}
                      </label>
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center mb-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            placeholder={t('product.featurePlaceholder')}
                            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-full"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addFeatureField}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t('product.addFeature')}
                      </button>
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
                  
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-grow py-3 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-70 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                            <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('common.uploading')}
                        </>
                      ) : t('common.update')}
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