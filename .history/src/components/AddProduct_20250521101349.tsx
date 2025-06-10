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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t('product.back')}
            </button>
          </div>
          
          <div className="flex-1 max-w-sm">
            <nav className="flex space-x-4">
              <a href="#" className="px-3 py-2 text-sm font-medium">
                Womenswear
              </a>
              <a href="#" className="px-3 py-2 text-sm font-medium">
                Menswear
              </a>
              <a href="#" className="px-3 py-2 text-sm font-medium">
                Kidswear
              </a>
              <a href="#" className="px-3 py-2 text-sm font-medium">
                Beauty
              </a>
              <a href="#" className="px-3 py-2 text-sm font-medium">
                Hobbies
              </a>
              <a href="#" className="px-3 py-2 text-sm font-medium">
                Homeware
              </a>
            </nav>
          </div>
          
          <div>
            <button className="bg-white border border-gray-300 text-gray-800 rounded-full px-4 py-2 text-sm font-medium">
              Sell items
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg">
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          {uploadErrors.length > 0 && (
            <div className="mb-6 bg-red-50 p-4 rounded-lg">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Image Upload */}
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Add images</h2>
              
              {/* Main Image Upload */}
              <div className="mb-4">
                <label
                  htmlFor="main-image"
                  className="relative flex flex-col items-center justify-center w-full h-96 border border-gray-200 rounded-lg cursor-pointer transition-colors bg-white"
                >
                  {mainImagePreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={mainImagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <ImageIcon className="w-16 h-16 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600">
                        Upload images
                      </p>
                      <p className="text-xs text-gray-500">or use Drag & Drop</p>
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
              <div className="grid grid-cols-4 gap-4">
                {/* Generate 4 upload slots */}
                {[...Array(4)].map((_, index) => {
                  const hasImage = index < additionalImagePreviews.length;
                  return (
                    <label
                      key={index}
                      htmlFor={`additional-image-${index}`}
                      className="relative aspect-square flex items-center justify-center border border-gray-200 rounded-lg cursor-pointer transition-colors bg-white"
                    >
                      {hasImage ? (
                        <img
                          src={additionalImagePreviews[index]}
                          alt={`Additional ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-white"></div>
                      )}
                      <input
                        id={`additional-image-${index}`}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAdditionalImagesChange}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
            
            {/* Right Column - Form */}
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">List your item</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400 appearance-none"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <div className="relative">
                    <select
                      id="condition"
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400 appearance-none"
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
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg transition-colors"
                  >
                    {loading ? t('common.uploading') : 'Upload now'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-serif font-bold mb-4">Sellerlist</h3>
              <p className="text-gray-600 text-sm">
                Your number one site for selling and buying clothes, cosmetics and home goods.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Buy</h4>
              <ul className="space-y-2 text-sm">
                <li>Create a profile</li>
                <li>Set up payment type</li>
                <li>Inbox</li>
              </ul>
              
              <h4 className="font-medium mt-6 mb-4">Sell</h4>
              <ul className="space-y-2 text-sm">
                <li>Create a profile</li>
                <li>List your items</li>
                <li>Boost your items</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Help</h4>
              <ul className="space-y-2 text-sm">
                <li>FAQ</li>
                <li>Customer service</li>
                <li>How to guides</li>
                <li>Contact us</li>
                <li>Terms and conditions</li>
                <li>Privacy policy</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}