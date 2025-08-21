import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, Home, Shirt, User, Settings, Loader } from 'lucide-react';
import { apiClient, Product, SearchResult } from '../utils/supabase/client';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DashboardProps {
  userName: string;
  userUsername: string;
  userId: string;
  onProfileClick: () => void;
  onSettingsClick: () => void;
}

type Category = 'shopping' | 'properties' | 'clothing';

export function Dashboard({ userName, userUsername, userId, onProfileClick, onSettingsClick }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('shopping');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const categories = [
    { id: 'shopping' as Category, label: 'Shopping', icon: ShoppingBag },
    { id: 'properties' as Category, label: 'Properties', icon: Home },
    { id: 'clothing' as Category, label: 'Clothing', icon: Shirt }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      console.log(`Searching for: "${searchQuery}" in category: ${selectedCategory}`);
      
      const results = await apiClient.search(searchQuery, selectedCategory, userId);
      setSearchResults(results);
      console.log('Search completed:', results);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 relative">
      {/* Header with user info */}
      <div className="flex items-center justify-between p-4 bg-black/20">
        <div className="text-white">
          <h2>Welcome, {userName}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onProfileClick}
            className="flex items-center space-x-2 text-white bg-white/20 rounded-lg px-3 py-2"
          >
            <User className="w-4 h-4" />
            <span className="text-sm">@{userUsername}</span>
          </button>
          <button
            onClick={onSettingsClick}
            className="text-white bg-white/20 rounded-lg p-2"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <Search className="w-5 h-5 text-white/60 mr-3" />
            <input
              type="text"
              placeholder="Search for anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent text-white placeholder-white/50 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 ml-3"
            >
              {isSearching ? <Loader className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 p-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <Loader className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white">Searching...</p>
              </motion.div>
            )}

            {!isSearching && searchResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Search Info */}
                <div className="bg-white/10 rounded-lg p-4 mb-6 backdrop-blur-sm">
                  <h3 className="text-white font-medium">
                    Results for "{searchResults.query}" ({searchResults.products.length} found)
                  </h3>
                  <p className="text-white/70 text-sm">
                    AI optimized: "{searchResults.optimized_query}"
                  </p>
                </div>

                {/* Products Grid */}
                {searchResults.products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchResults.products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white/10 rounded-lg p-4 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors"
                        onClick={() => window.open(product.url, '_blank')}
                      >
                        <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-white/10">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <h4 className="text-white font-medium text-sm mb-2 line-clamp-2">
                          {product.title}
                        </h4>
                        
                        <div className="text-green-400 font-bold">
                          {formatPrice(product.price, product.currency)}
                        </div>
                        
                        {product.rating && (
                          <div className="text-white/80 text-sm mt-1">
                            ⭐ {product.rating} {product.reviews_count && `(${product.reviews_count})`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-white">No results found. Try a different search term.</p>
                  </div>
                )}
              </motion.div>
            )}

            {!isSearching && !searchResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Search className="w-16 h-16 text-white/60 mx-auto mb-4" />
                <p className="text-white text-lg">Search for anything!</p>
                <p className="text-white/70">Use the search bar above to find products</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-around bg-white/10 rounded-lg p-2">
            {categories.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-colors ${
                  selectedCategory === id 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}