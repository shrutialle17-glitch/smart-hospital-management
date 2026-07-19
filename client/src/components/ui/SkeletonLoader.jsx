import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const SkeletonLoader = ({ count = 1, type = 'list', className }) => {
  const elements = Array.from({ length: count });

  const getStyleForType = () => {
    switch (type) {
      case 'card':
        return 'h-32 rounded-xl';
      case 'avatar':
        return 'h-12 w-12 rounded-full';
      case 'text':
        return 'h-4 rounded-md w-3/4';
      case 'title':
        return 'h-8 rounded-md w-1/2';
      case 'list':
      default:
        return 'h-16 rounded-xl w-full';
    }
  };

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {elements.map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut', repeatType: 'reverse' }}
          className={clsx('bg-gray-200 dark:bg-gray-700', getStyleForType())}
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;
