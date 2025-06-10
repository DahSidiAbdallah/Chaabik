import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';
import { ListingCard } from './ListingCard';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchBarCategory, setSearchBarCategory] = useState<string | null>(null);
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

  // Initial load of all listings
  useEffect(() => {
    async function fetchAllListings() {
      try {
        console.log("Fetching all listings...");
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
          console.log("Using static listings due to database error:", error.message);
          setDatabaseConnected(false);
        } else {
          console.log("Database connected, fetched", data.length, "products");
          setDatabaseConnected(true);
          
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
          
          if (mappedProducts.length > 0) {
            setListings(mappedProducts);
          } else {
            // If no products found in database, use static listings
            setListings(staticListings);
          }
        }
      } catch (err) {
        console.error("Database check error:", err);
        setDatabaseConnected(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAllListings();
  }, []);

  // Function to fetch items for a specific category
  const fetchCategoryItems = async (categoryId: string) => {
    setIsFetchingCategory(true);
    
    try {
      console.log("Fetching items for category:", categoryId);
      
      // First, debug what categories exist in the database
      const { data: allProducts, error: debugError } = await supabase
        .from('products')
        .select('id, category')
        .order('created_at', { ascending: false });
      
      if (debugError) {
        console.error("Error fetching category debug info:", debugError);
      } else {
        // Log unique categories in the database
        const uniqueCategories = [...new Set(allProducts.map(p => p.category))];
        console.log("Categories in database:", uniqueCategories);
        console.log("Total products in database:", allProducts.length);
      }
      
      // Find the category object
      const categoryObj = categories.find(c => c.id === categoryId);
      if (!categoryObj) {
        console.error("Category not found:", categoryId);
        setIsFetchingCategory(false);
        return;
      }
      
      // Get all subcategory IDs for this category
      const subcategoryIds = categoryObj.subcategories.map(sub => sub.id);
      console.log("Looking for subcategories:", subcategoryIds);
      
      // IMPORTANT FIX: Try both the main category ID and subcategory IDs
      // Some databases might store the main category ID rather than subcategories
      const searchCategories = [categoryId, ...subcategoryIds];
      console.log("Searching for any of these categories:", searchCategories);
      
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
        console.error("Error fetching category items:", error);
        // Don't immediately fall back to static data
        // Let's try a different approach first
        
        // Try a simpler query with just the main category
        const { data: simpleData, error: simpleError } = await supabase
          .from('products')
          .select('*')
          .eq('category', categoryId);
        
        if (simpleError || !simpleData || simpleData.length === 0) {
          console.log("Couldn't find any products with exact category match, falling back to static data");
          // Now fall back to static data
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
    } catch (err) {
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

  // Handle category selection - updated to be more robust
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

  // Handle "All Categories" selection
  const handleAllCategories = () => {
    setSelectedCategory(null);
    setIsLoading(true);
    navigate('/');
    
    // Fetch all listings again
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
          console.log("Fetched all listings:", data.length);
          
          if (data.length === 0) {
            setListings(staticListings);
          } else {
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
      })
      .catch((err) => {
        console.error("Error fetching all listings:", err);
        setListings(staticListings);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Replace the direct setSearchQuery function with this new handler
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchSubmitted(true);
    
    try {
      console.log("Searching for:", query);
      
      // If connected to database, perform a database search
      if (databaseConnected) {
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
          .or(`
            title.ilike.%${query}%,
            description.ilike.%${query}%,
            location.ilike.%${query}%
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error searching products:", error);
          // Fall back to local filtering
          setSearchQuery(query);
        } else {
          console.log("Search results:", data.length);
          
          if (data.length > 0) {
            // Map the database results
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
            setSearchQuery(query); // Still update this for display purposes
          } else {
            // If no results from database, just update the search query for local filtering
            setSearchQuery(query);
          }
        }
      } else {
        // If not connected to database, just update the search query for local filtering
        setSearchQuery(query);
      }
    } catch (err) {
      console.error("Error during search:", err);
      setSearchQuery(query); // Fall back to local filtering
    } finally {
      setIsSearching(false);
    }
  };

  // Update the useMemo for filtered listings to respect searchSubmitted
  const filteredListings = useMemo(() => {
    if (!searchSubmitted) return listings;
    
    if (!searchQuery) return listings;
    
    return listings.filter((listing) => {
      const searchFields = [
        listing.title,
        listing.description,
        listing.location,
        listing.condition,
        ...listing.features
      ];

      return searchFields.some(field =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery, listings, searchSubmitted]);

  const recentListings = useMemo(() => {
    return listings.slice(0, 5); // First 5 listings for "Listed recently"
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
            {/* All Categories link */}
            <button 
              onClick={handleAllCategories}
              className={`text-sm font-medium ${!selectedCategory ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t('categories.all')}
            </button>
            
            {/* Category links with active state */}
            {categories.slice(0, 6).map(category => (
              <button 
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`text-sm font-medium ${selectedCategory === category.id ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {t(`categories.${category.name}`)}
              </button>
            ))}
          
            {/* Authentication buttons */}
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
            <button 
              onClick={handleAllCategories}
              className={`text-lg font-medium ${!selectedCategory ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t('categories.all')}
            </button>
            
            {categories.slice(0, 6).map(category => (
              <button 
                key={category.id}
                onClick={() => {
                  handleCategorySelect(category.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-lg font-medium ${selectedCategory === category.id ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {t(`categories.${category.name}`)}
              </button>
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
                  onSearch={handleSearch}
                  selectedCategory={searchBarCategory}
                  onSelectCategory={setSearchBarCategory}
                  isSearching={isSearching}
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
        {/* Listings Grid */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {selectedCategory ? 
                t(`categories.${categories.find(c => c.id === selectedCategory)?.name}`) : 
                searchSubmitted && searchQuery ? 
                  t('search.results') : 
                  t('listings.all')
              }
            </h2>
            
            {!databaseConnected && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
                Showing demo listings. Connect your database to display your own items.
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}
            
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-500">{t('search.searching')}</p>
              </div>
            ) : isFetchingCategory ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-500">{t('common.loadingCategory')}</p>
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
          <section className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('listings.recent')}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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