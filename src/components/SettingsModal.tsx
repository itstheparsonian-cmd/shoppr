import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Settings, Palette, LogOut } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mainColor: string;
  accentColor: string;
  onColorChange: (mainColor: string, accentColor: string) => void;
  onSignOut: () => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  mainColor, 
  accentColor, 
  onColorChange, 
  onSignOut 
}: SettingsModalProps) {
  const [tempMainColor, setTempMainColor] = useState(mainColor);
  const [tempAccentColor, setTempAccentColor] = useState(accentColor);

  if (!isOpen) return null;

  const colorOptions = [
    { name: 'Purple', value: 'purple' },
    { name: 'Blue', value: 'blue' },
    { name: 'Green', value: 'green' },
    { name: 'Red', value: 'red' },
    { name: 'Pink', value: 'pink' },
    { name: 'Orange', value: 'orange' },
    { name: 'Teal', value: 'teal' },
    { name: 'Indigo', value: 'indigo' }
  ];

  const handleSaveColors = () => {
    onColorChange(tempMainColor, tempAccentColor);
  };

  const handleSignOut = () => {
    onSignOut();
    onClose();
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      pink: 'bg-pink-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
      indigo: 'bg-indigo-500'
    };
    return colorMap[color] || 'bg-purple-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl text-white">Settings</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Color Customization */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="w-5 h-5 text-purple-400" />
              <h3 className="text-white">Theme Colors</h3>
            </div>
            
            {/* Main Color */}
            <div className="mb-4">
              <label className="block text-white text-sm mb-3">Main Color</label>
              <div className="grid grid-cols-4 gap-3">
                {colorOptions.map((color, index) => (
                  <motion.button
                    key={`main-${color.value}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setTempMainColor(color.value)}
                    className={`w-full aspect-square rounded-lg ${getColorClasses(color.value)} transition-all ${
                      tempMainColor === color.value 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' 
                        : 'hover:scale-105'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="mb-4">
              <label className="block text-white text-sm mb-3">Accent Color</label>
              <div className="grid grid-cols-4 gap-3">
                {colorOptions.map((color, index) => (
                  <motion.button
                    key={`accent-${color.value}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setTempAccentColor(color.value)}
                    className={`w-full aspect-square rounded-lg ${getColorClasses(color.value)} transition-all ${
                      tempAccentColor === color.value 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' 
                        : 'hover:scale-105'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveColors}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Save Colors
            </motion.button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-700 pt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}