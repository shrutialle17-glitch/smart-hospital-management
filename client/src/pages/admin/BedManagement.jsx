import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { FlaskConical as BeakerIcon, Home as HomeIcon, AlertTriangle as ExclamationTriangleIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const BedManagement = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: wardsData, isLoading: loadingWards } = useQuery({
    queryKey: ['wards'],
    queryFn: async () => {
      const res = await api.get('/beds/wards');
      return res.data;
    },
    refetchInterval: 10000 // Poll every 10s
  });

  const { data: bedsData, isLoading: loadingBeds } = useQuery({
    queryKey: ['beds'],
    queryFn: async () => {
      const res = await api.get('/beds');
      return res.data;
    },
    refetchInterval: 10000
  });

  const releaseBed = useMutation({
    mutationFn: async (bedId) => {
      const res = await api.patch(`/beds/${bedId}/release`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Bed released for cleaning');
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['wards']);
    }
  });

  const markAvailable = useMutation({
    mutationFn: async (bedId) => {
      const res = await api.patch(`/beds/${bedId}/status`, { status: 'AVAILABLE' });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Bed is now available');
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['wards']);
    }
  });

  if (loadingWards || loadingBeds) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="card" count={3} className="grid grid-cols-1 md:grid-cols-3 gap-4" />
      </div>
    );
  }

  const wards = wardsData?.data || [];
  const beds = bedsData?.data || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ward & Bed Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time occupancy monitoring and bed allocation.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary dark:border-secondary dark:text-secondary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Ward Overview
        </button>
        <button
          onClick={() => setActiveTab('all-beds')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'all-beds'
              ? 'border-primary text-primary dark:border-secondary dark:text-secondary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          All Beds List
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wards.map(ward => (
            <motion.div 
              key={ward.id}
              whileHover={{ y: -2 }}
              className="glass-panel p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{ward.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{ward.description}</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary">
                  <HomeIcon className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Total Beds</span>
                  <span className="font-medium">{ward.total}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 dark:text-green-400">Available</span>
                  <span className="font-medium">{ward.available}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-600 dark:text-blue-400">Occupied</span>
                  <span className="font-medium">{ward.occupied}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-yellow-600 dark:text-yellow-400">Cleaning/Reserved</span>
                  <span className="font-medium">{ward.cleaning + ward.reserved}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div style={{ width: `${(ward.occupied / ward.total) * 100}%` }} className="bg-blue-500"></div>
                <div style={{ width: `${((ward.cleaning + ward.reserved) / ward.total) * 100}%` }} className="bg-yellow-500"></div>
                <div style={{ width: `${(ward.available / ward.total) * 100}%` }} className="bg-green-500"></div>
              </div>
            </motion.div>
          ))}
          {wards.length === 0 && (
            <div className="col-span-full">
              <EmptyState title="No Wards Found" message="There are no wards configured in the system." />
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bed / Ward</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Patient</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-surface divide-y divide-gray-200 dark:divide-gray-700">
                {beds.map((bed) => (
                  <tr key={bed.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Bed {bed.bedNumber}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{bed.ward?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">{bed.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={bed.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {bed.currentPatient ? (
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-white font-medium">
                            {bed.currentPatient.user.firstName} {bed.currentPatient.user.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Empty</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(user.role === 'ADMIN' || user.role === 'RECEPTIONIST') && (
                        <div className="flex justify-end gap-2">
                          {bed.status === 'OCCUPIED' && (
                            <button
                              onClick={() => releaseBed.mutate(bed.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Discharge
                            </button>
                          )}
                          {bed.status === 'CLEANING' && (
                            <button
                              onClick={() => markAvailable.mutate(bed.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Mark Clean
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {beds.length === 0 && (
              <EmptyState title="No Beds Found" message="There are no beds available in the selected filters." className="border-0 rounded-none border-t" />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BedManagement;
