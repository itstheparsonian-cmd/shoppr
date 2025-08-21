import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, ExternalLink, Trash2 } from 'lucide-react';
import { Product } from '../utils/supabase/client';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: Product[];
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export function Cart({ isOpen, onClose, cartItems, onRemoveItem, onClearCart }: CartProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
    }).format(price);
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Cart Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl mx-4 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-6 h-6 text-green-400" />
                <h2 className="text-xl text-white font-medium">Your Cart</h2>
                <span className="bg-green-600 text-white text-sm px-2 py-1 rounded-full">
                  {cartItems.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="overflow-y-auto max-h-[60vh]">
              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">Your cart is empty</p>
                  <p className="text-gray-400">Start swiping to add products you love!</p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 bg-gray-800/50 rounded-lg p-4"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-green-400 font-bold">
                          {formatPrice(item.price, item.currency)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          AI Rank: #{item.rank}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(item.url, '_blank')}
                          className="text-purple-400 hover:text-purple-300 transition-colors p-2"
                          title="View Product"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2"
                          title="Remove from Cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Total ({cartItems.length} items):</span>
                  <span className="text-white text-xl font-bold">
                    {formatPrice(totalPrice, 'GBP')}
                  </span>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={onClearCart}
                    className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => {
                      // Open all product links
                      cartItems.forEach(item => {
                        if (item.url && item.url !== '#') {
                          window.open(item.url, '_blank');
                        }
                      });
                    }}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View All Products
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}