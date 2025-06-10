import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';
import { ListingCard } from './ListingCard';
import { CategoryList } from './CategoryList';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { Footer } from './Footer';
import { categories, listings as staticListings } from '../data';
import { Target, Plus, Search, ChevronLeft, ChevronRight, ShieldCheck, CreditCard, Briefcase, UserCircle, BadgeCheck, Menu, X } from 'lucide-react';
import { supabase, isAuthenticated } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import ChaabikLogo from '../assets/Chaabik.png';

export function HomePage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchBarCategory, setSearchBarCategory] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [listings, setListings] = useState(staticListings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [categoryName, setCategoryName] = useState<string | null>(null);

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      try {
        const hasSession = await isAuthenticated();
        if (!hasSession) {
          setUser(null);
          setAuthChecked(true);
          return;
        }

        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error fetching user:', error.message);
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

  // Parse URL parameters for category filtering
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setSelectedSubcategory(null); // Reset subcategory when changing main category
      
      // Find the category name for display purposes
      const category = categories.find(c => c.id === categoryParam);
      if (category) {
        setCategoryName(t(`categories.${category.name}`));
      }
    } else {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setCategoryName(null);
    }
  }, [location.search, t]);

  // Database fetch with better error handling
  useEffect(() => {
    async function fetchListings() {
      try {
        setIsLoading(true);
        console.log("Fetching listings from database...");
        
        // Main query
        let query = supabase
          .from('products')
          .select(`
            *,
            seller:seller_id(
              name, 
              phone,
              rating,
              total_sales,
              response_rate,
              created_at
            )
          `)
          .order('created_at', { ascending: false });
        
        // If a subcategory is selected, filter by that specific subcategory
        if (selectedSubcategory) {
          console.log("Filtering by subcategory:", selectedSubcategory);
          query = query.eq('category', selectedSubcategory);
        }
        // If only a main category is selected (but no subcategory)
        else if (selectedCategory) {
          // Find the category object to get its subcategories
          const categoryObj = categories.find(c => c.id === selectedCategory);
          if (categoryObj) {
            // Get all subcategory IDs for this category
            const subcategoryIds = categoryObj.subcategories.map(sub => sub.id);
            console.log("Filtering by subcategories of", selectedCategory, ":", subcategoryIds);
            query = query.in('category', subcategoryIds);
          }
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Database error:", error.message);
          setError(error.message);
          setDatabaseConnected(false);
          // Do NOT fallback to static listings - show empty state instead
          setListings([]);
        } else {
          console.log("Query results:", data.length, "products found");
          setDatabaseConnected(true);
          
          if (data.length === 0) {
            console.log("No products found for the selected category/subcategory");
            setListings([]); // Set empty array, not static listings
          } else {
            // Map the database structure to what your components expect
            const mappedProducts = data.map(product => ({
              id: product.id,
              title: product.title,
              description: product.description,
              price: product.price,
              category: product.category,
              location: product.location,
              image: product.image_url,
              condition: product.condition,
              features: Array.isArray(product.features) ? product.features : [],
              seller: {
                name: product.seller?.name || 'Anonymous',
                rating: product.seller?.rating || 4.5,
                phone: product.seller?.phone || '',
                joinedDate: product.seller?.created_at || new Date().toISOString(),
                totalSales: product.seller?.total_sales || 0,
                responseRate: product.seller?.response_rate || 95
              }
            }));
            
            setListings(mappedProducts);
          }
          setError(null);
        }
      } catch (err) {
        console.error("Database fetch error:", err);
        setError("Failed to load listings. Please try again later.");
        setDatabaseConnected(false);
        setListings([]); // Empty array, not static listings
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchListings();
  }, [selectedCategory, selectedSubcategory]); // Re-fetch when either changes

  // Fixed CategoryList handling
  const handleCategorySelect = (categoryId: string | null) => {
    if (categoryId === selectedCategory) {
      // If clicking the already selected category, just show its items
      // without requiring subcategory selection
      navigate(`/?category=${categoryId}`);
    } else {
      // Only update URL when clicking from navbar
    setSelectedCategory(categoryId);
      setSelectedSubcategory(null);
      if (categoryId) {
        navigate(`/?category=${categoryId}`);
      } else {
        navigate('/');
      }
    }
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    // Don't navigate here - just update the filter
  };

  const filteredListings = useMemo(() => {
    if (listings.length === 0) {
      return [];
    }
    
    return listings.filter((listing) => {
      // Search logic
      const searchFields = [
        listing.title,
        listing.description,
        listing.location,
        listing.condition,
        ...(listing.features || [])
      ];

      const matchesSearch = searchQuery === '' || searchFields.some(field =>
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // We don't need additional category filtering here since 
      // the database query already filtered by category
      return matchesSearch;
    });
  }, [searchQuery, listings]);

  // For the "Recently Added" section - get the 5 most recent listings regardless of category
  const recentListings = useMemo(() => {
    return listings.slice(0, 5); // First 5 listings, already sorted by created_at
  }, [listings]);

  const recommendedListings = useMemo(() => {
    return listings.slice(3, 8); // Different 5 listings for "You might like"
  }, [listings]);

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white py-4 shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img src={ChaabikLogo} alt="Chaabik Logo" className="h-10 w-auto" />
          </Link>
          
          <button
            className="lg:hidden text-gray-700 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="hidden lg:flex items-center space-x-8">
            {categories.slice(0, 6).map(category => (
              <Link 
                key={category.id}
                to={`/?category=${category.id}`} 
                className={`text-sm font-medium ${selectedCategory === category.id ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}>
                {t(`categories.${category.name}`)}
              </Link>
            ))}
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Link 
                  to="/auth" 
                  state={{ mode: 'signup' }}
                  className="text-gray-700 px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50"
                >
                  {t('auth.signUp')}
                </Link>
                <Link 
                  to="/auth" 
                  state={{ mode: 'signin' }}
                  className="bg-yellow-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-500"
                >
                  {t('auth.signIn')}
                </Link>
              </>
            )}
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center space-y-6">
            {categories.slice(0, 6).map(category => (
              <Link 
                key={category.id}
                to={`/?category=${category.id}`} 
                className="text-lg font-medium text-gray-600 hover:text-gray-900">
                {t(`categories.${category.name}`)}
              </Link>
            ))}
            <Link to="/terms" className="text-lg font-medium text-gray-600 hover:text-gray-900">
              Terms
            </Link>
            <Link to="/privacy" className="text-lg font-medium text-gray-600 hover:text-gray-900">
              Privacy
            </Link>
            <Link to="/faq" className="text-lg font-medium text-gray-600 hover:text-gray-900">
              FAQ
            </Link>
            <Link to="/rules" className="text-lg font-medium text-gray-600 hover:text-gray-900">
              Rules
            </Link>
            <Link to="/safety" className="text-lg font-medium text-gray-600 hover:text-gray-900">
              Safety Tips
            </Link>
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Link 
                  to="/auth" 
                  state={{ mode: 'signup' }}
                  className="text-gray-700 px-4 py-2 rounded-md border border-gray-300 text-lg font-medium hover:bg-gray-50"
                >
                  {t('auth.signUp')}
                </Link>
                <Link 
                  to="/auth" 
                  state={{ mode: 'signin' }}
                  className="bg-yellow-400 text-gray-700 px-4 py-2 rounded-md text-lg font-medium hover:bg-yellow-500"
                >
                  {t('auth.signIn')}
                </Link>
              </>
            )}
            <LanguageSwitcher />
            <button
              className="text-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        )}
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
                      onClick={() => setSearchBarCategory(category.id)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition"
                    >
                      {t(`categories.${category.name}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Categories Section */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('categories.browse')}</h2>
          <CategoryList
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            onSubcategorySelect={handleSubcategorySelect}
            categories={categories}
          />
        </div>
      </section>

        {/* Main Listings Grid */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {selectedSubcategory ? 
                t('subcategories.showingSubcategory', { subcategory: categories
                  .find(c => c.id === selectedCategory)?.subcategories
                  .find(s => s.id === selectedSubcategory)?.name || selectedSubcategory }) :
               categoryName ? 
                t('categories.showingCategory', { category: categoryName }) : 
                searchQuery ? 
                  t('search.results') : 
                  t('listings.all')
              }
            </h2>
            
            {!databaseConnected && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                Unable to connect to database. Please check your connection and try again.
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    description={listing.description}
                    price={listing.price}
                    location={listing.location}
                    image={listing.image}
                    condition={listing.condition}
                    seller={listing.seller}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-500 mb-4">
                  {categoryName 
                    ? t('categories.noCategoryItems', { category: categoryName }) 
                    : searchQuery 
                      ? t('search.noResults') 
                      : t('listings.noListings')}
                </div>
                {(selectedCategory || selectedSubcategory) && (
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    {t('common.viewAllItems')}
                  </button>
                )}
            </div>
            )}
        </div>
      </section>

        {/* Recently Added Section - Only show on the homepage */}
        {!selectedCategory && !selectedSubcategory && !searchQuery && (
          <section className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('listings.recent')}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {listings.slice(0, 5).map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    description={listing.description}
                    price={listing.price}
                    location={listing.location}
                    image={listing.image}
                    condition={listing.condition}
                    seller={listing.seller}
                  />
              ))}
            </div>
          </div>
        </section>
      )}
      </main>

      <Footer />
    </div>
  );
}