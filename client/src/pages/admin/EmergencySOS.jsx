import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { Heart as HeartIcon, Truck as TruckIcon, FlaskConical as BeakerIcon, AlertTriangle as ExclamationTriangleIcon, Stethoscope, Clock, MapPin as MapPinIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EmergencySOS = () => {
  const queryClient = useQueryClient();

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['emergency-status'],
    queryFn: async () => (await api.get('/emergency/status')).data,
    refetchInterval: 8000
  });

  // We fetch ambulance requests and filter for priority === 'CRITICAL' to simulate an "emergency queue"
  const { data: activeQueueData } = useQuery({
    queryKey: ['emergency-queue'],
    queryFn: async () => (await api.get('/ambulance/requests')).data,
    refetchInterval: 8000
  });

  const dispatchAmbulance = useMutation({
    mutationFn: async () => (await api.post('/emergency/dispatch-ambulance', { notes: 'Automated SOS trigger' })).data,
    onSuccess: () => {
      toast.success('Emergency ambulance dispatched!');
      queryClient.invalidateQueries(['emergency-status']);
      queryClient.invalidateQueries(['emergency-queue']);
    }
  });

  const requestIcu = useMutation({
    mutationFn: async () => (await api.post('/emergency/request-icu', { notes: 'Automated SOS Bed Request' })).data,
    onSuccess: () => {
      toast.success('ICU bed successfully reserved!');
      queryClient.invalidateQueries(['emergency-status']);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to request ICU bed')
  });

  const requestBlood = useMutation({
    mutationFn: async () => (await api.post('/emergency/request-blood', { bloodGroup: 'O_NEG', units: 2, notes: 'Emergency O- Universal Donor request' })).data,
    onSuccess: () => {
      toast.success('Critical O- blood request submitted!');
      queryClient.invalidateQueries(['emergency-status']);
    }
  });

  const assignDoctor = useMutation({
    mutationFn: async () => (await api.post('/emergency/assign-doctor', { notes: 'Automated SOS Doctor Assignment' })).data,
    onSuccess: () => toast.success('Emergency doctor assigned immediately!'),
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to assign doctor')
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="card" count={4} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" />
        <SkeletonLoader type="card" count={1} />
      </div>
    );
  }

  const status = statusData?.data || { availableIcuBeds: 0, activeAmbulanceDispatches: 0, criticalBloodRequests: 0 };
  const queue = (activeQueueData?.data || []).filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-7 h-7" />
            Emergency SOS Command Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">One-click critical resource mobilization and live queue monitoring.</p>
        </div>
        <div className="px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm font-semibold animate-pulse shadow-sm shadow-red-500/20">
          LIVE SYSTEMS ACTIVE
        </div>
      </div>

      {/* Action Console */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Ambulance Status */}
        <div className="glass-panel p-6 border-l-4 border-yellow-500 flex flex-col justify-between shadow-md shadow-yellow-500/5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ambulance</h2>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600">
                <TruckIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
              {status.activeAmbulanceDispatches} <span className="text-sm font-normal text-gray-500">Active</span>
            </p>
          </div>
          <button 
            onClick={() => dispatchAmbulance.mutate()} disabled={dispatchAmbulance.isPending}
            className="mt-6 w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-all active:scale-95 disabled:opacity-70"
          >
            DISPATCH AMBULANCE
          </button>
        </div>

        {/* ICU Bed Status */}
        <div className="glass-panel p-6 border-l-4 border-red-500 flex flex-col justify-between shadow-md shadow-red-500/5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ICU Beds</h2>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                <HeartIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
              {status.availableIcuBeds} <span className="text-sm font-normal text-gray-500">Available</span>
            </p>
          </div>
          <button 
            onClick={() => requestIcu.mutate()} disabled={status.availableIcuBeds === 0 || requestIcu.isPending}
            className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95"
          >
            HOLD 1 ICU BED
          </button>
        </div>

        {/* Blood Status */}
        <div className="glass-panel p-6 border-l-4 border-purple-500 flex flex-col justify-between shadow-md shadow-purple-500/5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Blood Bank</h2>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                <BeakerIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
              {status.criticalBloodRequests} <span className="text-sm font-normal text-gray-500">Pending</span>
            </p>
          </div>
          <button 
            onClick={() => requestBlood.mutate()} disabled={requestBlood.isPending}
            className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-70"
          >
            REQUEST 2 UNITS O-
          </button>
        </div>

        {/* Doctor Status */}
        <div className="glass-panel p-6 border-l-4 border-blue-500 flex flex-col justify-between shadow-md shadow-blue-500/5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trauma Team</h2>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                <Stethoscope className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Bypass triage and instantly assign the next available trauma specialist.
            </p>
          </div>
          <button 
            onClick={() => assignDoctor.mutate()} disabled={assignDoctor.isPending}
            className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70"
          >
            ASSIGN EMERGENCY DR
          </button>
        </div>
      </div>

      {/* Critical Queue & Active Patients */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Emergency Queue</h2>
        </div>
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4">Time Triggered</th>
                <th className="p-4">Patient / Location</th>
                <th className="p-4">Dispatch Status</th>
                <th className="p-4">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {queue.length > 0 ? (
                <AnimatePresence>
                  {queue.map((req) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      key={req.id} 
                      className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <td className="p-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                        {format(new Date(req.createdAt), 'HH:mm:ss')}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {req.patient ? `${req.patient.user.firstName} ${req.patient.user.lastName}` : 'Unidentified Critical Patient'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPinIcon className="w-3 h-3" /> {req.pickupAddress}
                        </div>
                      </td>
                      <td className="p-4"><StatusBadge status={req.status} /></td>
                      <td className="p-4"><Badge variant={req.priority === 'CRITICAL' ? 'destructive' : 'warning'}>{req.priority}</Badge></td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                <tr>
                  <td colSpan="4" className="p-8">
                    <EmptyState title="No active emergencies" message="The emergency queue is currently clear." icon={HeartIcon} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default EmergencySOS;
