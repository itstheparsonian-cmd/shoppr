import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ShoppingBag, Smartphone, Home, Heart, Zap, Book, Coffee, Car, Baby, User, Check, AlertCircle, Loader } from 'lucide-react';
import { apiClient } from '../utils/supabase/client';

interface SurveyData {
  name: string;
  username: string;
  categories: string[];
  budget: string;
  motivations: string[];
  brandPreference: string;
  shoppingPattern: string;
  stylePreferences: string[];
  dealSensitivity: string;
  otherCategory: string;
}

interface SurveyProps {
  onClose: () => void;
  onComplete: (data: SurveyData, userId: string) => void;
  initialData?: Partial<SurveyData>;
  userId?: string;
}

export function Survey({ onClose, onComplete, initialData, userId }: SurveyProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    name: '',
    username: '',
    categories: [],
    budget: '',
    motivations: [],
    brandPreference: '',
    shoppingPattern: '',
    stylePreferences: [],
    dealSensitivity: '',
    otherCategory: '',
    ...initialData
  });
  
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalQuestions = 8;

  useEffect(() => {
    if (!surveyData.username.trim() || currentQuestion !== 0) {
      setUsernameStatus('idle');
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setUsernameStatus('checking');
        const result = await apiClient.checkUsername(surveyData.username.trim());
        setUsernameStatus(result.available ? 'available' : 'taken');
        setUsernameError(result.available ? '' : 'Username is already taken');
      } catch (error) {
        setUsernameStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Failed to check username availability';
        setUsernameError(errorMessage);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [surveyData.username, currentQuestion]);

  const handleNext = async () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      await handleSurveyComplete();
    }
  };

  const handleSurveyComplete = async () => {
    try {
      setIsSubmitting(true);
      
      if (userId) {
        await apiClient.saveSurvey(userId, surveyData);
        onComplete(surveyData, userId);
      } else {
        const userResult = await apiClient.createUser(surveyData.name, surveyData.username);
        const newUserId = userResult.user.id;
        await apiClient.saveSurvey(newUserId, surveyData);
        onComplete(surveyData, newUserId);
      }
    } catch (error) {
      console.error('Error completing survey:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save survey';
      alert(`Error: ${errorMessage}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const updateSurveyData = (field: keyof SurveyData, value: any) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof SurveyData, item: string) => {
    const currentArray = surveyData[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateSurveyData(field, newArray);
  };

  const categories = [
    { id: 'fashion', label: 'Fashion & Clothing', icon: ShoppingBag },
    { id: 'electronics', label: 'Electronics & Tech', icon: Smartphone },
    { id: 'home', label: 'Home & Kitchen', icon: Home },
    { id: 'beauty', label: 'Health & Beauty', icon: Heart },
    { id: 'sports', label: 'Sports & Outdoors', icon: Zap },
    { id: 'books', label: 'Books & Media', icon: Book },
    { id: 'food', label: 'Food & Beverages', icon: Coffee },
    { id: 'automotive', label: 'Automotive', icon: Car },
    { id: 'baby', label: 'Baby & Kids', icon: Baby }
  ];

  const motivations = [
    'Best price/deals',
    'Quality and durability',
    'Brand reputation',
    'Customer reviews',
    'Latest trends/new releases',
    'Sustainability/eco-friendly',
    'Convenience/fast delivery',
    'Unique/hard-to-find items'
  ];

  const styles = [
    'Minimalist/Clean',
    'Bold/Vibrant',
    'Classic/Traditional',
    'Modern/Contemporary',
    'Rustic/Vintage',
    'Bohemian/Eclectic',
    'Industrial/Urban',
    'I like variety/multiple styles'
  ];

  const renderUsernameStatus = () => {
    switch (usernameStatus) {
      case 'checking':
        return (
          <div className="flex items-center space-x-2 text-blue-400 mt-2">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Checking availability...</span>
          </div>
        );
      case 'available':
        return (
          <div className="flex items-center space-x-2 text-green-400 mt-2">
            <Check className="w-4 h-4" />
            <span className="text-sm">Username available!</span>
          </div>
        );
      case 'taken':
        return (
          <div className="flex items-center space-x-2 text-red-400 mt-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{usernameError}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-yellow-400 mt-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{usernameError}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderQuestion = () => {
    switch (currentQuestion) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2>Let's get to know you!</h2>
              <p className="text-gray-300">Tell us a bit about yourself</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={surveyData.name}
                  onChange={(e) => updateSurveyData('name', e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Username</label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={surveyData.username}
                  onChange={(e) => updateSurveyData('username', e.target.value)}
                  disabled={!!userId}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none disabled:opacity-60"
                />
                {!userId && (
                  <>
                    <p className="text-gray-400 text-sm mt-1">This will be your unique identifier</p>
                    {renderUsernameStatus()}
                  </>
                )}
                {userId && (
                  <p className="text-gray-400 text-sm mt-1">Username cannot be changed when updating survey</p>
                )}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2>What types of products do you shop for most often?</h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => toggleArrayItem('categories', id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    surveyData.categories.includes(id)
                      ? 'border-purple-400 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-2 mx-auto" />
                  <div className="text-sm">{label}</div>
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Other (please specify)"
              value={surveyData.otherCategory}
              onChange={(e) => updateSurveyData('otherCategory', e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2>What's your typical spending range for purchases?</h2>
            <div className="space-y-4">
              {[
                { value: 'budget', label: 'Budget-conscious (Under $25 typical purchase)' },
                { value: 'moderate', label: 'Moderate ($25-100 typical purchase)' },
                { value: 'premium', label: 'Premium ($100-500 typical purchase)' },
                { value: 'luxury', label: 'Luxury ($500+ typical purchase)' },
                { value: 'varies', label: 'It varies by category' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSurveyData('budget', value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    surveyData.budget === value
                      ? 'border-purple-400 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2>What usually drives your shopping decisions?</h2>
            <p className="text-gray-300">Select your top 3 motivations:</p>
            <div className="grid grid-cols-1 gap-3">
              {motivations.map((motivation) => (
                <button
                  key={motivation}
                  onClick={() => toggleArrayItem('motivations', motivation)}
                  disabled={!surveyData.motivations.includes(motivation) && surveyData.motivations.length >= 3}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    surveyData.motivations.includes(motivation)
                      ? 'border-purple-400 bg-purple-500/20 text-white'
                      : surveyData.motivations.length >= 3
                      ? 'border-gray-700 bg-gray-800/30 text-gray-500 cursor-not-allowed'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {motivation}
                  {surveyData.motivations.includes(motivation) && (
                    <span className="ml-2 text-purple-400">✓</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              Selected: {surveyData.motivations.length}/3
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2>How important are brands to you?</h2>
            <div className="space-y-4">
              {[
                { value: 'loyal', label: "I'm very brand-loyal (stick to trusted brands)" },
                { value: 'prefer', label: 'I prefer known brands but will try new ones' },
                { value: 'open', label: "I'm open to any brand if the product is good" },
                { value: 'indie', label: 'I actively seek out lesser-known/indie brands' },
                { value: 'price', label: "Brand doesn't matter, only price/quality does" }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSurveyData('brandPreference', value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    surveyData.brandPreference === value
                      ? 'border-purple-400 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2>How do you typically shop?</h2>
            <div className="space-y-4">
              {[
                { value: 'planner', label: 'I plan purchases in advance and research thoroughly' },
                { value: 'browser', label: 'I browse regularly and buy when something catches my eye' },
                { value: 'immediate', label: 'I shop when I need something specific right away' },
                { value: 'discovery', label: 'I love discovering new products through recommendations' },
                { value: 'sales', label: 'I mainly shop during sales/special events' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSurveyData('shoppingPattern', value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    surveyData.shoppingPattern === value
                      ? 'border-purple-400 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2>Which styles appeal to you most?</h2>
            <p className="text-gray-300">Select all that apply:</p>
            <div className="grid grid-cols-2 gap-4">
              {styles.map((style) => (
                <button
                  key={style}
                  onClick={() => toggleArrayItem('stylePreferences', style)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    surveyData.stylePreferences.includes(style)
                      ? 'border-purple-400 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2>How do sales and discounts affect your shopping?</h2>
            <div className="space-y-4">
              {[
                { value: 'wait', label: 'I almost always wait for sales before buying' },
                { value: 'check', label: 'I check for discounts but will buy at full price if needed' },
                { value: 'nice', label: "Discounts are nice but don't drive my decisions" },
                { value: 'consistent', label: 'I prefer consistent pricing over sales' },
                { value: 'value', label: 'I focus on value rather than discounts' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSurveyData('dealSensitivity', value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    surveyData.dealSensitivity === value
                      ? 'border-purple-400 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentQuestion) {
      case 0: 
        if (userId) {
          return surveyData.name.trim() !== '';
        } else {
          return surveyData.name.trim() !== '' && 
                 surveyData.username.trim() !== '' && 
                 (usernameStatus === 'available');
        }
      case 1: return surveyData.categories.length > 0;
      case 2: return surveyData.budget !== '';
      case 3: return surveyData.motivations.length > 0;
      case 4: return surveyData.brandPreference !== '';
      case 5: return surveyData.shoppingPattern !== '';
      case 6: return surveyData.stylePreferences.length > 0;
      case 7: return surveyData.dealSensitivity !== '';
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h1 className="text-xl text-white">
              {userId ? 'Update Survey' : 'Shopping Preferences Survey'}
            </h1>
            <p className="text-gray-400 text-sm">Question {currentQuestion + 1} of {totalQuestions}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] text-white">
          {renderQuestion()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0 || isSubmitting}
            className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="px-8 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
            <span>{currentQuestion === totalQuestions - 1 ? 'Complete' : 'Next'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}