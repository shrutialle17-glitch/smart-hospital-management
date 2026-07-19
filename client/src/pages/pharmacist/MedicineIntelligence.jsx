import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { Sparkles as SparklesIcon, FileText as DocumentTextIcon, TrendingUp as ArrowTrendingUpIcon, ShoppingCart as ShoppingCartIcon } from 'lucide-react';

const MedicineIntelligence = () => {
  const { data: intelData, isLoading } = useQuery({
    queryKey: ['medicine-intelligence'],
    queryFn: async () => {
      const res = await api.get('/pharmacy/intelligence');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="card" count={2} className="grid grid-cols-1 md:grid-cols-2 gap-6" />
      </div>
    );
  }

  const { prescribingTrends = [], restockRecommendations = [] } = intelData?.data || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent dark:from-secondary dark:to-accent flex items-center gap-2">
          <SparklesIcon className="w-7 h-7 text-primary dark:text-secondary" />
          AI Medicine Intelligence
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Smart insights on prescribing trends and automated restock suggestions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Prescribing Trends */}
        <div className="glass-panel overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <ArrowTrendingUpIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Prescribing Trends</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Most frequently billed and prescribed medications.</p>
            </div>
          </div>
          
          <div className="p-6 flex-grow">
            {prescribingTrends.length === 0 ? (
              <EmptyState title="No Trends Available" message="Not enough billing data to determine trends." icon={DocumentTextIcon} />
            ) : (
              <div className="space-y-4 relative">
                {/* Decorative timeline line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                
                {prescribingTrends.map((trend, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center relative z-10"
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-surface border-4 border-blue-100 dark:border-blue-900/30 flex flex-shrink-0 items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm mr-4 shadow-sm">
                      #{idx + 1}
                    </div>
                    <div className="flex-grow p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-surface/50 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{trend.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Prescribed {trend.prescriptionCount} times recently</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Smart Restock Recommendations */}
        <div className="glass-panel overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <ShoppingCartIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Restock Engine</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automated purchase order recommendations.</p>
            </div>
          </div>
          
          <div className="p-0 flex-grow">
            {restockRecommendations.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No Recommendations" message="Inventory levels are sufficient. No restock needed." icon={ShoppingCartIcon} />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Medicine</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary dark:text-secondary uppercase tracking-wider font-bold">Suggested Order</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-surface divide-y divide-gray-200 dark:divide-gray-700">
                  {restockRecommendations.map((rec) => (
                    <tr key={rec.medicineId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {rec.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 dark:text-red-400 font-bold">
                        {rec.currentStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400 font-bold">
                        +{rec.recommendedOrder} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {restockRecommendations.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
              <button className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <ShoppingCartIcon className="w-4 h-4" />
                Generate Purchase Order PDF
              </button>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default MedicineIntelligence;
