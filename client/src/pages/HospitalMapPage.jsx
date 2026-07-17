import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../services/api';
import HospitalMap from '../components/HospitalMap/HospitalMap';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { useAuthStore } from '../store/authStore';

const HospitalMapPage = () => {
  const { user } = useAuthStore();
  
  const { data: queuesData, isLoading } = useQuery({
    queryKey: ['map-queues'],
    queryFn: async () => {
      const res = await api.get('/queue');
      return res.data;
    },
    refetchInterval: 10000, // Poll every 10s for map
    enabled: user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST'
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="card" className="h-[600px]" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hospital Layout Map</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Interactive wayfinding and live department load.</p>
      </div>
      
      <HospitalMap queuesData={queuesData?.data || []} isPublic={false} />
    </motion.div>
  );
};

export default HospitalMapPage;
