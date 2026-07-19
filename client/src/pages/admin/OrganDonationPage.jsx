import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Activity as HeartIcon, CheckCircle, XCircle, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

const MatchTimeline = ({ status }) => {
  const steps = ['PENDING', 'APPROVED', 'COMPLETED'];
  const rejected = status === 'REJECTED';
  const currentIndex = rejected ? 0 : steps.indexOf(status);

  return (
    <div className="w-full pt-4 pb-8 px-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 z-0 rounded-full"></div>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary z-0 rounded-full transition-all duration-500" 
             style={{ width: rejected ? '0%' : `${(currentIndex / (steps.length - 1)) * 100}%` }}></div>
             
        {steps.map((step, idx) => {
          const isCompleted = currentIndex >= idx && !rejected;
          const isCurrent = currentIndex === idx && !rejected;
          const isRejected = rejected && idx === 0;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300
                  ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-surface border-gray-300 dark:border-gray-600'}
                  ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                  ${isRejected ? 'bg-red-500 border-red-500 text-white ring-4 ring-red-500/20' : ''}
                `}
              >
                {isCompleted && !isRejected && <CheckCircle className="w-4 h-4" />}
                {isRejected && <XCircle className="w-4 h-4" />}
              </div>
              <span className={`text-xs font-bold mt-2 uppercase tracking-wider absolute top-10 whitespace-nowrap
                ${isCompleted ? 'text-primary' : 'text-gray-400'}
                ${isRejected ? 'text-red-500' : ''}
              `}>
                {rejected && idx === 0 ? 'REJECTED' : step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RegistrationModal = ({ type, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bloodGroup: 'A_POS',
    organ: 'Kidney',
    contactNumber: '',
    urgency: 'NORMAL'
  });

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const endpoint = type === 'donor' ? '/organ-donation/donors' : '/organ-donation/recipients';
      const res = await api.post(endpoint, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`${type === 'donor' ? 'Donor' : 'Recipient'} registered successfully!`);
      queryClient.invalidateQueries([`organ-${type}s`]);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to register');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize">Register New {type}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20}/></button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                <input required type="text" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                <input required type="text" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}>
                  {['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].map(bg => (
                    <option key={bg} value={bg}>{bg.replace('_POS', '+').replace('_NEG', '-')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organ</label>
                <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.organ} onChange={(e) => setFormData({...formData, organ: e.target.value})}>
                  <option value="Kidney">Kidney</option>
                  <option value="Liver">Liver</option>
                  <option value="Heart">Heart</option>
                  <option value="Lungs">Lungs</option>
                  <option value="Pancreas">Pancreas</option>
                  <option value="Corneas">Corneas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
              <input required type="tel" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} />
            </div>

            {type === 'recipient' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urgency</label>
                <select className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.urgency} onChange={(e) => setFormData({...formData, urgency: e.target.value})}>
                  <option value="NORMAL">Normal</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Saving...' : 'Register'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const OrganDonationPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('matches');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('donor');

  const { data: matchesData, isLoading: loadingMatches } = useQuery({ queryKey: ['organ-matches'], queryFn: async () => (await api.get('/organ-donation/matches')).data });
  const { data: donorsData, isLoading: loadingDonors } = useQuery({ queryKey: ['organ-donors'], queryFn: async () => (await api.get('/organ-donation/donors')).data });
  const { data: recipientsData, isLoading: loadingRecipients } = useQuery({ queryKey: ['organ-recipients'], queryFn: async () => (await api.get('/organ-donation/recipients')).data });

  const updateMatchMutation = useMutation({
    mutationFn: async ({ id, status }) => (await api.patch(`/organ-donation/matches/${id}`, { status })).data,
    onSuccess: () => {
      toast.success('Match status updated successfully');
      queryClient.invalidateQueries(['organ-matches']);
      queryClient.invalidateQueries(['organ-donors']);
      queryClient.invalidateQueries(['organ-recipients']);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update match')
  });

  const matches = matchesData?.data || [];
  const donors = donorsData?.data || [];
  const recipients = recipientsData?.data || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'UNDER_REVIEW': return 'info';
      case 'APPROVED': return 'success';
      case 'MATCHED': return 'primary';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HeartIcon className="w-6 h-6 text-primary" />
            Internal Organ Workflow
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage internal hospital donor registrations, recipient requests, and match approvals.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={() => { setModalType('donor'); setIsModalOpen(true); }} variant="outline" className="bg-white dark:bg-surface">
            <Plus className="w-4 h-4 mr-1" /> Register Donor
          </Button>
          <Button onClick={() => { setModalType('recipient'); setIsModalOpen(true); }} className="bg-primary hover:bg-primary-dark">
            <Plus className="w-4 h-4 mr-1" /> Register Recipient
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-800 pb-px">
        {['dashboard', 'matches', 'donors', 'recipients'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors ${
              activeTab === tab 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 border-l-4 border-green-500">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Total Donors</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{donors.length}</p>
          </div>
          <div className="glass-panel p-6 border-l-4 border-blue-500">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Total Recipients</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{recipients.length}</p>
          </div>
          <div className="glass-panel p-6 border-l-4 border-primary">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Active Matches</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{matches.filter(m => m.status !== 'COMPLETED' && m.status !== 'REJECTED').length}</p>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4">
          {loadingMatches ? (
            <SkeletonLoader type="card" count={3} />
          ) : matches.length > 0 ? (
            <div className="grid gap-6">
              {matches.map((match) => (
                <div key={match.id} className="glass-panel p-6 flex flex-col gap-8 border-l-4 border-primary">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="p-5 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/30">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Donor</p>
                          <Badge variant="outline" className="bg-white dark:bg-gray-800">{match.donor.bloodGroup.replace('_POS', '+').replace('_NEG', '-')}</Badge>
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {match.donor.firstName} {match.donor.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <HeartIcon className="w-4 h-4 text-green-500" /> Organ: {match.donor.organ}
                        </p>
                      </div>
                      
                      <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Recipient</p>
                          <Badge variant="outline" className="bg-white dark:bg-gray-800">{match.recipient.bloodGroup.replace('_POS', '+').replace('_NEG', '-')}</Badge>
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {match.recipient.firstName} {match.recipient.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <HeartIcon className="w-4 h-4 text-blue-500" /> Organ: {match.recipient.organ}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Timeline */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Case Progression</h5>
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-4">
                      <div className="flex-1 w-full">
                        <MatchTimeline status={match.status} />
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 min-w-[160px] md:pl-6 md:border-l border-gray-100 dark:border-gray-800">
                        {(user.role === 'ADMIN' || user.role === 'LAB_STAFF') && match.status === 'PENDING' && (
                          <>
                            <Button size="sm" className="w-full bg-primary hover:bg-primary-dark" onClick={() => updateMatchMutation.mutate({ id: match.id, status: 'APPROVED' })}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => updateMatchMutation.mutate({ id: match.id, status: 'REJECTED' })}>
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {(user.role === 'ADMIN' || user.role === 'LAB_STAFF') && match.status === 'APPROVED' && (
                          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => updateMatchMutation.mutate({ id: match.id, status: 'COMPLETED' })}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Complete
                          </Button>
                        )}
                        {(match.status === 'COMPLETED' || match.status === 'REJECTED') && (
                          <div className="text-center w-full py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <span className="text-xs font-semibold text-gray-500">CLOSED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No matches found" message="There are currently no organ matches requiring approval." icon={HeartIcon} />
          )}
        </div>
      )}

      {activeTab === 'donors' && (
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4">Donor Name</th>
                <th className="p-4">Organ</th>
                <th className="p-4">Blood Group</th>
                <th className="p-4">Status</th>
                <th className="p-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loadingDonors ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">Loading...</td></tr>
              ) : donors.length > 0 ? (
                donors.map(donor => (
                  <tr key={donor.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {donor.firstName.charAt(0)}{donor.lastName.charAt(0)}
                      </div>
                      {donor.firstName} {donor.lastName}
                    </td>
                    <td className="p-4 font-medium">{donor.organ}</td>
                    <td className="p-4">
                      <Badge variant="outline">{donor.bloodGroup.replace('_POS', '+').replace('_NEG', '-')}</Badge>
                    </td>
                    <td className="p-4"><Badge variant={getStatusColor(donor.status)}>{donor.status}</Badge></td>
                    <td className="p-4 text-gray-500">{format(new Date(donor.createdAt), 'MMM dd, yyyy')}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-8"><EmptyState title="No donors found" message="No internal donors registered yet." icon={HeartIcon} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'recipients' && (
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4">Recipient Name</th>
                <th className="p-4">Organ Required</th>
                <th className="p-4">Blood Group</th>
                <th className="p-4">Urgency</th>
                <th className="p-4">Status</th>
                <th className="p-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loadingRecipients ? (
                <tr><td colSpan="6" className="p-4 text-center text-gray-500">Loading...</td></tr>
              ) : recipients.length > 0 ? (
                recipients.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                        {req.firstName.charAt(0)}{req.lastName.charAt(0)}
                      </div>
                      {req.firstName} {req.lastName}
                    </td>
                    <td className="p-4 font-medium">{req.organ}</td>
                    <td className="p-4">
                      <Badge variant="outline">{req.bloodGroup.replace('_POS', '+').replace('_NEG', '-')}</Badge>
                    </td>
                    <td className="p-4">
                      {req.urgency === 'CRITICAL' ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase tracking-wider">Critical</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded uppercase tracking-wider">Normal</span>
                      )}
                    </td>
                    <td className="p-4"><Badge variant={getStatusColor(req.status)}>{req.status}</Badge></td>
                    <td className="p-4 text-gray-500">{format(new Date(req.createdAt), 'MMM dd, yyyy')}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="p-8"><EmptyState title="No recipients found" message="No internal recipients registered yet." icon={HeartIcon} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Reusable Modal for Registration */}
      <RegistrationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType} 
      />

    </motion.div>
  );
};

export default OrganDonationPage;
