import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';
import { ListingCard } from './ListingCard';
import { CategoryList } from './CategoryList';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { Footer } from './Footer';
import { categories } from '../data';
import { Target, Plus, Search, ChevronLeft, ChevronRight, ShieldCheck, CreditCard, Briefcase, UserCircle, BadgeCheck } from 'lucide-react';
import { supabase, isAuthenticated } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface DatabaseListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  condition: string;
  image_url: string;
  features: string[];
  seller_id: string;
  created_at: string;
  seller_profile?: {
    name: string;
    phone: string;
  };
}

export function HomePage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchBarCategory, setSearchBarCategory] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [listings, setListings] = useState<DatabaseListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings from database
  useEffect(() => {
    async function fetchListings() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            seller_profile:seller_profiles(name, phone)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // First check if there's a valid session
        const hasSession = await isAuthenticated();
        if (!hasSession) {
          setUser(null);
          setAuthChecked(true);
          return;
        }

        // If there's a session, try to get the user
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error fetching user:', error.message);
          // Clear any potentially expired session
          if (error.message.includes('expired') || error.message.includes('missing')) {
            await supabase.auth.signOut();
          }
          setUser(null);
        } else {
          setUser(user);
        }
      } catch (err) {
        console.error('Error in auth check:', err);
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
  };

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const searchFields = [
        listing.title,
        listing.description,
        listing.location,
        listing.condition,
        ...listing.features
      ];

      const matchesSearch = searchQuery === '' || searchFields.some(field =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const matchesCategory = !selectedSubcategory || listing.category === selectedSubcategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedSubcategory, listings]);

  const recentListings = useMemo(() => {
    return listings.slice(0, 5);
  }, [listings]);

  const recommendedListings = useMemo(() => {
    return listings.slice(3, 8);
  }, [listings]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Show a minimal loading state while checking authentication
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header - Simplified and cleaner */}
      <header className="bg-white py-4 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="flex items-center">
              <div className="bg-yellow-400 rounded-full p-2">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-yellow-400 ml-2">CHAABIK</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            {categories.slice(0, 6).map(category => (
              <Link 
                key={category.id}
                to={`/?category=${category.id}`} 
                className="text-sm font-medium text-gray-600 hover:text-gray-900">
                {t(`categories.${category.name}`)}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/auth" className="text-gray-700 px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50">
                  {t('auth.signUp')}
                </Link>
                <Link to="/auth" className="bg-yellow-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-500">
                  {t('auth.signIn')}
                </Link>
              </>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section with gradient background */}
      <section className="relative bg-gradient-to-b from-blue-600 to-blue-900 text-white">
        <div className="absolute inset-0 bg-[url('/images/dots-pattern.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-yellow-400">CHAABIK</span><br />
                {t('hero.title')}
              </h1>
              <p className="text-lg md:text-xl mb-8 max-w-md">
                {t('hero.subtitle', 'Discover unique items and connect with sellers near you. Your next favorite find is just a click away.')}
              </p>
              <div className="flex gap-4">
                <Link to="/add-product" className="bg-yellow-400 text-blue-900 px-6 py-3 rounded-md font-medium flex items-center gap-2 hover:bg-yellow-500 transition">
                  <Plus className="w-5 h-5" />
                  {t('product.add')}
                </Link>
                <Link to="/safety" className="bg-white bg-opacity-10 text-white px-6 py-3 rounded-md font-medium hover:bg-opacity-20 transition">
                  {t('safety.title')}
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
                <h2 className="text-blue-900 font-bold text-xl mb-4">{t('search.findItems')}</h2>
                <SearchBar 
                  onSearch={setSearchQuery}
                  selectedCategory={searchBarCategory}
                  onSelectCategory={setSearchBarCategory}
                />
                <div className="flex flex-wrap gap-2 mt-4">
                  {categories.slice(0, 5).map(category => (
                    <button 
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className="bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full hover:bg-gray-200">
                      {t(`categories.${category.name}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-10 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-500 mb-6 uppercase text-sm tracking-wider">{t('home.trustedBy')}</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="w-24 h-12 flex items-center justify-center opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition">
              <div className="text-blue-600 flex items-center">
                <Briefcase className="w-6 h-6 mr-1" />
                <span className="font-bold text-sm">BizCorp</span>
              </div>
            </div>
            <div className="w-24 h-12 flex items-center justify-center opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition">
              <div className="text-green-600 flex items-center">
                <CreditCard className="w-6 h-6 mr-1" />
                <span className="font-bold text-sm">PaySafe</span>
              </div>
            </div>
            <div className="w-24 h-12 flex items-center justify-center opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition">
              <div className="text-purple-600 flex items-center">
                <BadgeCheck className="w-6 h-6 mr-1" />
                <span className="font-bold text-sm">TrustMark</span>
              </div>
            </div>
            <div className="w-24 h-12 flex items-center justify-center opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition">
              <div className="text-red-600 flex items-center">
                <ShieldCheck className="w-6 h-6 mr-1" />
                <span className="font-bold text-sm">SecureX</span>
              </div>
            </div>
            <div className="w-24 h-12 flex items-center justify-center opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition">
              <div className="text-yellow-600 flex items-center">
                <UserCircle className="w-6 h-6 mr-1" />
                <span className="font-bold text-sm">UserOne</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">10M+</p>
              <p className="text-gray-600">{t('stats.users')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">125k+</p>
              <p className="text-gray-600">{t('stats.items')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">20k+</p>
              <p className="text-gray-600">{t('stats.dailyListings')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">30+</p>
              <p className="text-gray-600">{t('stats.countries')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-900 mb-8">{t('categories.browse')}</h2>
          <CategoryList
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            onSubcategorySelect={handleSubcategorySelect}
            categories={categories}
          />
        </div>
      </section>

      {/* Recently Listed Items Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-blue-900">{t('product.recentlyListed')}</h2>
            <div className="flex gap-2">
              <button className="p-2 rounded-full border border-gray-300 hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full border border-gray-300 hover:bg-gray-100">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* You Might Like Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-blue-900">{t('product.youMightLike')}</h2>
            <div className="flex gap-2">
              <button className="p-2 rounded-full border border-gray-300 hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full border border-gray-300 hover:bg-gray-100">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {recommendedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">{t('home.whyChooseUs')}</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 p-6 rounded-lg">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('features.easyToUse')}</h3>
              <p className="text-white text-opacity-80">{t('features.easyToUseDesc')}</p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-6 rounded-lg">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('features.smartSearch')}</h3>
              <p className="text-white text-opacity-80">{t('features.smartSearchDesc')}</p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-6 rounded-lg">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('features.secureTrade')}</h3>
              <p className="text-white text-opacity-80">{t('features.secureTradeDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Listings */}
      {selectedSubcategory && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">{t('product.filteredResults')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call To Action */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">{t('home.readyToStart')}</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">{t('home.readyToStartDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/add-product" className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-md font-medium hover:bg-yellow-500 transition">
              {t('product.add')}
            </Link>
            <Link to="/auth" className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 transition">
              {t('auth.signUp')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}