import React from 'react';
import { motion } from 'framer-motion';
import { Info as InformationCircleIcon } from 'lucide-react';
import clsx from 'clsx';

const EmptyState = ({ title, message, icon: Icon = InformationCircleIcon, action, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-surface border border-dashed border-gray-300 dark:border-gray-700 rounded-xl', className)}
    >
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{message}</p>
      {action && (
        <div>{action}</div>
      )}
    </motion.div>
  );
};

export default EmptyState;
