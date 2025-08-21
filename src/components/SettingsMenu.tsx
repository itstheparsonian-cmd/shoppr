import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, RefreshCw, History, BookOpen, User, Trash2, ChevronRight } from 'lucide-react';

interface SettingsMenuProps {
  user: { name: string; username: string };
  surveyData: any;
  onRedoSurvey: () => void;
  onClearHistory: () => void;
  onResetTutorial: () => void;
  onEditProfile: () => void;
}

export function SettingsMenu({ 
  user, 
  surveyData, 
  onRedoSurvey, 
  onClearHistory, 
  onResetTutorial,
  onEditProfile 
}: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Settings Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
      >
        <Settings className="w-4 h-4" />
      </motion.button>

      {/* Settings Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute right-0 top-full mt-2 w-72 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-40 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-medium">Settings</h3>
                <p className="text-white/60 text-sm">{user.name}</p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {/* Profile Section */}
                <div className="px-2">
                  <button
                    onClick={() => handleMenuClick(onEditProfile)}
                    className="w-full flex items-center justify-between px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Edit Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                <div className="my-2 mx-4 border-t border-white/10"></div>

                {/* Survey Section */}
                <div className="px-2">
                  <button
                    onClick={() => handleMenuClick(onRedoSurvey)}
                    className="w-full flex items-center justify-between px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <RefreshCw className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm">Redo Survey</div>
                        <div className="text-xs text-white/50">Update your preferences</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  
                  {surveyData && (
                    <div className="px-3 py-2 text-xs text-white/50">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span>Survey completed</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="my-2 mx-4 border-t border-white/10"></div>

                {/* App Data Section */}
                <div className="px-2 space-y-1">
                  <button
                    onClick={() => handleMenuClick(onClearHistory)}
                    className="w-full flex items-center justify-between px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <History className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm">Clear Search History</div>
                        <div className="text-xs text-white/50">Remove all saved searches</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button
                    onClick={() => handleMenuClick(onResetTutorial)}
                    className="w-full flex items-center justify-between px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm">Reset Tutorial</div>
                        <div className="text-xs text-white/50">Show tutorial again</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                <div className="my-2 mx-4 border-t border-white/10"></div>

                {/* Danger Zone */}
                <div className="px-2">
                  <div className="px-3 py-2">
                    <h4 className="text-xs text-red-400 font-medium mb-2">Danger Zone</h4>
                    <p className="text-xs text-white/40 mb-3">These actions cannot be undone</p>
                    
                    <button className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 group">
                      <Trash2 className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm">Delete All Data</div>
                        <div className="text-xs text-red-400/60">Cart, history, preferences</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-white/10 bg-white/5">
                <p className="text-xs text-white/40 text-center">
                  Shopping AI v1.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}