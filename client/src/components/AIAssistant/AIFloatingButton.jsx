import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useAIStore } from '../../store/aiStore';

const AIFloatingButton = () => {
  const { isDrawerOpen, toggleDrawer } = useAIStore();

  return (
    <button
      onClick={toggleDrawer}
      className="fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg bg-primary text-white hover:bg-secondary transition-colors focus:outline-none focus:ring-4 focus:ring-primary/20 flex items-center justify-center"
      aria-label="Toggle AI Assistant"
    >
      <AnimatePresence mode="wait">
        {isDrawerOpen ? (
          <motion.div
            key="close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <X size={24} />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <MessageCircle size={24} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default AIFloatingButton;
