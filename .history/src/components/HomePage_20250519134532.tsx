import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';
import { ListingCard } from './ListingCard';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { Footer } from './Footer';
import { categories, listings as staticListings } from '../data';
import { 
  Target, Plus, Search, ChevronLeft, ChevronRight, ShieldCheck, 
  CreditCard, Briefcase, UserCircle, BadgeCheck, Menu, X, SlidersHorizontal
} from 'lucide-react';
import { supabase, isAuthenticated } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import ChaabikLogo from '../assets/Chaabik.png';

export function HomePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Price filter
  const [priceRange, setPriceRange] = useState<{min: number | null, max: number | null}>({min: null, max: null});
  
  // Location filter
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  
  // Condition filter
  const [conditionFilter, setConditionFilter] = useState<string | null>(null);

  // Parse URL parameters for category filtering
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      
      // Find the category name for display purposes
      const category = categories.find(c => c.id === categoryParam);
      if (category) {
        setCategoryName(t(`categories.${category.name}`));
        setIsFiltersOpen(true);
      }
    } else {
      setSelectedCategory(null);
      setCategoryName(null);
    }
  }, [location.search, t]);

  // Database fetch
  useEffect(() => {
    async function fetchListings() {
      try {
        setIsLoading(true);
        
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
        
        // If a category is selected
        if (selectedCategory) {
          // Find the category object
          const categoryObj = categories.find(c => c.id === selectedCategory);
          
          if (categoryObj) {
            // Get all subcategory IDs for this category
            const subcategoryIds = categoryObj.subcategories.map(sub => sub.id);
            query = query.in('category', subcategoryIds);
          }
        }
        
        // Apply price filter if set
        if (priceRange.min !== null) {
          query = query.gte('price', priceRange.min);
        }
        if (priceRange.max !== null) {
          query = query.lte('price', priceRange.max);
        }
        
        // Apply location filter if set
        if (locationFilter) {
          query = query.ilike('location', `%${locationFilter}%`);
        }
        
        // Apply condition filter if set
        if (conditionFilter) {
          query = query.eq('condition', conditionFilter);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Database error:", error.message);
          setError(error.message);
          setDatabaseConnected(false);
          
          // Fall back to static listings if needed
          if (selectedCategory) {
            const categoryObj = categories.find(c => c.id === selectedCategory);
            if (categoryObj) {
              const subcategoryIds = categoryObj.subcategories.map(sub => sub.id);
              const filteredStatic = staticListings.filter(listing => 
                subcategoryIds.includes(listing.category)
              );
              setListings(filteredStatic);
            } else {
              setListings([]);
            }
          } else {
            setListings(staticListings);
          }
        } else {
          setDatabaseConnected(true);
          
          if (data && data.length > 0) {
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
          } else if (selectedCategory) {
            // Fall back to static listings filtered by category if no results
            const categoryObj = categories.find(c => c.id === selectedCategory);
            if (categoryObj) {
              const subcategoryIds = categoryObj.subcategories.map(sub => sub.id);
              const filteredStatic = staticListings.filter(listing => 
                subcategoryIds.includes(listing.category)
              );
              setListings(filteredStatic);
            } else {
              setListings([]);
            }
          } else {
            // Fall back to all static listings if no results and no category
            setListings(staticListings);
          }
          
          setError(null);
        }
      } catch (err) {
        console.error("Database fetch error:", err);
        setError("Failed to load listings. Please try again later.");
        setDatabaseConnected(false);
        setListings(staticListings); // Fallback to static listings
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchListings();
  }, [selectedCategory, priceRange, locationFilter, conditionFilter]);

  // Search filtering
  const filteredListings = useMemo(() => {
    if (listings.length === 0 || !searchQuery) {
      return listings;
    }
    
    return listings.filter((listing) => {
      const searchFields = [
        listing.title,
        listing.description,
        listing.location,
        listing.condition,
        ...(listing.features || [])
      ];

      return searchFields.some(field =>
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery, listings]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    if (categoryId === selectedCategory) {
      // Deselect if clicking the same category
      setSelectedCategory(null);
      setCategoryName(null);
      navigate('/');
    } else {
      setSelectedCategory(categoryId);
      if (categoryId) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          setCategoryName(t(`categories.${category.name}`));
        }
        navigate(`/?category=${categoryId}`);
      } else {
        navigate('/');
      }
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setPriceRange({min: null, max: null});
    setLocationFilter(null);
    setConditionFilter(null);
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src={ChaabikLogo} alt="Chaabik Logo" className="h-10 w-auto" />
            </Link>
            
            {/* Search Bar in Navbar */}
            <div className="hidden md:flex flex-grow mx-8">
              <div className="w-full max-w-xl">
                <SearchBar 
                  onSearch={setSearchQuery}
                  selectedCategory={null}
                  onSelectCategory={() => {}}
                />
              </div>
            </div>
            
            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/add-product" 
                className="hidden md:flex bg-yellow-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-500 items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('product.add')}
              </Link>
              
              {user ? (
                <UserMenu />
              ) : (
                <div className="hidden md:flex items-center space-x-2">
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
                </div>
              )}
              
              <LanguageSwitcher />
              
              <button
                className="md:hidden text-gray-700 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Search - only visible on mobile */}
          <div className="mt-4 md:hidden">
            <SearchBar 
              onSearch={setSearchQuery}
              selectedCategory={null}
              onSelectCategory={() => {}}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center space-y-6 pt-16">
            <Link to="/add-product" className="text-lg font-medium text-gray-600 hover:text-gray-900 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              {t('product.add')}
            </Link>
            
            <Link to="/terms" className="text-lg font-medium text-gray-600 hover:text-gray-900">
              {t('footer.terms')}
            </Link>
            <Link to="/privacy" className="text-lg font-medium text-gray-600 hover:text-gray-900">
              {t('footer.privacy')}
            </Link>
            <Link to="/faq" className="text-lg font-medium text-gray-600 hover:text-gray-900">
              {t('footer.faq')}
            </Link>
            <Link to="/rules" className="text-lg font-medium text-gray-600 hover:text-gray-900">
              {t('footer.rules')}
            </Link>
            <Link to="/safety" className="text-lg font-medium text-gray-600 hover:text-gray-900">
              {t('footer.safety')}
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
            
            <button
              className="text-gray-700 mt-8"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        )}
      </header>

      {/* Hero Section - No search bar */}
      <section className="relative bg-gradient-to-b from-blue-600 to-blue-900 text-white">
        <div className="absolute inset-0 bg-[url('/images/dots-pattern.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-10 md:mb-0">
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
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Categories Section - Simplified */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('categories.browse')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`flex flex-col items-center p-4 rounded-lg transition ${
                    selectedCategory === category.id 
                      ? 'bg-blue-100 border-2 border-blue-500' 
                      : 'bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    selectedCategory === category.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {/* Simple icon representation */}
                    {category.id === 'vehicles' && <div>🚗</div>}
                    {category.id === 'real-estate' && <div>🏠</div>}
                    {category.id === 'electronics' && <div>📱</div>}
                    {category.id === 'fashion' && <div>👕</div>}
                    {category.id === 'home' && <div>🛋️</div>}
                    {category.id === 'jobs' && <div>💼</div>}
                    {category.id === 'services' && <div>🔧</div>}
                  </div>
                  <span className="text-sm font-medium text-center">
                    {t(`categories.${category.name}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Filters Section - Only visible when a category is selected */}
        {selectedCategory && (
          <section className="py-6 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {categoryName && t('categories.filteringCategory', { category: categoryName })}
                </h3>
                <button
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  {isFiltersOpen ? t('common.hideFilters') : t('common.showFilters')}
                </button>
              </div>
              
              {isFiltersOpen && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Price Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('filters.price')}
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder={t('filters.min')}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                          value={priceRange.min || ''}
                          onChange={(e) => setPriceRange({
                            ...priceRange,
                            min: e.target.value ? Number(e.target.value) : null
                          })}
                        />
                        <input
                          type="number"
                          placeholder={t('filters.max')}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                          value={priceRange.max || ''}
                          onChange={(e) => setPriceRange({
                            ...priceRange,
                            max: e.target.value ? Number(e.target.value) : null
                          })}
                        />
                      </div>
                    </div>
                    
                    {/* Location Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('filters.location')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('filters.enterLocation')}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                        value={locationFilter || ''}
                        onChange={(e) => setLocationFilter(e.target.value || null)}
                      />
                    </div>
                    
                    {/* Condition Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('filters.condition')}
                      </label>
                      <select
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                        value={conditionFilter || ''}
                        onChange={(e) => setConditionFilter(e.target.value || null)}
                      >
                        <option value="">{t('filters.allConditions')}</option>
                        <option value="New">{t('product.conditionNew')}</option>
                        <option value="Like New">{t('product.conditionLikeNew')}</option>
                        <option value="Good">{t('product.conditionGood')}</option>
                        <option value="Fair">{t('product.conditionFair')}</option>
                        <option value="Poor">{t('product.conditionPoor')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                    >
                      {t('filters.clearAll')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Listings Grid */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {categoryName ? 
                t('categories.showingCategory', { category: categoryName }) : 
                searchQuery ? 
                  t('search.results') : 
                  t('listings.all')
              }
            </h2>
            
            {!databaseConnected && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
                {t('errors.databaseError')}
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
                {selectedCategory && (
                  <button 
                    onClick={() => {
                      setSelectedCategory(null);
                      setCategoryName(null);
                      navigate('/');
                    }}
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
        {!selectedCategory && !searchQuery && (
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