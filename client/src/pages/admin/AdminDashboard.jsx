import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Users, Calendar, TestTube, Package, DollarSign, Plus, Edit2, Trash2, X, Download, Building2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import { useState } from 'react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/95 dark:bg-background/95 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-3 rounded-xl shadow-sm text-xs font-sans text-left">
        {label && <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>}
        {payload.map((item, idx) => {
          const isRevenue = item.name.toLowerCase().includes('revenue');
          return (
            <p key={idx} className="font-medium flex items-center gap-1.5" style={{ color: item.color || '#84A98C' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color || '#84A98C' }} />
              <span className="capitalize text-gray-500 dark:text-gray-400">{item.name}</span>: 
              <span className="font-bold text-gray-900 dark:text-white">{isRevenue ? `₹${Number(item.value).toFixed(2)}` : item.value}</span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const fetchDashboardMetrics = async () => {
  const { data } = await api.get('/dashboard/metrics');
  return data.data;
};

const fetchStaff = async () => {
  const { data } = await api.get('/users', { params: { limit: 10 } });
  return data.data;
};

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [currentDept, setCurrentDept] = useState({ id: null, name: '', headName: '', description: '' });
  const [newStaff, setNewStaff] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'DOCTOR', phone: '', profileImage: null });
  const [deleteStaffId, setDeleteStaffId] = useState(null);
  const [deleteDeptId, setDeleteDeptId] = useState(null);

  // Mock State for settings
  const [settings, setSettings] = useState({
    hospitalName: 'MediCore Smart Hospital',
    email: 'contact@medicore.com',
    emergencyPhone: '+1-800-MED-911',
    maxAppointments: '20'
  });

  const { data: metrics, isLoading: loadingMetrics, isError } = useQuery({
    queryKey: ['adminMetrics'],
    queryFn: fetchDashboardMetrics
  });

  const { data: staffList, isLoading: loadingStaff } = useQuery({
    queryKey: ['adminStaff'],
    queryFn: fetchStaff
  });

  const { data: departments, isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data.data;
    }
  });

  const addDeptMutation = useMutation({
    mutationFn: (newDept) => api.post('/departments', newDept),
    onSuccess: () => queryClient.invalidateQueries(['departments'])
  });

  const editDeptMutation = useMutation({
    mutationFn: (data) => api.put(`/departments/${data.id}`, { name: data.name, headName: data.headName }),
    onSuccess: () => queryClient.invalidateQueries(['departments'])
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id) => api.delete(`/departments/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['departments'])
  });

  const addStaffMutation = useMutation({
    mutationFn: (formData) => api.post('/users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminStaff']);
      setIsAddModalOpen(false);
      setNewStaff({ firstName: '', lastName: '', email: '', password: '', role: 'DOCTOR', phone: '', profileImage: null });
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminStaff']);
    }
  });

  const handleAddStaff = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('firstName', newStaff.firstName);
    formData.append('lastName', newStaff.lastName);
    formData.append('email', newStaff.email);
    formData.append('password', newStaff.password);
    formData.append('role', newStaff.role);
    if (newStaff.phone) formData.append('phone', newStaff.phone);
    if (newStaff.profileImage) formData.append('profileImage', newStaff.profileImage);
    
    addStaffMutation.mutate(formData);
  };

  const handleDeleteStaff = (id) => {
    setDeleteStaffId(id);
  };

  const exportStaffToCSV = () => {
    if (!staffList || staffList.length === 0) return;
    const headers = ['First Name', 'Last Name', 'Role', 'Email', 'Phone', 'Joined Date'];
    const rows = staffList.filter(u => u.role !== 'PATIENT').map(u => [
      u.firstName, u.lastName, u.role, u.email, u.phone || 'N/A', new Date(u.createdAt).toLocaleDateString()
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "medicore_staff_directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingMetrics) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[1,2,3,4].map(i => (
        <Card key={i} className="h-32 bg-gray-50 border-gray-100" />
      ))}
    </div>;
  }

  if (isError) {
    return <div className="p-4 bg-error/10 text-error rounded-xl">Failed to load metrics.</div>;
  }

  const statCards = [
    { title: 'Total Patients', value: metrics.totalPatients, icon: <Users size={24} />, color: 'text-info', bg: 'bg-info/10' },
    { title: "Today's Appointments", value: metrics.todaysAppointments, icon: <Calendar size={24} />, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Pending Lab Reports', value: metrics.pendingLabReports, icon: <TestTube size={24} />, color: 'text-warning', bg: 'bg-warning/10' },
    { title: 'Low Stock Medicines', value: metrics.lowStockMedicines, icon: <Package size={24} />, color: 'text-error', bg: 'bg-error/10' },
    { title: 'Total Revenue', value: `₹${metrics.totalRevenue.toFixed(2)}`, icon: <DollarSign size={24} />, color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-secondary mb-2">Hospital Administration</h1>
        <p className="text-gray-500">Welcome to the central command dashboard.</p>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview & Staff', icon: <Users size={16} /> },
          { id: 'departments', label: 'Departments', icon: <Building2 size={16} /> },
          { id: 'settings', label: 'Hospital Settings', icon: <Settings size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 mt-8">
        <Card className="bg-surface border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Revenue Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metrics?.revenueTrends || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84A98C" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#84A98C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#84A98C" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="bg-surface border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Doctor Performance (Patients Treated)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={metrics?.doctorPerformance || []}
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" className="dark:stroke-gray-800" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="patients" fill="#0F766E" radius={[0, 6, 6, 0]} barSize={16} name="Patients Treated" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Medical Record Types</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={metrics?.mostCommonDiseases || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {['#84A98C', '#0F766E', '#5BC0BE', '#F59E0B'].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Elegant Custom Legend instead of standard raw list */}
            <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-gray-500 mt-2">
              {(metrics?.mostCommonDiseases || []).map((item, index) => {
                const colors = ['#84A98C', '#0F766E', '#5BC0BE', '#F59E0B'];
                return (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="dark:text-gray-300">{item.name} ({item.value})</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Staff Directory</CardTitle>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={exportStaffToCSV}>
                <Download size={16} className="mr-2" />
                Export CSV
              </Button>
              <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                Add Staff
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStaff ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg"></div>)}
              </div>
            ) : staffList?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.filter(u => u.role !== 'PATIENT').map((staff) => (
                      <tr key={staff.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{staff.firstName} {staff.lastName}</td>
                        <td className="px-4 py-3">
                          <Badge variant={staff.role === 'ADMIN' ? 'primary' : 'default'}>{staff.role}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{staff.email}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(staff.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:bg-primary/10"><Edit2 size={16}/></Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-error hover:bg-error/10"
                              onClick={() => handleDeleteStaff(staff.id)}
                            >
                              <Trash2 size={16}/>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">No staff found.</div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
      )}

      {activeTab === 'departments' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage Departments</CardTitle>
              <Button size="sm" onClick={() => {
                setCurrentDept({ id: null, name: '', headName: 'Unassigned', description: '' });
                setIsDeptModalOpen(true);
              }}>
                <Plus size={16} className="mr-2" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent>
              {loadingDepartments ? (
                 <div className="text-center py-4 text-gray-500">Loading departments...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments?.map(dept => (
                    <div key={dept.id} className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                        <Badge variant="outline">{dept.count || 0} Staff</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Head: <span className="font-medium">{dept.head || 'Unassigned'}</span></p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            setCurrentDept({ id: dept.id, name: dept.name, headName: dept.head || 'Unassigned', description: dept.description || '' });
                            setIsDeptModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-error border-error/20 hover:bg-error/5" 
                          disabled={deleteDeptMutation.isPending}
                          onClick={() => {
                            setDeleteDeptId(dept.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Global Hospital Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); toast.success('Settings successfully updated across the platform!'); }}>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Hospital Name</label>
                  <input type="text" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" value={settings.hospitalName} onChange={e => setSettings({...settings, hospitalName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Support Email</label>
                    <input type="email" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Emergency Hotline</label>
                    <input type="text" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" value={settings.emergencyPhone} onChange={e => setSettings({...settings, emergencyPhone: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Max Daily Appointments (Per Doctor)</label>
                  <input type="number" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" value={settings.maxAppointments} onChange={e => setSettings({...settings, maxAppointments: e.target.value})} />
                </div>
                <div className="pt-4 flex justify-end border-t border-gray-100 mt-6">
                  <Button type="submit">Save Global Settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle>Add New Staff</CardTitle>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">First Name</label>
                    <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newStaff.firstName} onChange={e => setNewStaff({...newStaff, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Last Name</label>
                    <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newStaff.lastName} onChange={e => setNewStaff({...newStaff, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Email Address</label>
                  <input required type="email" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Temporary Password</label>
                  <input required type="password" minLength="6" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Role</label>
                    <select className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-surface" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                      <option value="DOCTOR">Doctor</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                      <option value="PHARMACIST">Pharmacist</option>
                      <option value="LAB_STAFF">Lab Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Phone</label>
                    <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Profile Avatar (Optional)</label>
                  <input type="file" accept="image/*" className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-surface file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" onChange={e => setNewStaff({...newStaff, profileImage: e.target.files[0]})} />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addStaffMutation.isPending}>
                    {addStaffMutation.isPending ? 'Saving...' : 'Save Staff'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle>{currentDept.id ? 'Edit Department' : 'Add Department'}</CardTitle>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                if (currentDept.id) {
                  editDeptMutation.mutate(currentDept, {
                    onSuccess: () => setIsDeptModalOpen(false)
                  });
                } else {
                  addDeptMutation.mutate(currentDept, {
                    onSuccess: () => setIsDeptModalOpen(false)
                  });
                }
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Department Name</label>
                  <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={currentDept.name} onChange={e => setCurrentDept({...currentDept, name: e.target.value})} placeholder="e.g. Cardiology" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Head of Department (Doctor Name)</label>
                  <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={currentDept.headName} onChange={e => setCurrentDept({...currentDept, headName: e.target.value})} placeholder="e.g. Dr. John Doe" />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addDeptMutation.isPending || editDeptMutation.isPending}>
                    {addDeptMutation.isPending || editDeptMutation.isPending ? 'Saving...' : 'Save Department'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {deleteStaffId && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-error/20">
            <CardHeader className="border-b border-gray-100 pb-4 bg-error/5">
              <CardTitle className="text-error flex items-center gap-2">Confirm Deletion</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to permanently delete this staff member? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteStaffId(null)}>Cancel</Button>
                <Button 
                  className="bg-error hover:bg-error/90 text-white"
                  disabled={deleteStaffMutation.isPending}
                  onClick={() => {
                    deleteStaffMutation.mutate(deleteStaffId, {
                      onSuccess: () => setDeleteStaffId(null)
                    });
                  }}
                >
                  {deleteStaffMutation.isPending ? 'Deleting...' : 'Delete Staff'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Department Confirmation Modal */}
      {deleteDeptId && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-error/20">
            <CardHeader className="border-b border-gray-100 pb-4 bg-error/5">
              <CardTitle className="text-error flex items-center gap-2">Confirm Deletion</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to permanently delete this department?</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteDeptId(null)}>Cancel</Button>
                <Button 
                  className="bg-error hover:bg-error/90 text-white"
                  disabled={deleteDeptMutation.isPending}
                  onClick={() => {
                    deleteDeptMutation.mutate(deleteDeptId, {
                      onSuccess: () => setDeleteDeptId(null)
                    });
                  }}
                >
                  {deleteDeptMutation.isPending ? 'Deleting...' : 'Delete Department'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
