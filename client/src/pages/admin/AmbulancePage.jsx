import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { Truck as TruckIcon, MapPin as MapPinIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const AmbulancePage = () => {
  const queryClient = useQueryClient();

  const { data: ambulancesData, isLoading: loadingAmbs } = useQuery({
    queryKey: ['ambulances'],
    queryFn: async () => {
      const res = await api.get('/ambulance');
      return res.data;
    },
    refetchInterval: 8000 // Poll every 8s
  });

  const { data: requestsData, isLoading: loadingReqs } = useQuery({
    queryKey: ['ambulance-requests'],
    queryFn: async () => {
      const res = await api.get('/ambulance/requests');
      return res.data;
    },
    refetchInterval: 8000
  });

  const updateRequestStatus = useMutation({
    mutationFn: async ({ id, status, ambulanceId }) => {
      const res = await api.patch(`/ambulance/requests/${id}`, { status, ambulanceId });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Ambulance status updated');
      queryClient.invalidateQueries(['ambulances']);
      queryClient.invalidateQueries(['ambulance-requests']);
    }
  });

  if (loadingAmbs || loadingReqs) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="card" count={2} />
      </div>
    );
  }

  const ambulances = ambulancesData?.data || [];
  const requests = requestsData?.data || [];

  const activeRequests = requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');
  const pastRequests = requests.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const steps = ['REQUESTED', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ambulance Dispatch</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Live tracking and dispatch management (Simulated).</p>
      </div>

      {/* Fleet Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Fleet Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ambulances.map(amb => (
            <div key={amb.id} className="glass-panel p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full ${amb.status === 'AVAILABLE' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                <TruckIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{amb.vehicleNumber}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{amb.driverName} • {amb.driverPhone}</p>
                <div className="mt-1">
                  <StatusBadge status={amb.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Dispatches */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Active Dispatches</h2>
        {activeRequests.length === 0 ? (
          <EmptyState title="No Active Dispatches" message="There are no ongoing ambulance requests at the moment." icon={TruckIcon} />
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {activeRequests.map(req => (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel p-6"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg text-gray-900 dark:text-white">
                          {req.patient ? `${req.patient.user.firstName} ${req.patient.user.lastName}` : 'Unknown Patient'}
                        </span>
                        <StatusBadge status={req.priority} type="priority" />
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {req.pickupAddress}
                      </div>
                    </div>
                    
                    {/* Action buttons based on status */}
                    <div className="flex gap-2">
                      {req.status === 'REQUESTED' && (
                        <select 
                          className="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          onChange={(e) => {
                            if (e.target.value) {
                              updateRequestStatus.mutate({ id: req.id, status: 'DISPATCHED', ambulanceId: e.target.value });
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Dispatch Ambulance...</option>
                          {ambulances.filter(a => a.status === 'AVAILABLE').map(a => (
                            <option key={a.id} value={a.id}>{a.vehicleNumber} ({a.driverName})</option>
                          ))}
                        </select>
                      )}
                      {req.status === 'DISPATCHED' && (
                        <button onClick={() => updateRequestStatus.mutate({ id: req.id, status: 'EN_ROUTE', ambulanceId: req.ambulanceId })} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Mark En Route</button>
                      )}
                      {req.status === 'EN_ROUTE' && (
                        <button onClick={() => updateRequestStatus.mutate({ id: req.id, status: 'ARRIVED', ambulanceId: req.ambulanceId })} className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">Mark Arrived</button>
                      )}
                      {req.status === 'ARRIVED' && (
                        <button onClick={() => updateRequestStatus.mutate({ id: req.id, status: 'COMPLETED', ambulanceId: req.ambulanceId })} className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">Complete & Free Vehicle</button>
                      )}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="relative pt-2">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                      {steps.map((step, idx) => {
                        const currentIdx = steps.indexOf(req.status);
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <div
                            key={step}
                            style={{ width: '25%' }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                              isCompleted ? 'bg-primary dark:bg-secondary' : 'bg-transparent'
                            } ${isCurrent ? 'animate-pulse' : ''}`}
                          ></div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <span>Requested</span>
                      <span>Dispatched</span>
                      <span>En Route</span>
                      <span>Arrived</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AmbulancePage;
