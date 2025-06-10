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
import { listings as staticListings } from '../data';

// Interface for database listings
interface DBListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id?: string;
  location?: string;
  image_url?: string;
  condition?: string;
  features?: string[];
  created_at: string;
  user_id: string;
}

export function HomePage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchBarCategory, setSearchBarCategory] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [databaseTables, setDatabaseTables] = useState<string[]>([]);

  // First check what tables are actually available in the database
  useEffect(() => {
    async function checkDatabaseTables() {
      try {
        setIsLoading(true);
        console.log("Checking available database tables...");
        
        // This query should list available tables
        const { data, error } = await supabase
          .from('pg_catalog.pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');
        
        if (error) {
          console.error('Error checking tables:', error);
          setDebugInfo(`Table check error: ${error.message}`);
          // If we can't get the tables, just use static data as fallback
          console.log("Using static data as fallback");
          setListings(staticListings);
          setError(null);
          return;
        }
        
        if (data && data.length > 0) {
          const tableNames = data.map(t => t.tablename);
          console.log("Available tables:", tableNames);
          setDatabaseTables(tableNames);
          
          // Now try to find a table that contains listings data
          // Common names for such tables
          const possibleTableNames = ['listings', 'products', 'items', 'posts'];
          
          const listingsTable = tableNames.find(name => 
            possibleTableNames.includes(name)
          );
          
          if (listingsTable) {
            // Found a matching table, now try to query it
            fetchFromTable(listingsTable);
          } else {
            console.log("No listings table found, using static data");
            setListings(staticListings);
            setError(null);
            setDebugInfo(`No listings table found. Available tables: ${tableNames.join(', ')}`);
          }
        } else {
          console.log("No tables found, using static data");
          setListings(staticListings);
          setError(null);
          setDebugInfo("No tables found in database");
        }
      } catch (err: any) {
        console.error('Error:', err);
        setDebugInfo(`Error: ${err.message}`);
        // Fall back to static data
        setListings(staticListings);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    async function fetchFromTable(tableName: string) {
      try {
        console.log(`Fetching from table: ${tableName}`);
        
        // First try a simple query to see the table structure
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);
        
        if (error) {
          console.error(`Error querying ${tableName}:`, error);
          setDebugInfo(`Error querying ${tableName}: ${error.message}`);
          // Fall back to static data
          setListings(staticListings);
          return;
        }
        
        if (data && data.length > 0) {
          console.log(`${tableName} sample:`, data[0]);
          setListings(data);
          setError(null);
          setDebugInfo(null);
        } else {
          console.log(`No data in ${tableName}, using static data`);
          setListings(staticListings);
          setDebugInfo(`Table ${tableName} exists but is empty`);
        }
      } catch (err: any) {
        console.error('Error:', err);
        setDebugInfo(`Error: ${err.message}`);
        // Fall back to static data
        setListings(staticListings);
      }
    }

    checkDatabaseTables();
  }, []);

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
        ...(listing.features || [])
      ];

      const matchesSearch = searchQuery === '' || searchFields.some(field =>
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Adapt this based on whether we're using static or database listings
      const categoryField = listing.category_id || listing.category;
      const matchesCategory = !selectedSubcategory || categoryField === selectedSubcategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedSubcategory, listings]);

  if (!authChecked || isLoading) {
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

        {/* Listings Grid */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {searchQuery ? t('search.results') : t('listings.recent')}
            </h2>
            
            {debugInfo && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
                <p className="font-bold">Debug Info:</p>
                <p className="text-sm">{debugInfo}</p>
                {databaseTables.length > 0 && (
                  <p className="text-sm mt-1">Available tables: {databaseTables.join(', ')}</p>
                )}
              </div>
            )}
            
            {filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    description={listing.description}
                    price={listing.price}
                    location={listing.location || ''}
                    image_url={listing.image || listing.image_url || ''}
                    condition={listing.condition || 'Used'}
                    created_at={listing.created_at || new Date().toISOString()}
                    seller_profile={listing.seller || listing.profiles ? {
                      name: listing.seller?.name || listing.profiles?.full_name || 'Anonymous',
                      phone: listing.seller?.phone || listing.profiles?.phone || ''
                    } : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">{searchQuery ? t('search.noResults') : t('listings.noListings')}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}