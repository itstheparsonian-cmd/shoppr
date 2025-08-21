import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'motion/react';
import { ShoppingCart, Info, Trash2, Check } from 'lucide-react';
import { Product } from '../utils/supabase/client';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface TinderSwipeProps {
  products: Product[];
  onSwipeLeft: (product: Product) => void;
  onSwipeRight: (product: Product) => void;
  onEmpty: () => void;
  showTutorial?: boolean;
  onTutorialComplete?: () => void;
}

export function TinderSwipe({ 
  products, 
  onSwipeLeft, 
  onSwipeRight, 
  onEmpty,
  showTutorial = false,
  onTutorialComplete 
}: TinderSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState(products);
  const [showReasoningFor, setShowReasoningFor] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    setCards(products);
    setCurrentIndex(0);
  }, [products]);

  useEffect(() => {
    if (currentIndex >= cards.length && cards.length > 0) {
      onEmpty();
    }
  }, [currentIndex, cards.length, onEmpty]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
    }).format(price);
  };

  const triggerFlash = (direction: 'left' | 'right') => {
    setShowFlash(direction);
    setTimeout(() => setShowFlash(null), 400);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= cards.length) return;

    const currentCard = cards[currentIndex];
    
    // Show flash animation
    triggerFlash(direction);
    
    if (direction === 'left') {
      onSwipeLeft(currentCard);
    } else {
      onSwipeRight(currentCard);
    }
    
    setCurrentIndex(prev => prev + 1);
    setShowReasoningFor(null);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 80;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(velocity) >= 400 || Math.abs(offset) >= threshold) {
      if (offset > 0 || velocity > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    } else {
      // Smooth snap back to center
      controls.start({ 
        x: 0, 
        rotate: 0,
        transition: { 
          type: 'spring', 
          stiffness: 500, 
          damping: 35,
          mass: 0.8 
        }
      });
    }
  };

  const currentProduct = cards[currentIndex];
  const nextProduct = cards[currentIndex + 1];

  if (!currentProduct) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center justify-center h-[600px] text-white"
      >
        <div className="text-center">
          <ShoppingCart className="w-20 h-20 mx-auto mb-6 text-white/30" />
          <h3 className="text-2xl font-medium mb-3">All done!</h3>
          <p className="text-white/60">Search again to discover more products</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px] flex items-center justify-center">
      {/* Flash Animation Overlays */}
      <AnimatePresence>
        {showFlash === 'left' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 bg-red-500/80 rounded-3xl flex items-center justify-center z-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white/10 rounded-full p-8"
            >
              <Trash2 className="w-20 h-20 text-white drop-shadow-lg" />
            </motion.div>
          </motion.div>
        )}

        {showFlash === 'right' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 bg-green-500/80 rounded-3xl flex items-center justify-center z-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: 20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white/10 rounded-full p-8"
            >
              <Check className="w-20 h-20 text-white drop-shadow-lg" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm rounded-3xl flex items-center justify-center"
          >
            <div className="text-center text-white p-8">
              <motion.div
                animate={{ x: [-15, 15, -15] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8"
              >
                <div className="w-16 h-16 bg-red-500/90 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Trash2 className="w-8 h-8 text-white" />
                </div>
                <p className="text-white/80 font-medium">Swipe left to pass</p>
              </motion.div>
              
              <motion.div
                animate={{ x: [15, -15, 15] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                className="mb-8"
              >
                <div className="w-16 h-16 bg-green-500/90 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <p className="text-white/80 font-medium">Swipe right to save</p>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onTutorialComplete}
                className="bg-white text-black px-8 py-3 rounded-xl font-medium shadow-lg transition-all duration-300"
              >
                Got it!
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background card (next product) */}
      {nextProduct && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0.3 }}
          animate={{ scale: 0.95, opacity: 0.6 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-0 bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl"
        />
      )}

      {/* Main card - Ultra smooth */}
      <motion.div
        key={`card-${currentIndex}`}
        ref={cardRef}
        drag="x"
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.05}
        animate={controls}
        initial={{ x: 0, rotate: 0, scale: 1, opacity: 1 }}
        onDragEnd={handleDragEnd}
        whileDrag={{ 
          rotate: (info: any) => {
            const rotation = Math.min(Math.max(info.offset.x / 12, -20), 20);
            return rotation;
          },
          scale: 1.03,
          transition: { 
            type: 'spring', 
            stiffness: 400, 
            damping: 30,
            mass: 0.5
          }
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 400, 
          damping: 35,
          mass: 0.7
        }}
        className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl cursor-grab active:cursor-grabbing overflow-hidden will-change-transform border border-white/10"
        style={{ 
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      >
        {/* Product Image */}
        <div className="h-2/3 relative overflow-hidden rounded-t-3xl">
          <ImageWithFallback
            src={currentProduct.image}
            alt={currentProduct.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
          
          {/* Rank Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-purple-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-white/20"
          >
            #{currentProduct.rank} AI Pick
          </motion.div>

          {/* Info Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowReasoningFor(
              showReasoningFor === currentProduct.id ? null : currentProduct.id
            )}
            className="absolute bottom-6 right-6 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 border border-white/20"
          >
            <Info className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Product Info */}
        <div className="h-1/3 p-6 flex flex-col justify-between">
          <div>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-white font-medium text-lg mb-3 line-clamp-2 leading-relaxed"
            >
              {currentProduct.title}
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-green-400 text-2xl font-bold"
            >
              {formatPrice(currentProduct.price, currentProduct.currency)}
            </motion.p>
          </div>

          {/* Progress indicator */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex items-center justify-center space-x-2 mt-4"
          >
            {cards.slice(0, 5).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === currentIndex 
                    ? 'bg-white w-8' 
                    : 'bg-white/30 w-1.5'
                }`}
              />
            ))}
            {cards.length > 5 && (
              <span className="text-white/60 text-sm ml-3 font-medium">
                {currentIndex + 1}/{cards.length}
              </span>
            )}
          </motion.div>
        </div>

        {/* AI Reasoning Overlay */}
        <AnimatePresence>
          {showReasoningFor === currentProduct.id && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-x-0 bottom-0 bg-black/95 backdrop-blur-xl text-white p-6 rounded-b-3xl border-t border-white/10"
            >
              <h4 className="font-semibold mb-3 text-lg">Why AI ranked this #{currentProduct.rank}:</h4>
              <p className="text-white/80 text-sm leading-relaxed">{currentProduct.reasoning}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}