import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';
import { ListingCard } from './ListingCard';
import { ListingDetailRow } from './ListingDetailRow';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { categories, listings as staticListings } from '../data';
import { Target, Plus, ChevronLeft, ChevronRight, ShieldCheck, CreditCard, Briefcase, UserCircle, BadgeCheck, Menu, X, List, LayoutGrid, Filter, SlidersHorizontal } from 'lucide-react';
import { supabase, isAuthenticated } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import ChaabikLogo from '../assets/Chaabik.png';

export function HomePage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [listings, setListings] = useState(staticListings);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingCategory, setIsFetchingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [locationFilter, setLocationFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('');
  
  // Parse URL parameters for category filtering
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      fetchCategoryItems(categoryParam);
    }
  }, [location.search]);

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
          console.error(t('auth.errorFetchingUser', { message: error.message }));
          if (error.message.includes('expired') || error.message.includes('missing')) {
            await supabase.auth.signOut();
          }
          setUser(null);
        } else {
          setUser(user);
        }
      } catch (err: any) {
        console.error(t('auth.errorInAuthCheck', { error: err.message }));
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

  // Initial fetch on component mount
  useEffect(() => {
    async function fetchAllListingsAsync() {
      setIsLoading(true);
      try {
        console.log(t('listings.initialFetch'));
        
        const { data, error } = await supabase
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
        
        if (error) {
          console.log(t('listings.usingStaticListings', { message: error.message }));
          setDatabaseConnected(false);
          setListings(staticListings);
        } else {
          console.log(t('listings.databaseConnected', { count: data.length }));
          setDatabaseConnected(true);
          
          const mappedProducts = data.map(product => ({
            id: product.id,
            title: product.title || "No Title",
            description: product.description || "No Description",
            price: product.price || 0,
            category: product.category || "",
            location: product.location || "Unknown Location",
            image: product.image_url || "",
            condition: product.condition || "Unknown",
            features: Array.isArray(product.features) ? product.features : [],
            createdAt: product.created_at,
            is_sold: product.is_sold || false,
            seller: {
              name: product.seller?.name || 'Anonymous',
              rating: product.seller?.rating || 4.5,
              phone: product.seller?.phone || '',
              joinedDate: product.seller?.created_at || new Date().toISOString(),
              totalSales: product.seller?.total_sales || 0,
              responseRate: product.seller?.response_rate || 95
            }
          }));
          
          if (mappedProducts.length > 0) {
            setListings(mappedProducts);
          } else {
            console.log(t('listings.noProductsFound'));
            setListings(staticListings);
          }
        }
      } catch (err: any) {
        console.error("Error fetching listings:", err);
        setListings(staticListings);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAllListingsAsync();
  }, [t]);

  // Function to fetch items for a specific category
  const fetchCategoryItems = async (categoryId: string) => {
    setIsFetchingCategory(true);
    
    try {
      // Find the category object
      const categoryObj = categories.find(c => c.id === categoryId);
      if (!categoryObj) {
        console.error(t('categories.categoryNotFound', { categoryId }));
        setIsFetchingCategory(false);
        return;
      }
      
      // Get all subcategory IDs for this category
      const subcategoryIds = categoryObj.subcategories.map(sub => sub.id);
      const searchCategories = [categoryId, ...subcategoryIds];
      
      const { data, error } = await supabase
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
        .in('category', searchCategories)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(t('categories.errorFetchingItems', { error: error.message }));
        
        // Try a simpler query with just the main category
        const { data: simpleData, error: simpleError } = await supabase
          .from('products')
          .select('*')
          .eq('category', categoryId);
        
        if (simpleError || !simpleData || simpleData.length === 0) {
          console.log(t('categories.noItemsFound'));
          // Fall back to static data
          const filteredStatic = staticListings.filter(listing => 
            searchCategories.includes(listing.category)
          );
          setListings(filteredStatic);
        } else {
          console.log("Found products with simple query:", simpleData.length);
          // We found some data with the simpler query
          const mappedSimpleProducts = simpleData.map(product => ({
            id: product.id,
            title: product.title || "No Title",
            description: product.description || "No Description",
            price: product.price || 0,
            category: product.category || "",
            location: product.location || "Unknown Location",
            image: product.image_url || "",
            condition: product.condition || "Unknown",
            features: Array.isArray(product.features) ? product.features : [],
            is_sold: product.is_sold || false,
            seller: {
              name: "Anonymous",
              rating: 4.5,
              phone: "",
              joinedDate: new Date().toISOString(),
              totalSales: 0,
              responseRate: 95
            }
          }));
          
          setListings(mappedSimpleProducts);
        }
      } else {
        console.log("Fetched", data.length, "items for category", categoryId);
        
        if (data.length === 0) {
          console.log("No items found in database for this category, trying looser matching");
          
          // Try a more relaxed search using ILIKE (case-insensitive pattern matching)
          const { data: looseData, error: looseError } = await supabase
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
            .or(`category.ilike.%${categoryId}%,title.ilike.%${categoryObj.name}%`);
          
          if (looseError || !looseData || looseData.length === 0) {
            console.log("No matches with loose search either, falling back to static data");
            const filteredStatic = staticListings.filter(listing => 
              searchCategories.includes(listing.category)
            );
            setListings(filteredStatic);
          } else {
            console.log("Found products with loose search:", looseData.length);
            const mappedLooseProducts = looseData.map(product => ({
              id: product.id,
              title: product.title || "No Title",
              description: product.description || "No Description",
              price: product.price || 0,
              category: product.category || "",
              location: product.location || "Unknown Location",
              image: product.image_url || "",
              condition: product.condition || "Unknown",
              features: Array.isArray(product.features) ? product.features : [],
              is_sold: product.is_sold || false,
              seller: {
                name: product.seller?.name || 'Anonymous',
                rating: product.seller?.rating || 4.5,
                phone: product.seller?.phone || '',
                joinedDate: product.seller?.created_at || new Date().toISOString(),
                totalSales: product.seller?.total_sales || 0,
                responseRate: product.seller?.response_rate || 95
              }
            }));
            
            setListings(mappedLooseProducts);
          }
        } else {
          // Map the database structure to what your components expect
          const mappedProducts = data.map(product => ({
            id: product.id,
            title: product.title || "No Title",
            description: product.description || "No Description",
            price: product.price || 0,
            category: product.category || "",
            location: product.location || "Unknown Location",
            image: product.image_url || "",
            condition: product.condition || "Unknown",
            features: Array.isArray(product.features) ? product.features : [],
            is_sold: product.is_sold || false,
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
      }
    } catch (err: any) {
      console.error("Error fetching category items:", err);
      
      // Fallback to static listings
      const categoryObj = categories.find(c => c.id === categoryId);
      if (categoryObj) {
        const subcategoryIds = categoryObj.subcategories.map(sub => sub.id);
        const searchCategories = [categoryId, ...subcategoryIds];
        const filteredStatic = staticListings.filter(listing => 
          searchCategories.includes(listing.category)
        );
        setListings(filteredStatic);
      }
    } finally {
      setIsFetchingCategory(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      // If clicking the same category, just refresh the data
      fetchCategoryItems(categoryId);
    } else {
      setSelectedCategory(categoryId);
      fetchCategoryItems(categoryId);
      navigate(`/?category=${categoryId}`);
    }
  };

  // Update the handleAllCategories function to properly fetch all items
  const handleAllCategories = () => {
    setSelectedCategory(null);
    setIsLoading(true);
    setSearchQuery('');  // Clear any previous search
    setSearchSubmitted(false); // Reset search state
    // Reset filters
    setPriceRange({min: '', max: ''});
    setLocationFilter('');
    setConditionFilter('');
    navigate('/');
    
    // Fetch all listings with improved error handling and debugging
    console.log("Fetching all listings...");
    
    supabase
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
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching all listings:", error);
          setListings(staticListings);
        } else {
          console.log("Successfully fetched all listings:", data.length);
          
          if (data.length > 0) {
            const mappedProducts = data.map(product => ({
              id: product.id,
              title: product.title || "No Title",
              description: product.description || "No Description",
              price: product.price || 0,
              category: product.category || "",
              location: product.location || "Unknown Location",
              image: product.image_url || "",
              condition: product.condition || "Unknown",
              features: Array.isArray(product.features) ? product.features : [],
              is_sold: product.is_sold || false,
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
          } else {
            console.log("No products found in database, using static listings");
            setListings(staticListings);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching all listings:", err);
        setListings(staticListings);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Handle search submission
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchQuery('');
      setSearchSubmitted(false);
      if (selectedCategory) {
        fetchCategoryItems(selectedCategory); 
      } else {
        handleAllCategories();
      }
      return;
    }
    
    setSearchQuery(query);
    setIsSearching(true);
    setSearchSubmitted(true);
    console.log("Searching for:", query);
    
    try {
      let queryBuilder = supabase.from('products').select(`
        *,
        seller:seller_id(
          name, 
          phone,
          rating,
          total_sales,
          response_rate,
          created_at
        )
      `);
      
      // Apply text search for title and description
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      
      // Apply category filter if selected
      if (selectedCategory) {
        const categoryObj = categories.find(c => c.id === selectedCategory);
        if (categoryObj) {
          const subcategoryIds = categoryObj.subcategories.map(sub => sub.id);
          const searchCategories = [selectedCategory, ...subcategoryIds];
          queryBuilder = queryBuilder.in('category', searchCategories);
        }
      }
      
      const { data, error } = await queryBuilder.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error during search:', error);
        setError(t('search.searchError'));
        setListings(staticListings.filter(l => l.title.toLowerCase().includes(query.toLowerCase())));
        return;
      }
      
      if (data) {
        const mappedResults = data.map(product => ({
          id: product.id,
          title: product.title || "No Title",
          description: product.description || "No Description",
          price: product.price || 0,
          category: product.category || "",
          location: product.location || "Unknown Location",
          image: product.image_url || "",
          condition: product.condition || "Unknown",
          features: Array.isArray(product.features) ? product.features : [],
          is_sold: product.is_sold || false,
          seller: {
            name: product.seller?.name || 'Anonymous',
            rating: product.seller?.rating || 4.5,
            phone: product.seller?.phone || '',
            joinedDate: product.seller?.created_at || new Date().toISOString(),
            totalSales: product.seller?.total_sales || 0,
            responseRate: product.seller?.response_rate || 95
          }
        }));
        setListings(mappedResults);
        if (mappedResults.length === 0) {
          console.log(t('search.noResults'));
        }
      }
      
    } catch (err: any) {
      console.error('Search error:', err);
      setError(t('search.searchError'));
      // Fallback to static search if db search fails
      setListings(staticListings.filter(l => l.title.toLowerCase().includes(query.toLowerCase())));
    } finally {
      setIsSearching(false);
    }
  };

  // Apply filters to the listings
  const filteredListings = useMemo(() => {
    let results = [...listings];
    
    // If a search was submitted, we've already filtered by the search query in the API call
    
    // Apply price filter
    if (priceRange.min && !isNaN(Number(priceRange.min))) {
      results = results.filter(item => item.price >= Number(priceRange.min));
    }
    
    if (priceRange.max && !isNaN(Number(priceRange.max))) {
      results = results.filter(item => item.price <= Number(priceRange.max));
    }
    
    // Apply location filter
    if (locationFilter) {
      results = results.filter(item => 
        item.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    
    // Apply condition filter
    if (conditionFilter) {
      results = results.filter(item => item.condition === conditionFilter);
    }
    
    return results;
  }, [listings, priceRange, locationFilter, conditionFilter]);

  const recentListings = useMemo(() => {
    return listings.slice(0, 5); // First 5 listings for "Listed recently"
  }, [listings]);

  // Reset all filters
  const resetFilters = () => {
    setPriceRange({min: '', max: ''});
    setLocationFilter('');
    setConditionFilter('');
  };

  // Check if any filters are applied
  const hasActiveFilters = priceRange.min || priceRange.max || locationFilter || conditionFilter;

  useEffect(() => {
    // Check authentication status immediately and subscribe to auth changes
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      console.log("Auth status:", authenticated);
      setIsLoggedIn(authenticated);
    };
    
    checkAuth();
    
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, !!session);
      setIsLoggedIn(!!session);
    });
    
    // Cleanup subscription
    return () => {
      authListener?.subscription.unsubscribe();
    };
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <a href="/">
            <img src={ChaabikLogo} alt={t('logo.alt')} className="h-10 w-auto" />
          </a>
          <button
            className="lg:hidden flex items-center justify-center p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
            <button 
              onClick={handleAllCategories}
              className={`text-sm font-medium ${!selectedCategory ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t('categories.all')}
            </button>
            {categories.slice(0, 6).map(category => (
              <button 
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`text-sm font-medium ${selectedCategory === category.id ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {t(`categories.${category.name}`)}
              </button>
            ))}
          </div>
          <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
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
        {/* Popup Menu Card for mobile */}
        {isMobileMenuOpen && (
          <>
            {/* Blur overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <PopupMenuCard
              onClose={() => setIsMobileMenuOpen(false)}
              user={user}
              t={t}
              selectedCategory={selectedCategory}
              handleAllCategories={handleAllCategories}
              handleCategorySelect={handleCategorySelect}
              categories={categories}
              i18n={i18n}
            />
          </>
        )}
      </header>

      {/* Hero Section with gradient background */}
      <section className="relative bg-gradient-to-b from-blue-600 to-blue-900 text-white">
        <div className="absolute inset-0 bg-[url('/images/dots-pattern.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-6 md:mb-0">
              <h1 className="text-2xl xs:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">
                <span className="text-yellow-400">CHAABIK</span><br />
                {t('hero.title')}
              </h1>
              <p className="text-sm xs:text-md md:text-xl mb-4 sm:mb-6 max-w-md">
                {t('hero.subtitle')}
              </p>
              <div className="flex gap-2 xs:gap-3">
                <Link to="/add-product" className="bg-yellow-400 text-blue-900 px-3 xs:px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium flex items-center gap-1 xs:gap-2 hover:bg-yellow-500 transition text-xs xs:text-sm sm:text-base">
                  <Plus className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                  {t('product.add')}
                </Link>
                <Link to="/safety" className="bg-white bg-opacity-10 text-white px-3 xs:px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium hover:bg-opacity-20 transition text-xs xs:text-sm sm:text-base">
                  {t('safety.title')}
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 w-full flex justify-center mt-6 md:mt-0">
              <div className="bg-white rounded-lg p-3 xs:p-4 sm:p-6 shadow-xl w-full max-w-md">
                <h2 className="text-blue-900 font-bold text-base xs:text-lg sm:text-xl mb-2 xs:mb-3 sm:mb-4">{t('search.findItems')}</h2>
                <SearchBar 
                  onSearch={handleSearch}
                  isSearching={isSearching}
                />
                <div className="flex flex-wrap gap-1 xs:gap-2 mt-2 xs:mt-3 sm:mt-4">
                  {categories.slice(0, 5).map(category => (
                    <button 
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`px-2 sm:px-3 py-1 ${selectedCategory === category.id ? 
                        'bg-blue-100 text-blue-700 border border-blue-300' : 
                        'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-full text-xs sm:text-sm transition`}
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
        {/* Listings Grid / List */}
        <section className="py-6 xs:py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex flex-wrap justify-between items-center mb-4 xs:mb-6 sm:mb-8 gap-2">
              <h2 className="text-xl xs:text-2xl font-bold text-gray-900">
                {selectedCategory ? 
                  t(`categories.${categories.find(c => c.id === selectedCategory)?.name}`) : 
                  searchSubmitted && searchQuery ? 
                    `${t('search.results')} "${searchQuery}"` : 
                    t('listings.all')
                }
                <span className="text-xs xs:text-sm font-normal text-gray-500 ml-2">
                  ({filteredListings.length} {t('common.items')})
                </span>
              </h2>
              
              <div className="flex items-center space-x-2">
                {/* Filter toggle button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 text-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {showFilters ? t('common.hideFilters') : t('common.showFilters')}
                </button>
                
                {/* View mode toggle buttons */}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    title={t('viewSwitcher.grid')}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    title={t('viewSwitcher.list')}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Filters section */}
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-700">{t('filters.filterBy')}</h3>
                  {hasActiveFilters && (
                    <button 
                      onClick={resetFilters}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {t('filters.clearAll')}
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('filters.price')}
                    </label>
                    <div className="flex space-x-2">
                      <div className="w-1/2">
                        <input
                          type="number"
                          placeholder={t('filters.min')}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                        />
                      </div>
                      <div className="w-1/2">
                        <input
                          type="number"
                          placeholder={t('filters.max')}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                        />
                      </div>
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
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />
                  </div>
                  
                  {/* Condition Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('filters.condition')}
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={conditionFilter}
                      onChange={(e) => setConditionFilter(e.target.value)}
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
                
                {/* Active filters display */}
                {hasActiveFilters && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-500 mb-2">{t('filters.filterApplied')}:</div>
                    <div className="flex flex-wrap gap-2">
                      {priceRange.min && (
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {t('filters.min')}: {priceRange.min} MRU
                        </div>
                      )}
                      {priceRange.max && (
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {t('filters.max')}: {priceRange.max} MRU
                        </div>
                      )}
                      {locationFilter && (
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {t('filters.location')}: {locationFilter}
                        </div>
                      )}
                      {conditionFilter && (
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {t('filters.condition')}: {t(`product.condition${conditionFilter.replace(/\s/g, '')}`)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!databaseConnected && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
                {t('listings.demoMessage')}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}
            
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-16">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                <p className="text-gray-500 text-sm sm:text-base">{t('search.searching')}</p>
              </div>
            ) : isFetchingCategory ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-16">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                <p className="text-gray-500 text-sm sm:text-base">{t('common.loadingCategory')}</p>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-16">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                <p className="text-gray-500 text-sm sm:text-base">{t('common.loading')}</p>
              </div>
            ) : filteredListings.length > 0 ? (
              <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 lg:gap-6' : 'space-y-4'}`}>
                {filteredListings.map((listing) => (
                  viewMode === 'grid' ? (
                    <ListingCard
                      key={`${listing.id}-grid`}
                      id={listing.id}
                      title={listing.title}
                      description={listing.description}
                      price={listing.price}
                      location={listing.location}
                      image={listing.image}
                      condition={listing.condition}
                      createdAt={listing.createdAt}
                      is_sold={listing.is_sold}
                      seller={listing.seller}
                    />
                  ) : (
                    <ListingDetailRow
                      key={`${listing.id}-list`}
                      id={listing.id}
                      title={listing.title}
                      price={listing.price}
                      location={listing.location}
                      image={listing.image}
                      condition={listing.condition}
                      createdAt={listing.createdAt}
                      is_sold={listing.is_sold}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  {selectedCategory ? 
                    t('categories.noCategoryItems', { category: t(`categories.${categories.find(c => c.id === selectedCategory)?.name}`) }) : 
                    searchSubmitted && searchQuery ? 
                      t('search.noResults') : 
                      t('listings.noListings')
                  }
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Listings Section */}
        {!selectedCategory && !searchSubmitted && (
          <section className="py-6 xs:py-8 sm:py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mb-4 xs:mb-6 sm:mb-8">{t('listings.recent')}</h2>
              
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 xs:gap-4 sm:gap-5 lg:gap-6">
                {recentListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    description={listing.description}
                    price={listing.price}
                    location={listing.location}
                    image={listing.image}
                    condition={listing.condition}
                    is_sold={listing.is_sold}
                    seller={listing.seller}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      
    </div>
  );
}

// Add this helper for language pills
function LanguagePills({ onSelect, current }: { onSelect: (lng: string) => void, current: string }) {
  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' }
  ];
  return (
    <div className="flex gap-2 mt-4 justify-center">
      {languages.map(lng => (
        <button
          key={lng.code}
          onClick={() => onSelect(lng.code)}
          className={`px-4 py-1 rounded-full border text-base font-semibold transition
            ${current === lng.code
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
        >
          {lng.label}
        </button>
      ))}
    </div>
  );
}

// Popup menu card component
function PopupMenuCard({
  onClose,
  user,
  t,
  selectedCategory,
  handleAllCategories,
  handleCategorySelect,
  categories,
  i18n,
}: { 
  onClose: () => void;
  user: User | null;
  t: any;
  selectedCategory: string | null;
  handleAllCategories: () => void;
  handleCategorySelect: (categoryId: string) => void;
  categories: any[];
  i18n: any;
}) {
  return (
    <div
      className="fixed top-6 right-1/2 translate-x-1/2 sm:right-6 sm:translate-x-0 z-50 animate-slide-in bg-white rounded-2xl shadow-2xl w-[92vw] max-w-xs sm:max-w-sm p-0 flex flex-col"
      style={{ minWidth: 260, maxHeight: '90vh' }}
    >
      <div className="relative flex-shrink-0">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 z-10"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="w-7 h-7" />
        </button>
      </div>
      <div
        className="flex flex-col items-stretch gap-3 mt-2 px-5 pb-7 pt-12 overflow-y-auto"
        style={{ maxHeight: 'calc(90vh - 16px)' }}
      >
        <button
          onClick={() => {
            handleAllCategories();
            onClose();
          }}
          className={`text-lg font-semibold text-left rounded-lg px-3 py-2 transition
            ${!selectedCategory ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          {t('categories.all')}
        </button>
        {categories.slice(0, 6).map(category => (
          <button
            key={category.id}
            onClick={() => {
              handleCategorySelect(category.id);
              onClose();
            }}
            className={`text-lg font-semibold text-left rounded-lg px-3 py-2 transition
              ${selectedCategory === category.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            {t(`categories.${category.name}`)}
          </button>
        ))}
        <hr className="my-3" />
        <Link to="/terms" className="text-base font-medium rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-700 text-left block">Terms</Link>
        <Link to="/privacy" className="text-base font-medium rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-700 text-left block">Privacy</Link>
        <Link to="/faq" className="text-base font-medium rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-700 text-left block">FAQ</Link>
        <Link to="/rules" className="text-base font-medium rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-700 text-left block">Rules</Link>
        <Link to="/safety" className="text-base font-medium rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-700 text-left block">Safety Tips</Link>
        <hr className="my-3" />
        {user ? (
          <div className="mt-1"><UserMenu /></div>
        ) : (
          <div className="flex flex-col gap-2 mt-1">
            <Link
              to="/auth"
              state={{ mode: 'signup' }}
              className="text-gray-700 px-3 py-2 rounded-lg border border-gray-300 text-base font-semibold hover:bg-gray-50 text-center"
              onClick={onClose}
            >
              {t('auth.signUp')}
            </Link>
            <Link
              to="/auth"
              state={{ mode: 'signin' }}
              className="bg-yellow-400 text-gray-700 px-3 py-2 rounded-lg text-base font-semibold hover:bg-yellow-500 text-center"
              onClick={onClose}
            >
              {t('auth.signIn')}
            </Link>
          </div>
        )}
        <div className="mt-3">
          <LanguagePills
            onSelect={lng => i18n.changeLanguage(lng)}
            current={i18n.language}
          />
        </div>
      </div>
    </div>
  );
}

// Add slide-in animation to global styles (inject into the file or your CSS)
const style = document.createElement('style');
style.innerHTML = `
@keyframes slide-in {
  from { opacity: 0; transform: translateY(-30px) scale(0.98);}
  to { opacity: 1; transform: translateY(0) scale(1);}
}
.animate-slide-in {
  animation: slide-in 0.25s cubic-bezier(.4,0,.2,1);
}

/* Custom breakpoint for extra small devices */
@media (min-width: 480px) {
  .xs\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`;
if (typeof window !== 'undefined' && !document.getElementById('popup-slidein-style')) {
  style.id = 'popup-slidein-style';
  document.head.appendChild(style);
}