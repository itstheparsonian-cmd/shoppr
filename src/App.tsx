import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader, AlertCircle, ChevronDown, User, LogOut, ShoppingCart, Clock, Settings } from 'lucide-react';
import { apiClient, Product, SearchResult, UserProfile, SurveyData } from './utils/supabase/client';
import { LandingScreen } from './components/LandingScreen';
import { NewSurvey } from './components/NewSurvey';
import { Survey } from './components/Survey';
import { TinderSwipe } from './components/TinderSwipe';
import { Cart } from './components/Cart';
import { SettingsMenu } from './components/SettingsMenu';
import { ProfileEditModal } from './components/ProfileEditModal';

interface Category {
  id: string;
  name: string;
}

const AMAZON_CATEGORIES: Category[] = [
  { id: "2619526011", name: "Appliances" },
  { id: "2350150011", name: "Apps & Games" },
  { id: "2617942011", name: "Arts, Crafts & Sewing" },
  { id: "audible", name: "Audible" },
  { id: "15690151", name: "Automotive" },
  { id: "165797011", name: "Baby" },
  { id: "11055981", name: "Beauty" },
  { id: "1000", name: "Books" },
  { id: "301668", name: "CDs & Vinyl" },
  { id: "2335753011", name: "Cell Phones & Accessories" },
  { id: "7141124011", name: "Clothing, Shoes & Jewelry" },
  { id: "4991426011", name: "Collectibles & Fine Arts" },
  { id: "624868011", name: "Digital Music" },
  { id: "493964", name: "Electronics" },
  { id: "2864120011", name: "Gift Cards" },
  { id: "16310211", name: "Grocery & Gourmet Food" },
  { id: "11260433011", name: "Handmade" },
  { id: "3760931", name: "Health & Personal Care" },
  { id: "1063498", name: "Home & Kitchen" },
  { id: "16310161", name: "Industrial & Scientific" },
  { id: "133141011", name: "Kindle Store" },
  { id: "599872", name: "Magazine Subscriptions" },
  { id: "2625374011", name: "Movies & TV" },
  { id: "11965861", name: "Musical Instruments" },
  { id: "1084128", name: "Office Products" },
  { id: "3238155011", name: "Patio, Lawn & Garden" },
  { id: "2619534011", name: "Pet Supplies" },
  { id: "409488", name: "Software" },
  { id: "3375301", name: "Sports & Outdoors" },
  { id: "468240", name: "Tools & Home Improvement" },
  { id: "165795011", name: "Toys & Games" },
  { id: "10677470011", name: "Vehicles" },
  { id: "11846801", name: "Video Games" }
];

// Random loading messages
const LOADING_MESSAGES = [
  "Shoppr AI is finding perfect matches...",
  "Analyzing your preferences...",
  "Curating personalized picks...",
  "Scanning for the best deals...",
  "Finding your style matches...",
  "AI working its magic...",
  "Personalizing just for you...",
  "Discovering hidden gems...",
  "Matching your vibe...",
  "Almost ready to swipe..."
];

// Category-specific suggestion generator based on survey data
class CategorySuggestionGenerator {
  private suggestionCache = new Map<string, string[]>();

  private getCacheKey(categoryId: string, userId: string): string {
    return `suggestions-${categoryId}-${userId}`;
  }

  // Base suggestions for each category
  private baseSuggestions: { [categoryId: string]: string[] } = {
    // Electronics
    "493964": ["wireless headphones", "smartphone case", "laptop stand", "wireless charger", "bluetooth speaker", "gaming mouse", "tablet accessories", "smart watch"],
    // Clothing, Shoes & Jewelry  
    "7141124011": ["sneakers", "casual shirt", "jeans", "dress", "winter jacket", "accessories", "watch", "sunglasses"],
    // Home & Kitchen
    "1063498": ["coffee maker", "kitchen organizer", "bedding set", "home decor", "storage solutions", "dinnerware", "cookware", "lighting"],
    // Health & Personal Care
    "3760931": ["skincare routine", "supplements", "fitness tracker", "personal care", "wellness products", "beauty tools", "oral care", "hair care"],
    // Sports & Outdoors
    "3375301": ["workout equipment", "outdoor gear", "athletic shoes", "fitness accessories", "camping gear", "sports equipment", "activewear", "water bottle"],
    // Books
    "1000": ["bestseller books", "fiction novels", "self-help books", "cookbooks", "textbooks", "children's books", "business books", "biography"],
    // Beauty
    "11055981": ["makeup", "skincare", "fragrance", "beauty tools", "nail care", "hair styling", "cosmetics", "beauty accessories"],
    // Toys & Games
    "165795011": ["board games", "educational toys", "action figures", "puzzle games", "outdoor toys", "craft kits", "electronic toys", "building blocks"],
    // Office Products
    "1084128": ["desk organizer", "office supplies", "ergonomic chair", "desk lamp", "notebooks", "stationery", "filing solutions", "presentation tools"],
    // Automotive
    "15690151": ["car accessories", "car care", "tools", "automotive parts", "car electronics", "interior accessories", "exterior accessories", "maintenance"]
  };

  // Generate personalized suggestions based on survey data
  generateSuggestions(categoryId: string, surveyData: SurveyData, userId: string): string[] {
    const cacheKey = this.getCacheKey(categoryId, userId);
    
    // Check cache first
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    // Get base suggestions for category
    const baseSuggestions = this.baseSuggestions[categoryId] || [
      "trending items", "popular products", "best sellers", "new arrivals", 
      "top rated", "featured items", "deals", "essentials"
    ];

    // Personalize based on survey data
    const personalizedSuggestions = this.personalizeSuggestions(baseSuggestions, surveyData, categoryId);
    
    // Cache the result
    this.suggestionCache.set(cacheKey, personalizedSuggestions);
    
    // Also save to localStorage for persistence
    const allCachedSuggestions = JSON.parse(localStorage.getItem('categorySuggestions') || '{}');
    allCachedSuggestions[cacheKey] = personalizedSuggestions;
    localStorage.setItem('categorySuggestions', JSON.stringify(allCachedSuggestions));
    
    return personalizedSuggestions;
  }

  // Load cached suggestions from localStorage
  loadCachedSuggestions(): void {
    try {
      const cached = localStorage.getItem('categorySuggestions');
      if (cached) {
        const suggestions = JSON.parse(cached);
        Object.entries(suggestions).forEach(([key, value]) => {
          this.suggestionCache.set(key, value as string[]);
        });
      }
    } catch (error) {
      console.error('Error loading cached suggestions:', error);
    }
  }

  private personalizeSuggestions(baseSuggestions: string[], surveyData: SurveyData, categoryId: string): string[] {
    let suggestions = [...baseSuggestions];
    
    // Personalize based on budget
    if (surveyData.budget) {
      if (surveyData.budget.includes('budget') || surveyData.budget.includes('affordable')) {
        suggestions = suggestions.map(s => Math.random() > 0.5 ? `affordable ${s}` : `budget ${s}`);
      } else if (surveyData.budget.includes('premium') || surveyData.budget.includes('luxury')) {
        suggestions = suggestions.map(s => Math.random() > 0.5 ? `premium ${s}` : `luxury ${s}`);
      }
    }

    // Personalize based on brand preference
    if (surveyData.brandPreference) {
      if (surveyData.brandPreference.includes('brand')) {
        suggestions.push('brand name products', 'popular brands');
      } else if (surveyData.brandPreference.includes('generic') || surveyData.brandPreference.includes('no preference')) {
        suggestions.push('generic products', 'unbranded items');
      }
    }

    // Personalize based on motivations
    if (surveyData.motivations?.length > 0) {
      surveyData.motivations.forEach(motivation => {
        if (motivation.includes('quality')) {
          suggestions.push('high quality', 'durable products', 'well-reviewed');
        } else if (motivation.includes('price') || motivation.includes('deal')) {
          suggestions.push('best deals', 'discounted', 'sale items');
        } else if (motivation.includes('convenience')) {
          suggestions.push('quick delivery', 'easy to use', 'convenient');
        } else if (motivation.includes('style') || motivation.includes('fashion')) {
          suggestions.push('trendy', 'stylish', 'fashionable');
        }
      });
    }

    // Personalize based on style preferences for relevant categories
    if (surveyData.stylePreferences?.length > 0 && 
        (categoryId === "7141124011" || categoryId === "11055981" || categoryId === "1063498")) {
      surveyData.stylePreferences.forEach(style => {
        if (style.includes('modern')) {
          suggestions.push('modern style', 'contemporary');
        } else if (style.includes('classic')) {
          suggestions.push('classic style', 'timeless');
        } else if (style.includes('casual')) {
          suggestions.push('casual wear', 'everyday');
        } else if (style.includes('formal')) {
          suggestions.push('formal wear', 'professional');
        }
      });
    }

    // Personalize based on shopping pattern
    if (surveyData.shoppingPattern) {
      if (surveyData.shoppingPattern.includes('research')) {
        suggestions.push('best rated', 'top reviews', 'highly recommended');
      } else if (surveyData.shoppingPattern.includes('impulse')) {
        suggestions.push('trending now', 'popular today', 'hot items');
      } else if (surveyData.shoppingPattern.includes('planned')) {
        suggestions.push('essentials', 'must-have', 'practical');
      }
    }

    // Remove duplicates and limit to 8 suggestions
    const uniqueSuggestions = [...new Set(suggestions)];
    return uniqueSuggestions.slice(0, 8);
  }

  // Get suggestions for a category (with fallback)
  getSuggestions(categoryId: string, surveyData: SurveyData | null, userId: string): string[] {
    if (!surveyData) {
      // Return base suggestions if no survey data
      return this.baseSuggestions[categoryId]?.slice(0, 6) || [
        "trending items", "popular products", "best sellers", "new arrivals"
      ];
    }

    return this.generateSuggestions(categoryId, surveyData, userId);
  }

  // Clear cached suggestions (for when user redoes survey)
  clearCache(): void {
    this.suggestionCache.clear();
    localStorage.removeItem('categorySuggestions');
  }
}

const suggestionGenerator = new CategorySuggestionGenerator();

// Smooth animation variants
const smoothVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Search cache implementation
class SearchCache {
  private cache = new Map<string, { result: SearchResult; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(query: string, categoryId: string, userId?: string): string {
    return `${query.toLowerCase().trim()}-${categoryId}-${userId || 'anonymous'}`;
  }

  get(query: string, categoryId: string, userId?: string): SearchResult | null {
    const key = this.getCacheKey(query, categoryId, userId);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  set(query: string, categoryId: string, result: SearchResult, userId?: string): void {
    const key = this.getCacheKey(query, categoryId, userId);
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    this.cleanup();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}

const searchCache = new SearchCache();

// Mobile-optimized Search Interface Component
function SearchInterface({ user, surveyData }: { user: UserProfile; surveyData: SurveyData | null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(AMAZON_CATEGORIES[13]); // Electronics as default
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<{[categoryId: string]: string[]}>({});
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [suggestionKey, setSuggestionKey] = useState(0);
  
  // Performance optimizations
  const searchAbortController = useRef<AbortController | null>(null);
  const searchStartTime = useRef<number>(0);

  // Load saved data on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedHistory = localStorage.getItem('searchHistory');
    
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
    
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // Handle migration from old string array format
        if (Array.isArray(parsedHistory)) {
          setSearchHistory({ [selectedCategory.id]: parsedHistory });
        } else {
          setSearchHistory(parsedHistory);
        }
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }

    // Load cached suggestions
    suggestionGenerator.loadCachedSuggestions();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save search history
  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Show tutorial on first search
  useEffect(() => {
    if (searchResults && hasSearched && !localStorage.getItem('tutorial_completed')) {
      setShowTutorial(true);
    }
  }, [searchResults, hasSearched]);

  // Regenerate suggestions when survey data changes or category changes
  useEffect(() => {
    if (surveyData && user) {
      // Pre-generate suggestions for current category to ensure they're cached
      suggestionGenerator.getSuggestions(selectedCategory.id, surveyData, user.id);
    }
  }, [surveyData, selectedCategory.id, user]);

  // Optimized search function with caching
  const performSearch = useCallback(async (query: string, category: Category, userId: string) => {
    // Cancel previous search
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }

    // Create new abort controller
    searchAbortController.current = new AbortController();
    
    try {
      // Check cache first
      const cachedResult = searchCache.get(query, category.id, userId);
      if (cachedResult) {
        console.log('🚀 Using cached search result');
        return cachedResult;
      }

      // Start timer for performance measurement
      searchStartTime.current = Date.now();
      
      console.log(`🔍 Starting search for: "${query}" in category: ${category.name} (${category.id})`);
      
      // Search with the selected category ID and user ID for personalization
      const results = await apiClient.search(query, category.id, category.name, userId);
      
      // Cache the result
      searchCache.set(query, category.id, results, userId);
      
      // Log performance
      const searchTime = Date.now() - searchStartTime.current;
      console.log(`✅ Search completed in ${searchTime}ms`);
      
      return results;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🚫 Search aborted');
        return null;
      }
      throw error;
    }
  }, []);

  const handleManualSearch = async (queryOverride?: string) => {
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      
      // Set random loading message
      const randomMessage = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
      setLoadingMessage(randomMessage);
      
      const results = await performSearch(query, selectedCategory, user.id);
      
      if (results) {
        setSearchResults(results);
        
        // Add to category-specific search history
        setSearchHistory(prev => {
          const categoryHistory = prev[selectedCategory.id] || [];
          const newCategoryHistory = [query, ...categoryHistory.filter(q => q !== query)].slice(0, 6);
          return {
            ...prev,
            [selectedCategory.id]: newCategoryHistory
          };
        });
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      handleManualSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Memoized category-specific suggestions
  const suggestions = useMemo(() => {
    const categoryHistory = searchHistory[selectedCategory.id] || [];
    
    // Show recent searches for this category if no query typed
    if (!searchQuery.trim() && categoryHistory.length > 0) {
      return categoryHistory.slice(0, 4).map(query => ({ query, type: 'history' as const }));
    }
    
    // Show filtered suggestions when typing
    if (searchQuery.trim()) {
      // Get category-specific suggestions
      const categorySuggestions = suggestionGenerator.getSuggestions(
        selectedCategory.id, 
        surveyData, 
        user.id
      );
      
      const filtered = categorySuggestions
        .filter(suggestion => 
          suggestion.toLowerCase().includes(searchQuery.toLowerCase()) && 
          suggestion.toLowerCase() !== searchQuery.toLowerCase()
        )
        .slice(0, 3)
        .map(query => ({ query, type: 'suggestion' as const }));
        
      return filtered;
    }
    
    // Show category-specific suggestions when focused but no query
    if (searchBarFocused && !searchQuery.trim()) {
      const categorySuggestions = suggestionGenerator.getSuggestions(
        selectedCategory.id, 
        surveyData, 
        user.id
      );
      
      return categorySuggestions.slice(0, 4).map(query => ({ query, type: 'suggestion' as const }));
    }
    
    return [];
  }, [searchQuery, searchHistory, selectedCategory.id, surveyData, user.id, searchBarFocused, suggestionKey]);

  const handleSuggestionClick = async (suggestion: string) => {
    // Close suggestions immediately
    setShowSuggestions(false);
    
    // Set the search query
    setSearchQuery(suggestion);
    
    // Trigger search directly with the suggestion
    await handleManualSearch(suggestion);
  };

  const handleSwipeLeft = (product: Product) => {
    console.log(`👎 Product trashed: ${product.title}`);
  };

  const handleSwipeRight = (product: Product) => {
    console.log(`❤️ Product liked: ${product.title}`);
    
    // Add to cart (avoid duplicates by checking if product already exists)
    setCartItems(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (!exists) {
        return [...prev, product];
      }
      return prev;
    });
  };

  const handleSwipeComplete = () => {
    console.log('🎉 All products swiped!');
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('survey');
    localStorage.removeItem('tutorial_completed');
    localStorage.removeItem('cart');
    localStorage.removeItem('searchHistory');
    localStorage.removeItem('categorySuggestions');
    suggestionGenerator.clearCache();
    window.location.reload();
  };

  const handleSurveyComplete = (newSurveyData: SurveyData, userId: string) => {
    localStorage.setItem('survey', JSON.stringify(newSurveyData));
    setShowSurvey(false);
    window.location.reload();
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('tutorial_completed', 'true');
  };

  // Settings handlers
  const handleRedoSurvey = () => {
    // Clear cached suggestions when redoing survey
    suggestionGenerator.clearCache();
    setShowSurvey(true);
    setShowSettings(false);
  };

  const handleClearHistory = () => {
    setSearchHistory({});
    localStorage.removeItem('searchHistory');
    setShowSettings(false);
    console.log('🗑️ Search history cleared');
  };

  const handleResetTutorial = () => {
    localStorage.removeItem('tutorial_completed');
    setShowSettings(false);
    console.log('📚 Tutorial reset - will show on next search');
  };

  const handleEditProfile = () => {
    setShowProfileEdit(true);
    setShowSettings(false);
  };

  const handleProfileSave = async (name: string, username: string) => {
    try {
      // Update user in localStorage
      const updatedUser = { ...user, name, username };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update survey data if it exists
      if (surveyData) {
        const updatedSurvey = { ...surveyData, name, username };
        localStorage.setItem('survey', JSON.stringify(updatedSurvey));
      }
      
      // Force reload to update all references
      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-black relative flex flex-col">
      {/* Cart Modal */}
      <Cart
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Survey Modal */}
      <AnimatePresence>
        {showSurvey && (
          <div className="fixed inset-0 z-50">
            <Survey
              onClose={() => setShowSurvey(false)}
              onComplete={handleSurveyComplete}
              initialData={surveyData || undefined}
              userId={user.id}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        user={user}
        onSave={handleProfileSave}
      />

      {/* Mobile Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10"
      >
        <div className="flex items-center justify-between px-4 py-3 safe-area-top">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-white text-xl font-bold">Shoppr</h1>
            {surveyData && (
              <div className="ml-3 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            )}
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Cart Button */}
            <AnimatePresence>
              {cartItems.length > 0 && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCart(true)}
                  className="relative bg-white/10 backdrop-blur-md text-white p-3 rounded-full border border-white/20 min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {cartItems.length}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* User Profile Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="bg-white/5 backdrop-blur-md text-white p-2 rounded-full border border-white/10 min-w-[48px] min-h-[48px] flex items-center space-x-2 px-3"
            >
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium truncate max-w-[80px]">
                {user.name.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>

        {/* Survey Banner */}
        <AnimatePresence>
          {!surveyData && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-purple-600/15 border-b border-purple-500/20"
            >
              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-white/90 text-sm flex-1">
                  ✨ Get better AI results
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSurvey(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium min-h-[40px]"
                >
                  Take Survey
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Settings Menu Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl border-t border-white/10 safe-area-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                
                <h3 className="text-white text-xl font-semibold mb-6">Settings</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={handleEditProfile}
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-4 rounded-xl text-white transition-colors min-h-[56px] flex items-center"
                  >
                    <User className="w-5 h-5 mr-3 text-white/60" />
                    Edit Profile
                  </button>
                  
                  <button
                    onClick={handleRedoSurvey}
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-4 rounded-xl text-white transition-colors min-h-[56px] flex items-center"
                  >
                    <Settings className="w-5 h-5 mr-3 text-white/60" />
                    Redo Survey
                  </button>
                  
                  <button
                    onClick={handleClearHistory}
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-4 rounded-xl text-white transition-colors min-h-[56px] flex items-center"
                  >
                    <Clock className="w-5 h-5 mr-3 text-white/60" />
                    Clear Search History
                  </button>
                  
                  <button
                    onClick={handleResetTutorial}
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-4 rounded-xl text-white transition-colors min-h-[56px] flex items-center"
                  >
                    <AlertCircle className="w-5 h-5 mr-3 text-white/60" />
                    Reset Tutorial
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left bg-red-500/10 hover:bg-red-500/20 p-4 rounded-xl text-red-400 transition-colors min-h-[56px] flex items-center border border-red-500/20"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Search Section - Always Visible */}
        <div className="px-4 py-6 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-4"
          >
            {/* Main Search Input - Mobile Optimized */}
            <motion.div
              animate={{
                scale: searchBarFocused ? 1.01 : 1,
                boxShadow: searchBarFocused 
                  ? '0 0 0 2px rgba(147, 51, 234, 0.4), 0 8px 24px rgba(0, 0, 0, 0.15)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative search-input-container"
              style={{ zIndex: 10000 }}
            >
              <div className="flex items-center bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-4 group hover:bg-white/12 transition-all duration-300">
                <Search className="w-6 h-6 text-white/60 mr-4 group-focus-within:text-purple-400 transition-colors duration-300 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => {
                    setSearchBarFocused(true);
                    setShowSuggestions(true);
                    // Close category dropdown if open
                    setIsDropdownOpen(false);
                  }}
                  onBlur={() => {
                    setSearchBarFocused(false);
                    // Longer delay to ensure clicks register properly
                    setTimeout(() => setShowSuggestions(false), 300);
                  }}
                  className="flex-1 bg-transparent text-white text-lg placeholder-white/50 focus:outline-none"
                  style={{ fontSize: '16px' }} // Prevents zoom on iOS
                />
                {isSearching && (
                  <Loader className="w-5 h-5 animate-spin text-purple-400 ml-3 flex-shrink-0" />
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleManualSearch()}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl ml-3 transition-all duration-300 font-medium min-h-[40px]"
                >
                  {isSearching ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </motion.button>
              </div>

              {/* Search Suggestions - Mobile Optimized with Maximum Z-Index */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-xl shadow-2xl overflow-hidden"
                    style={{ 
                      backgroundColor: '#000000',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                      zIndex: 9999
                    }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.query}
                        onMouseDown={(e) => {
                          // Prevent the input blur from canceling the click
                          e.preventDefault();
                        }}
                        onClick={() => handleSuggestionClick(suggestion.query)}
                        className="w-full text-left px-5 py-4 hover:bg-purple-600/20 active:bg-purple-600/30 transition-colors flex items-center text-white min-h-[60px] border-b border-white/10 last:border-b-0"
                        style={{ backgroundColor: index === 0 ? '#000000' : 'inherit' }}
                      >
                        <div className="flex items-center space-x-3">
                          {suggestion.type === 'history' ? (
                            <Clock className="w-5 h-5 text-white/60 flex-shrink-0" />
                          ) : (
                            <Search className="w-5 h-5 text-white/60 flex-shrink-0" />
                          )}
                          <span className="text-base font-semibold text-white">{suggestion.query}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Category Selector - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="relative"
            >
              <button
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  // Close suggestions when opening category dropdown
                  setShowSuggestions(false);
                }}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-white transition-all duration-300 min-h-[56px]"
              >
                <span className="text-white/90 text-base">in {selectedCategory.name}</span>
                <motion.div
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChevronDown className="w-5 h-5 text-white/60" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 bg-black/20"
                      style={{ zIndex: 50 }}
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    
                    {/* Dropdown - Mobile Optimized with Solid Background */}
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute top-full left-0 right-0 mt-3 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
                      style={{ 
                        backgroundColor: '#111827',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                        zIndex: 100
                      }}
                    >
                      <div className="py-2">
                        {AMAZON_CATEGORIES.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsDropdownOpen(false);
                              // Clear search query when switching categories
                              setSearchQuery('');
                              // Force suggestions to refresh for new category
                              setSuggestionKey(prev => prev + 1);
                              setShowSuggestions(false);
                            }}
                            className={`w-full text-left px-4 py-4 hover:bg-white/15 active:bg-white/20 transition-colors min-h-[56px] flex items-center border-b border-white/5 last:border-b-0 ${
                              selectedCategory.id === category.id 
                                ? 'bg-purple-600/30 text-purple-300 hover:bg-purple-600/40' 
                                : 'text-white'
                            }`}
                          >
                            <span className="text-base font-medium">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {isSearching && (
              <motion.div
                variants={smoothVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex-1 flex items-center justify-center px-4"
              >
                <div className="text-center max-w-xs">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 mx-auto mb-6"
                  >
                    <div className="w-full h-full border-4 border-purple-600/30 border-t-purple-400 rounded-full"></div>
                  </motion.div>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white text-lg mb-3 font-medium"
                  >
                    Shoppr AI is working...
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/60 text-sm leading-relaxed"
                  >
                    {loadingMessage}
                  </motion.p>
                </div>
              </motion.div>
            )}

            {!isSearching && searchResults && (
              <motion.div
                variants={smoothVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex-1"
              >
                {searchResults.products.length > 0 ? (
                  <div className="flex-1 flex items-center justify-center px-4">
                    <TinderSwipe
                      products={searchResults.products}
                      onSwipeLeft={handleSwipeLeft}
                      onSwipeRight={handleSwipeRight}
                      onEmpty={handleSwipeComplete}
                      showTutorial={showTutorial}
                      onTutorialComplete={handleTutorialComplete}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center max-w-xs">
                      <AlertCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
                      <p className="text-white text-lg mb-2 font-medium">No results found</p>
                      <p className="text-white/60 text-sm">Try a different search term or category</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {!isSearching && !hasSearched && (
              <motion.div
                variants={smoothVariants}
                initial="initial"
                animate="animate"
                className="flex-1 flex items-center justify-center px-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                  className="text-center max-w-sm"
                >
                  <Search className="w-20 h-20 text-white/30 mx-auto mb-6" />
                  <h2 className="text-white text-xl mb-3 font-semibold">
                    Welcome to Shoppr, {user.name.split(' ')[0]}!
                  </h2>
                  <p className="text-white/60 text-base leading-relaxed mb-8">
                    Type your search and press Enter or tap Search to find AI-powered recommendations
                  </p>
                  
                  {surveyData && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className="inline-flex items-center text-purple-400 bg-purple-600/15 px-4 py-3 rounded-full border border-purple-600/25"
                    >
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></span>
                      <span className="text-sm font-medium">Shoppr AI personalization active</span>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);

  useEffect(() => {
    // Check for saved user and survey data in localStorage on app load
    const checkSavedData = () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedSurvey = localStorage.getItem('survey');
        
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          console.log('Found saved user:', parsedUser);
          setUser(parsedUser);
        }
        
        if (savedSurvey) {
          const parsedSurvey = JSON.parse(savedSurvey);
          console.log('Found saved survey data:', parsedSurvey);
          setSurveyData(parsedSurvey);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('survey');
      } finally {
        setIsLoading(false);
      }
    };

    checkSavedData();
  }, []);

  const handleSignIn = () => {
    setShowSurvey(true);
  };

  const handleSurveyComplete = (newSurveyData: SurveyData, userId: string) => {
    // Create user profile object
    const userProfile: UserProfile = {
      id: userId,
      name: newSurveyData.name,
      username: newSurveyData.username,
      created_at: new Date().toISOString()
    };

    // Save both user and survey data to localStorage
    localStorage.setItem('user', JSON.stringify(userProfile));
    localStorage.setItem('survey', JSON.stringify(newSurveyData));
    
    // Update state
    setUser(userProfile);
    setSurveyData(newSurveyData);
    setShowSurvey(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-600/30 border-t-purple-400 rounded-full"
        />
      </div>
    );
  }

  // Show survey if triggered from landing
  if (showSurvey) {
    return <NewSurvey onComplete={handleSurveyComplete} />;
  }

  // Show landing screen if no user
  if (!user) {
    return <LandingScreen onSignIn={handleSignIn} />;
  }

  // Show search interface if user exists
  return <SearchInterface user={user} surveyData={surveyData} />;
}