import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { Users as UsersIcon, Clock as ClockIcon } from 'lucide-react';

const QueueStatus = () => {
  const { data: tokenData, isLoading } = useQuery({
    queryKey: ['patient-queue'],
    queryFn: async () => {
      const res = await api.get('/queue/patient');
      return res.data;
    },
    refetchInterval: 5000 // Poll every 5s
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-md mx-auto space-y-6">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  const token = tokenData?.data;

  if (!token) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <EmptyState 
          title="No Active Token" 
          message="You do not have an active queue token for today. Please visit the reception to check-in for your appointment." 
          icon={UsersIcon} 
        />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 max-w-md mx-auto">
      <div className="glass-panel overflow-hidden text-center">
        <div className="bg-primary text-white dark:bg-secondary p-6">
          <h2 className="text-sm font-medium uppercase tracking-widest opacity-80 mb-2">Your Token Number</h2>
          <div className="text-7xl font-black">{token.tokenNumber}</div>
        </div>
        
        <div className="p-6 bg-white dark:bg-surface">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Dr. {token.doctor.user.firstName} {token.doctor.user.lastName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{token.doctor.department?.name}</p>

          {token.status === 'IN_CONSULTATION' ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <span className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                Please enter the consultation room.
              </span>
            </div>
          ) : token.status === 'CALLED' ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <span className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-lg animate-pulse">
                It's your turn! Please proceed.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
                  <UsersIcon className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Ahead of you</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{token.tokensAhead}</span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
                  <ClockIcon className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Est. Wait</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{token.estimatedWaitMinutes} <span className="text-sm font-normal text-gray-500">min</span></span>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800/30 p-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
          This is a live ticket. Do not refresh.
        </div>
      </div>
    </motion.div>
  );
};

export default QueueStatus;
