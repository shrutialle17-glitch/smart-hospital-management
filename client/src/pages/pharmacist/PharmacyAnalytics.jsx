import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import AnimatedChart from '../../components/ui/AnimatedChart';
import { DollarSign as CurrencyDollarIcon, LineChart as PresentationChartLineIcon, Layers as Square3Stack3DIcon, AlertTriangle as ExclamationTriangleIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PharmacyAnalytics = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['pharmacy-analytics'],
    queryFn: async () => {
      const res = await api.get('/pharmacy/analytics');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="card" count={3} className="grid grid-cols-1 md:grid-cols-3 gap-6" />
        <SkeletonLoader type="card" className="h-64 mt-8" />
      </div>
    );
  }

  const { overview, stockHealth, actionableAlerts } = analyticsData?.data || {};

  const chartData = [
    { name: 'Healthy Stock', value: stockHealth?.good || 0, color: '#10b981' }, // green-500
    { name: 'Low Stock', value: stockHealth?.low || 0, color: '#f59e0b' },   // yellow-500
    { name: 'Out of Stock', value: stockHealth?.out || 0, color: '#ef4444' }  // red-500
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pharmacy Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">High-level financial and inventory performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <CurrencyDollarIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">${overview?.totalRevenue?.toFixed(2)}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Square3Stack3DIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Medicines</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overview?.totalMedicines}</h3>
            <p className="text-xs text-gray-400 mt-1">Across {overview?.categoriesCount} categories</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center gap-4 border-l-4 border-yellow-500">
          <div className="p-3 rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
            <ExclamationTriangleIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Actionable Alerts</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overview?.lowStockCount}</h3>
            <p className="text-xs text-gray-400 mt-1">Items need restocking</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Stock Health Chart */}
        <AnimatedChart className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <PresentationChartLineIcon className="w-5 h-5 text-gray-400" />
            Inventory Health Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }} contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedChart>

        {/* Actionable Restock List */}
        <div className="glass-panel p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Critical Stock Alerts</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Top 5 items requiring immediate purchase orders.</p>
          </div>
          <div className="p-6 flex-grow">
            {actionableAlerts?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                All inventory levels are healthy.
              </div>
            ) : (
              <ul className="space-y-4">
                {actionableAlerts?.map((item) => (
                  <li key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Min Threshold: {item.minStock}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-xl font-bold text-red-600 dark:text-red-400">{item.stockLevel}</span>
                      <span className="text-xs text-red-500 uppercase font-medium tracking-wider">In Stock</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PharmacyAnalytics;
