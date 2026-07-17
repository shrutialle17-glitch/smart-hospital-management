import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { FlaskConical as BeakerIcon, AlertTriangle as ExclamationTriangleIcon } from 'lucide-react';

const BloodBankPage = () => {
  const { data: inventoryData, isLoading: loadingInv } = useQuery({
    queryKey: ['blood-inventory'],
    queryFn: async () => {
      const res = await api.get('/blood-bank/inventory');
      return res.data;
    }
  });

  if (loadingInv) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="card" count={8} className="grid grid-cols-2 md:grid-cols-4 gap-4" />
      </div>
    );
  }

  const inventory = inventoryData?.data || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blood Bank Inventory</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor blood stock levels and expiry warnings.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {inventory.map((group) => (
          <motion.div
            key={group.bloodGroup}
            whileHover={{ scale: 1.02 }}
            className={`glass-panel p-6 border-l-4 ${
              group.totalUnits === 0 
                ? 'border-red-500' 
                : group.totalUnits < 5 
                  ? 'border-yellow-500' 
                  : 'border-green-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {group.bloodGroup.replace('_POS', '+').replace('_NEG', '-')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Blood Group</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                <BeakerIcon className="w-6 h-6 text-red-500" />
              </div>
            </div>
            
            <div className="mt-4">
              <span className="text-3xl font-black text-gray-900 dark:text-white">{group.totalUnits}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">Units</span>
            </div>

            {(group.expiringSoon > 0 || group.expired > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 space-y-1">
                {group.expiringSoon > 0 && (
                  <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    {group.expiringSoon} units expiring in &lt; 7 days
                  </div>
                )}
                {group.expired > 0 && (
                  <div className="flex items-center text-xs text-red-600 dark:text-red-400 font-medium">
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    {group.expired} units expired
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {inventory.length === 0 && (
        <EmptyState title="No Inventory Data" message="The blood bank database is currently empty." icon={BeakerIcon} />
      )}
    </motion.div>
  );
};

export default BloodBankPage;
