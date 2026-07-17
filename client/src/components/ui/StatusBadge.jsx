import React from 'react';
import clsx from 'clsx';

const StatusBadge = ({ status, type = 'default' }) => {
  const getColors = () => {
    const s = status.toUpperCase();
    if (['AVAILABLE', 'COMPLETED', 'PAID', 'FULFILLED', 'APPROVED'].includes(s)) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
    if (['OCCUPIED', 'EN_ROUTE', 'IN_CONSULTATION', 'ACTIVE'].includes(s)) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
    if (['RESERVED', 'REQUESTED', 'DISPATCHED', 'PENDING', 'WAITING', 'CLEANING'].includes(s)) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
    if (['CRITICAL', 'CANCELLED', 'SKIPPED', 'REJECTED', 'EXPIRED'].includes(s)) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getColors())}>
      {status}
    </span>
  );
};

export default StatusBadge;
