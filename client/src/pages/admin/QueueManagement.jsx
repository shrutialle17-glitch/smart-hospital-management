import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { Users as UsersIcon, Clock as ClockIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const QueueManagement = () => {
  const queryClient = useQueryClient();

  const { data: queuesData, isLoading } = useQuery({
    queryKey: ['all-queues'],
    queryFn: async () => {
      const res = await api.get('/queue');
      return res.data;
    },
    refetchInterval: 5000 // Poll every 5s for live reception screen
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="card" count={4} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />
      </div>
    );
  }

  const queues = queuesData?.data || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Queue Monitor</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time token tracking across all departments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queues.map((q) => (
          <motion.div key={q.doctorId} whileHover={{ y: -2 }} className="glass-panel p-0 overflow-hidden flex flex-col">
            <div className="bg-primary/10 dark:bg-secondary/20 p-4 border-b border-primary/20 dark:border-secondary/30">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{q.doctorName}</h3>
              <p className="text-sm text-primary dark:text-secondary font-medium">{q.department}</p>
            </div>
            
            <div className="p-6 flex-grow flex flex-col justify-center items-center bg-gray-50 dark:bg-surface/50">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-wider">Now Serving</p>
                {q.nowServing ? (
                  <div className="inline-block px-6 py-3 bg-white dark:bg-gray-800 border-2 border-primary dark:border-secondary rounded-xl shadow-lg shadow-primary/20">
                    <span className="text-4xl font-black text-gray-900 dark:text-white">
                      #{q.nowServing.tokenNumber}
                    </span>
                  </div>
                ) : (
                  <span className="text-xl font-medium text-gray-400 italic">None</span>
                )}
              </div>

              <div className="w-full grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
                    <UsersIcon className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Waiting</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{q.tokensWaiting}</span>
                </div>
                <div className="text-center border-l border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Est. Wait</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{q.estimatedWaitMinutes} <span className="text-xs font-normal">m</span></span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {queues.length === 0 && (
        <EmptyState title="No Active Queues" message="There are no patients checked in today." icon={UsersIcon} />
      )}
    </motion.div>
  );
};

export default QueueManagement;
