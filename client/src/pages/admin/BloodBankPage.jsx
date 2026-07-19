import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FlaskConical as BeakerIcon, AlertTriangle as ExclamationTriangleIcon, Plus, X, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

// Modals
const RegisterDonorModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: '', bloodGroup: 'A_POS', phone: '', email: '', lastDonationDate: '' });

  const registerMutation = useMutation({
    mutationFn: async (data) => (await api.post('/blood-bank/donors', data)).data,
    onSuccess: () => {
      toast.success('Donor registered successfully');
      queryClient.invalidateQueries(['blood-donors']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to register donor')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate({ ...formData, lastDonationDate: formData.lastDonationDate || null });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Register Donor</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input required type="text" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
              <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                {['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].map(bg => (
                  <option key={bg} value={bg}>{bg.replace('_POS', '+').replace('_NEG', '-')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input required type="tel" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Donation Date (Optional)</label>
              <input type="date" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.lastDonationDate} onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })} />
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={registerMutation.isPending}>{registerMutation.isPending ? 'Saving...' : 'Register'}</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const CreateRequestModal = ({ isOpen, onClose, patients }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ patientId: '', bloodGroup: 'A_POS', units: 1, urgency: 'ROUTINE', department: '' });

  const requestMutation = useMutation({
    mutationFn: async (data) => (await api.post('/blood-bank/requests', data)).data,
    onSuccess: () => {
      toast.success('Blood request submitted');
      queryClient.invalidateQueries(['blood-requests']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to submit request')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId) return toast.error("Please select a patient");
    requestMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">New Blood Request</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient</label>
              <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} required>
                <option value="">-- Select Patient --</option>
                {patients?.map(p => <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                  {['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].map(bg => (
                    <option key={bg} value={bg}>{bg.replace('_POS', '+').replace('_NEG', '-')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Units Needed</label>
                <input required type="number" min="1" max="10" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.units} onChange={(e) => setFormData({ ...formData, units: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urgency</label>
              <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.urgency} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={requestMutation.isPending}>{requestMutation.isPending ? 'Submitting...' : 'Submit Request'}</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const BloodBankPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('inventory');

  const [isRegisterDonorOpen, setIsRegisterDonorOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);

  const { data: inventoryData, isLoading: loadingInv } = useQuery({
    queryKey: ['blood-inventory'],
    queryFn: async () => (await api.get('/blood-bank/inventory')).data
  });

  const { data: donorsData, isLoading: loadingDonors } = useQuery({
    queryKey: ['blood-donors'],
    queryFn: async () => (await api.get('/blood-bank/donors')).data,
    enabled: activeTab === 'donors'
  });

  const { data: requestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ['blood-requests'],
    queryFn: async () => (await api.get('/blood-bank/requests')).data,
    enabled: activeTab === 'requests'
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => (await api.get('/patients')).data,
    enabled: activeTab === 'requests'
  });

  const updateRequestStatus = useMutation({
    mutationFn: async ({ id, status }) => (await api.patch(`/blood-bank/requests/${id}`, { status })).data,
    onSuccess: () => {
      toast.success('Request status updated');
      queryClient.invalidateQueries(['blood-requests']);
      queryClient.invalidateQueries(['blood-inventory']); // May have consumed units
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update request')
  });

  if (loadingInv) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="card" count={8} className="grid grid-cols-2 md:grid-cols-4 gap-4" />
      </div>
    );
  }

  const inventory = inventoryData?.data || [];
  const donors = donorsData?.data || [];
  const requests = requestsData?.data || [];
  const patients = patientsData?.data || [];

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'CRITICAL': return <Badge variant="destructive">CRITICAL</Badge>;
      case 'URGENT': return <Badge variant="warning">URGENT</Badge>;
      default: return <Badge variant="outline">ROUTINE</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning">PENDING</Badge>;
      case 'APPROVED': return <Badge variant="success">APPROVED</Badge>;
      case 'FULFILLED': return <Badge variant="primary">FULFILLED</Badge>;
      case 'REJECTED': return <Badge variant="destructive">REJECTED</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blood Bank</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor blood stock levels, manage donors, and handle blood requests.</p>
        </div>

        <div className="flex gap-3">
          {(user.role === 'ADMIN' || user.role === 'LAB_STAFF') && (
            <Button onClick={() => setIsRegisterDonorOpen(true)} variant="outline" className="bg-white dark:bg-surface">
              <Plus className="w-4 h-4 mr-1" /> Register Donor
            </Button>
          )}
          {(user.role === 'ADMIN' || user.role === 'DOCTOR' || user.role === 'RECEPTIONIST') && (
            <Button onClick={() => setIsCreateRequestOpen(true)} className="bg-primary hover:bg-primary-dark">
              <Plus className="w-4 h-4 mr-1" /> Request Blood
            </Button>
          )}
        </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-800 pb-px">
        {['inventory', 'donors', 'requests'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors ${activeTab === tab
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {inventory.map((group) => (
            <motion.div
              key={group.bloodGroup}
              whileHover={{ scale: 1.02 }}
              className={`glass-panel p-6 border-l-4 ${group.totalUnits === 0
                  ? 'border-red-500'
                  : group.totalUnits < 5
                    ? 'border-yellow-500'
                    : 'border-green-500'
                }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {group.bloodGroup.replace('_POS', '+').replace('_NEG', '-')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Blood Group</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                  <BeakerIcon className="w-6 h-6 text-red-500" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-black text-gray-900 dark:text-white">{group.totalUnits}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">Units</span>
              </div>

              {(group.expiringSoon > 0 || group.expired > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 space-y-1">
                  {group.expiringSoon > 0 && (
                    <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                      <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                      {group.expiringSoon} units expiring in &lt; 7 days
                    </div>
                  )}
                  {group.expired > 0 && (
                    <div className="flex items-center text-xs text-red-600 dark:text-red-400 font-medium">
                      <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                      {group.expired} units expired
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          {inventory.length === 0 && (
            <div className="col-span-full">
              <EmptyState title="No Inventory Data" message="The blood bank database is currently empty." icon={BeakerIcon} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'donors' && (
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4">Donor Name</th>
                <th className="p-4">Blood Group</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Eligibility</th>
                <th className="p-4">Last Donation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loadingDonors ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">Loading...</td></tr>
              ) : donors.length > 0 ? (
                donors.map(donor => (
                  <tr key={donor.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{donor.name}</td>
                    <td className="p-4"><Badge variant="outline">{donor.bloodGroup.replace('_POS', '+').replace('_NEG', '-')}</Badge></td>
                    <td className="p-4 text-gray-500">{donor.phone}</td>
                    <td className="p-4">
                      {donor.isEligible ? (
                        <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Eligible</span>
                      ) : (
                        <span className="text-red-600 font-medium flex items-center gap-1"><XCircle className="w-4 h-4" /> Cooldown</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500">{donor.lastDonationDate ? format(new Date(donor.lastDonationDate), 'MMM dd, yyyy') : 'Never'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-8"><EmptyState title="No donors found" message="No blood donors registered." icon={BeakerIcon} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">Blood Needed</th>
                <th className="p-4">Urgency</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loadingRequests ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">Loading...</td></tr>
              ) : requests.length > 0 ? (
                requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                      {req.patient?.user?.firstName} {req.patient?.user?.lastName}
                      <div className="text-xs text-gray-500 font-normal">{req.department}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{req.bloodGroup.replace('_POS', '+').replace('_NEG', '-')}</Badge>
                        <span className="font-semibold">{req.units} Units</span>
                      </div>
                    </td>
                    <td className="p-4">{getUrgencyBadge(req.urgency)}</td>
                    <td className="p-4">{getStatusBadge(req.status)}</td>
                    <td className="p-4 text-right">
                      {(user.role === 'ADMIN' || user.role === 'LAB_STAFF') && req.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateRequestStatus.mutate({ id: req.id, status: 'REJECTED' })} className="text-red-600 hover:bg-red-50 border-red-200">
                            Reject
                          </Button>
                          <Button size="sm" onClick={() => updateRequestStatus.mutate({ id: req.id, status: 'APPROVED' })} className="bg-green-600 hover:bg-green-700 text-white">
                            Approve
                          </Button>
                        </div>
                      )}
                      {(user.role === 'ADMIN' || user.role === 'LAB_STAFF') && req.status === 'APPROVED' && (
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => updateRequestStatus.mutate({ id: req.id, status: 'FULFILLED' })} className="bg-primary hover:bg-primary-dark">
                            Mark Fulfilled
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-8"><EmptyState title="No requests found" message="No blood requests active." icon={BeakerIcon} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <RegisterDonorModal isOpen={isRegisterDonorOpen} onClose={() => setIsRegisterDonorOpen(false)} />
      <CreateRequestModal isOpen={isCreateRequestOpen} onClose={() => setIsCreateRequestOpen(false)} patients={patients} />

    </motion.div>
  );
};

export default BloodBankPage;
