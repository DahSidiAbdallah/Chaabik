import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';
import { ListingCard } from './ListingCard';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { Footer } from './Footer';
import { categories, listings as staticListings } from '../data';
import { Menu, X, Plus } from 'lucide-react';
import { supabase, isAuthenticated } from '../lib/supabase';
import ChaabikLogo from '../assets/Chaabik.png';

export function HomePage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [listings, setListings] = useState(staticListings); // Start with static listings
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simple auth check
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setAuthChecked(true);
      }
    }
    
    checkAuth();
  }, []);

  // Simplified search filter
  const filteredListings = searchQuery 
    ? listings.filter(listing => 
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : listings;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-600 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-yellow-400">CHAABIK</span><br />
                {t('hero.title')}
              </h1>
              <p className="text-lg md:text-xl mb-8 max-w-md">
                {t('hero.subtitle', 'Discover unique items and connect with sellers near you.')}
              </p>
              <div className="flex gap-4">
                <Link to="/add-product" className="bg-yellow-400 text-blue-900 px-6 py-3 rounded-md font-medium flex items-center gap-2 hover:bg-yellow-500 transition">
                  <Plus className="w-5 h-5" />
                  {t('product.add')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Categories Section - Ultra Simplified */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('categories.browse')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="flex flex-col items-center p-4 rounded-lg bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md transition"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-gray-100 text-gray-700">
                    {category.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-center">
                    {t(`categories.${category.name}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Listings Grid - Simplified */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {searchQuery ? t('search.results') : t('listings.all')}
            </h2>
            
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
                  {t('listings.noListings')}
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Recently Added Section */}
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
      </main>

      <Footer />
    </div>
  );
}