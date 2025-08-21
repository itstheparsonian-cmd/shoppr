import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotatingText } from './RotatingText';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';

interface LandingScreenProps {
  onSignIn: () => void;
}

export function LandingScreen({ onSignIn }: LandingScreenProps) {
  const rotatingWords = [
    'smart',
    'your way', 
    'personalized',
    'boldly',
    'intelligently'
  ];

  const handleAppleSignIn = async () => {
    try {
      const result = await SignInWithApple.authorize();
      if (result.response && result.response.email && result.response.name) {
        // Store the user info in localStorage for the survey
        localStorage.setItem('appleSignIn', JSON.stringify({
          name: `${result.response.name.firstName} ${result.response.name.lastName}`,
          email: result.response.email
        }));
        onSignIn();
      }
    } catch (error) {
      console.error('Apple Sign In failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Mobile-optimized layout */}
      <div className="flex-1 flex flex-col">
        {/* Header section with Shoppr and rotating text */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          {/* Shoppr heading - Mobile optimized */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-2"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl text-white leading-none tracking-tight">
              <span className="font-bold">Shop</span><span className="font-light text-white/70">pr</span>
            </h1>
          </motion.div>

          {/* Rotating text in cursive - Mobile optimized */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl text-white/90 leading-none"
            style={{ fontFamily: 'Alex Brush, cursive' }}
          >
            <RotatingText words={rotatingWords} interval={2200} />
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6"
          >
            <p className="text-white/70 text-lg sm:text-xl leading-relaxed max-w-md">
              AI-powered shopping that learns your style and finds perfect matches
            </p>
          </motion.div>
        </div>

        {/* Bottom section with sign-in buttons - Mobile optimized */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex-shrink-0 px-6 pb-8 space-y-4 safe-area-bottom"
        >
          {/* Sign in with Apple - Mobile first design */}
          <button
            onClick={handleAppleSignIn}
            className="w-full bg-white text-black py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-lg min-h-[56px]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span className="text-lg font-semibold">Sign in with Apple</span>
          </button>

          {/* Sign in with Google - Mobile optimized */}
          <button
            onClick={onSignIn}
            className="w-full bg-white text-black py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-lg border border-gray-200 min-h-[56px]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-lg font-semibold">Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center space-x-4 my-6">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-white/50 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Continue as Guest */}
          <button
            onClick={onSignIn}
            className="w-full bg-transparent border-2 border-white/30 text-white py-4 px-6 rounded-2xl hover:bg-white/10 active:bg-white/5 transition-colors min-h-[56px]"
          >
            <span className="text-lg font-semibold">Continue as Guest</span>
          </button>

          {/* Privacy note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="text-center text-white/40 text-sm leading-relaxed mt-4"
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </motion.p>
        </motion.div>
      </div>

      {/* Mobile-specific gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none"></div>
    </div>
  );
}