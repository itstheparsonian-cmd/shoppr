import { useState } from 'react';
import { motion } from 'motion/react';
import { User, UserPlus, Loader, AlertCircle } from 'lucide-react';
import { apiClient, UserProfile } from '../utils/supabase/client';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck.trim() || isLogin) return;
    
    setIsCheckingUsername(true);
    try {
      const result = await apiClient.checkUsername(usernameToCheck);
      setUsernameAvailable(result.available);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameAvailable(null);
    
    // Debounce username check for signup mode
    if (!isLogin && value.trim()) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login flow
        const result = await apiClient.login(username);
        console.log('Login successful:', result.user);
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        if (result.survey) {
          localStorage.setItem('survey', JSON.stringify(result.survey));
        }
        
        onLoginSuccess(result.user);
      } else {
        // Signup flow
        if (!name.trim()) {
          setError('Name is required for signup');
          return;
        }
        
        const result = await apiClient.createUser(name, username);
        console.log('Signup successful:', result.user);
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        
        onLoginSuccess(result.user);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (error instanceof Error) {
        if (error.message.includes('User not found')) {
          setError('Username not found. Try signing up instead.');
        } else if (error.message.includes('already taken')) {
          setError('Username is already taken. Try a different one.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-sm rounded-lg p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            {isLogin ? <User className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
          </motion.div>
          <h1 className="text-white text-2xl font-medium mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-white/70">
            {isLogin ? 'Enter your username to continue' : 'Choose a username to get started'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your full name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your username"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader className="w-4 h-4 text-white/60 animate-spin" />
                </div>
              )}
            </div>
            
            {!isLogin && username && !isCheckingUsername && usernameAvailable !== null && (
              <p className={`text-sm mt-1 ${usernameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                {usernameAvailable ? 'Username is available!' : 'Username is already taken'}
              </p>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 text-red-400 bg-red-400/10 rounded-lg p-3"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading || (!isLogin && usernameAvailable === false)}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setUsernameAvailable(null);
                setName('');
                setUsername('');
              }}
              className="text-purple-300 hover:text-white transition-colors text-sm"
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}