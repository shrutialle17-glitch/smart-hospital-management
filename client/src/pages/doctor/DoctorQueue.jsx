import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { Users as UsersIcon, Play as PlayIcon, CheckCircle as CheckCircleIcon, Forward as ForwardIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorQueue = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['doctor-queue'],
    queryFn: async () => {
      // Get the doctor ID for this user
      const docRes = await api.get('/users/profile');
      const doctorId = docRes.data.data.doctorProfile?.id;
      if (!doctorId) return null;
      
      const res = await api.get(`/queue/doctor/${doctorId}`);
      return res.data.data;
    },
    refetchInterval: 5000 // Poll every 5s
  });

  const callNext = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/queue/${id}/call`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['doctor-queue']);
    }
  });

  const completeToken = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/queue/${id}/complete`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Consultation completed');
      queryClient.invalidateQueries(['doctor-queue']);
    }
  });

  const skipToken = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/queue/${id}/skip`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['doctor-queue']);
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="card" count={2} />
      </div>
    );
  }

  const { tokens = [], avgConsultationMinutes = 15, nowServing = null, tokensWaiting = 0 } = queueData || {};
  const waitingTokens = tokens.filter(t => t.status === 'WAITING');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Live Queue</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage today's walk-in and appointment patients.</p>
        </div>
        <div className="flex gap-4 text-center">
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Waiting</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{tokensWaiting}</span>
          </div>
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Duration</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{avgConsultationMinutes}m</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Consultation Panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 border-t-4 border-primary dark:border-secondary h-full flex flex-col">
            <h2 className="text-lg font-bold mb-6 text-gray-900 dark:text-white uppercase tracking-wider">Now Serving</h2>
            
            {nowServing ? (
              <div className="flex-grow flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 bg-primary/10 dark:bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl font-black text-primary dark:text-secondary">#{nowServing.tokenNumber}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {nowServing.patient.user.firstName} {nowServing.patient.user.lastName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{nowServing.patient.user.phone}</p>
                
                <div className="w-full space-y-3 mt-auto">
                  <button 
                    onClick={() => completeToken.mutate(nowServing.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg shadow-green-600/20 transition-all active:scale-95"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Complete Consultation
                  </button>
                  <button 
                    onClick={() => skipToken.mutate(nowServing.id)}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors"
                  >
                    No Show / Skip
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <UsersIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-6">No active consultation.</p>
                
                {waitingTokens.length > 0 && (
                  <button 
                    onClick={() => callNext.mutate(waitingTokens[0].id)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 dark:bg-secondary dark:hover:bg-secondary/90 text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95"
                  >
                    <PlayIcon className="w-5 h-5" />
                    Call Next Patient (#{waitingTokens[0].tokenNumber})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Waiting List */}
        <div className="lg:col-span-2 glass-panel overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h2 className="font-semibold text-gray-900 dark:text-white">Waiting List</h2>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {waitingTokens.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No patients waiting in queue.
              </div>
            ) : (
              waitingTokens.map((t, idx) => (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center font-bold text-gray-700 dark:text-gray-300">
                      {t.tokenNumber}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {t.patient.user.firstName} {t.patient.user.lastName}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Est. wait: {t.estimatedWaitMinutes}m</p>
                    </div>
                  </div>
                  <div>
                    {!nowServing && idx === 0 && (
                      <button 
                        onClick={() => callNext.mutate(t.id)}
                        className="px-3 py-1.5 bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary hover:bg-primary/20 rounded-md text-sm font-medium"
                      >
                        Call
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DoctorQueue;
