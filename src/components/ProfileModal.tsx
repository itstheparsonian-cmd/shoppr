import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, User, Edit3, RefreshCw, Check, AlertCircle, Loader } from 'lucide-react';
import { apiClient } from '../utils/supabase/client';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userUsername: string;
  onUpdateProfile: (name: string, username: string) => void;
  onRedoSurvey: () => void;
}

export function ProfileModal({ 
  isOpen, 
  onClose, 
  userId,
  userName, 
  userUsername, 
  onUpdateProfile, 
  onRedoSurvey 
}: ProfileModalProps) {
  const [name, setName] = useState(userName);
  const [username, setUsername] = useState(userUsername);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [usernameError, setUsernameError] = useState('');

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName(userName);
      setUsername(userUsername);
      setIsEditing(false);
      setUsernameStatus('idle');
      setUsernameError('');
    }
  }, [isOpen, userName, userUsername]);

  // Check username availability when editing and username changes
  useEffect(() => {
    if (!isEditing || username === userUsername || !username.trim()) {
      setUsernameStatus('idle');
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setUsernameStatus('checking');
        const result = await apiClient.checkUsername(username.trim());
        setUsernameStatus(result.available ? 'available' : 'taken');
        setUsernameError(result.available ? '' : 'Username is already taken');
      } catch (error) {
        setUsernameStatus('error');
        setUsernameError('Failed to check username availability');
        console.error('Username check error:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, userUsername, isEditing]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim() || !username.trim()) return;
    
    // If username changed, check if it's available
    if (username !== userUsername && usernameStatus !== 'available') return;
    
    try {
      setIsSaving(true);
      await apiClient.updateUser(userId, name.trim(), username.trim());
      onUpdateProfile(name.trim(), username.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(userName);
    setUsername(userUsername);
    setIsEditing(false);
    setUsernameStatus('idle');
    setUsernameError('');
  };

  const canSave = () => {
    if (!name.trim() || !username.trim()) return false;
    if (username === userUsername) return true; // Username unchanged
    return usernameStatus === 'available';
  };

  const renderUsernameStatus = () => {
    if (username === userUsername) return null;
    
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
            <User className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl text-white">Profile</h1>
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
          {/* Profile Info */}
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <User className="w-10 h-10 text-white" />
            </motion.div>
            
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-white text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-white text-sm mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    disabled={isSaving}
                  />
                  {renderUsernameStatus()}
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={!canSave() || isSaving}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                    <span>Save</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl text-white">{userName}</h2>
                <p className="text-gray-400">@{userUsername}</p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Survey Section */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-white mb-4">Survey Preferences</h3>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-300 text-sm mb-4">
                Want to update your shopping preferences? You can retake the survey to get more personalized recommendations.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onRedoSurvey();
                  onClose();
                }}
                disabled={isEditing || isSaving}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Survey</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}