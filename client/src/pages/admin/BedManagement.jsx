import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { FlaskConical as BeakerIcon, Home as HomeIcon, AlertTriangle as ExclamationTriangleIcon, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const AssignBedModal = ({ isOpen, onClose, bed, patients }) => {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');

  const assignMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch(`/beds/${bed.id}/assign`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Bed assigned successfully');
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['wards']);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to assign bed');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId) return toast.error('Please select a patient');
    assignMutation.mutate({ patientId, notes });
  };

  if (!isOpen || !bed) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Assign Bed {bed.bedNumber}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Patient</label>
              <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
                <option value="">-- Select Patient --</option>
                {patients?.map(p => (
                  <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName} ({p.user.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignment Notes</label>
              <textarea className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="Optional admission notes..."></textarea>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={assignMutation.isPending}>{assignMutation.isPending ? 'Assigning...' : 'Assign Bed'}</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const CreateBedModal = ({ isOpen, onClose, wards }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ wardId: '', bedNumber: '', type: 'GENERAL' });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/beds`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Bed created successfully');
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['wards']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to create bed')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add New Bed</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ward</label>
              <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.wardId} onChange={(e) => setFormData({ ...formData, wardId: e.target.value })} required>
                <option value="">-- Select Ward --</option>
                {wards?.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bed Number (e.g., G10)</label>
              <input required type="text" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.bedNumber} onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bed Type</label>
              <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="GENERAL">General</option>
                <option value="ICU">ICU</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create Bed'}</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const BedManagement = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [assignModalBed, setAssignModalBed] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: wardsData, isLoading: loadingWards } = useQuery({
    queryKey: ['wards'],
    queryFn: async () => (await api.get('/beds/wards')).data,
    refetchInterval: 10000
  });

  const { data: bedsData, isLoading: loadingBeds } = useQuery({
    queryKey: ['beds'],
    queryFn: async () => (await api.get('/beds')).data,
    refetchInterval: 10000
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => (await api.get('/patients')).data,
    enabled: activeTab === 'all-beds' // Only fetch when needed
  });

  const releaseBed = useMutation({
    mutationFn: async (bedId) => (await api.patch(`/beds/${bedId}/release`)).data,
    onSuccess: () => {
      toast.success('Bed released for cleaning');
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['wards']);
    }
  });

  const markAvailable = useMutation({
    mutationFn: async (bedId) => (await api.patch(`/beds/${bedId}/status`, { status: 'AVAILABLE' })).data,
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
  const patients = patientsData?.data || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ward & Bed Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time occupancy monitoring and bed allocation.</p>
        </div>
        {user.role === 'ADMIN' && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary-dark">
            <Plus className="w-4 h-4 mr-1" /> Add Bed
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button onClick={() => setActiveTab('overview')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-primary text-primary dark:border-secondary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}>
          Ward Overview
        </button>
        <button onClick={() => setActiveTab('all-beds')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all-beds' ? 'border-primary text-primary dark:border-secondary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}>
          All Beds List
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wards.map(ward => (
            <motion.div key={ward.id} whileHover={{ y: -2 }} className="glass-panel p-6 border-l-4 border-primary">
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
                  <span className="font-medium text-green-600 font-bold">{ward.available}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-600 dark:text-blue-400">Occupied</span>
                  <span className="font-medium text-blue-600 font-bold">{ward.occupied}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-yellow-600 dark:text-yellow-400">Cleaning/Reserved</span>
                  <span className="font-medium text-yellow-600 font-bold">{ward.cleaning + ward.reserved}</span>
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
                          {bed.status === 'AVAILABLE' && (
                            <Button size="sm" onClick={() => setAssignModalBed(bed)} className="bg-primary text-white">
                              Assign
                            </Button>
                          )}
                          {bed.status === 'OCCUPIED' && (
                            <Button size="sm" variant="outline" onClick={() => releaseBed.mutate(bed.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">
                              Discharge
                            </Button>
                          )}
                          {bed.status === 'CLEANING' && (
                            <Button size="sm" variant="outline" onClick={() => markAvailable.mutate(bed.id)} className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200">
                              Mark Clean
                            </Button>
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

      {/* Modals */}
      <AssignBedModal isOpen={!!assignModalBed} onClose={() => setAssignModalBed(null)} bed={assignModalBed} patients={patients} />
      <CreateBedModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} wards={wards} />

    </motion.div>
  );
};

export default BedManagement;
