import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Users, CalendarPlus, Search, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { format } from 'date-fns';
import { useState } from 'react';

const fetchUpcomingAppointments = async () => {
  const { data } = await api.get('/appointments', {
    params: { date: new Date().toISOString(), limit: 10 }
  });
  return data.data;
};

const ReceptionistDashboard = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', dob: '', gender: '', bloodGroup: '', emergencyContact: ''
  });
  const [newAppointment, setNewAppointment] = useState({ patientId: '', doctorId: '', date: '', time: '', reason: '' });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['receptionAppointments', 'today'],
    queryFn: fetchUpcomingAppointments
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctorsList'],
    queryFn: async () => {
      const { data } = await api.get('/public/doctors');
      return data.data;
    },
    enabled: isBookModalOpen
  });

  const { data: patients } = useQuery({
    queryKey: ['patientsList'],
    queryFn: async () => {
      const { data } = await api.get('/users?role=PATIENT&limit=100');
      return data.data;
    },
    enabled: isBookModalOpen
  });

  const registerMutation = useMutation({
    mutationFn: (data) => api.post('/patients', data),
    onSuccess: () => {
      setIsRegisterOpen(false);
      setNewPatient({ firstName: '', lastName: '', email: '', phone: '', password: '', dob: '', gender: '', bloodGroup: '', emergencyContact: '' });
      toast.success("Walk-in Patient registered successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to register patient.");
    }
  });

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate(newPatient);
  };

  const bookAppointmentMutation = useMutation({
    mutationFn: (apptData) => {
      const start = new Date(`${apptData.date}T${apptData.time}`);
      const end = new Date(start.getTime() + 30 * 60000);

      return api.post('/appointments', {
        patientId: apptData.patientId,
        doctorId: apptData.doctorId,
        date: apptData.date,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        reason: apptData.reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['receptionAppointments']);
      setIsBookModalOpen(false);
      setNewAppointment({ patientId: '', doctorId: '', date: '', time: '', reason: '' });
      toast.success("Appointment booked successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to book appointment.");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/appointments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['receptionAppointments']);
    }
  });

  const handlePrintID = (patient) => {
    // In a real app, this would open a new window and trigger window.print()
    toast.success(`Printing ID Card for ${patient.user.firstName} ${patient.user.lastName}...`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary mb-2">Front Desk</h1>
          <p className="text-gray-500">Manage patients and daily schedules.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="bg-surface border-gray-200 dark:border-gray-800" onClick={() => setIsRegisterOpen(true)}>
            <Users size={18} className="mr-2 text-primary" />
            New Patient
          </Button>
          <Button onClick={() => setIsBookModalOpen(true)}>
            <CalendarPlus size={18} className="mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-4 sm:p-6">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-primary/60" size={20} />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-4 border-none rounded-xl bg-surface shadow-sm focus:ring-2 focus:ring-primary/50 text-lg text-text-primary"
              placeholder="Search patients by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
              <Button size="sm">Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Queue</CardTitle>
            <Badge variant="info">{appointments?.length || 0} Expected</Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg" />)}
              </div>
            ) : appointments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Time</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          {format(new Date(apt.startTime), 'h:mm a')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{apt.patient.user.firstName} {apt.patient.user.lastName}</div>
                          <div className="text-xs text-gray-500">{apt.patient.user.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">Dr. {apt.doctor.user.lastName}</td>
                        <td className="px-4 py-3">
                          <Badge variant={apt.status === 'CONFIRMED' ? 'success' : apt.status === 'PENDING' ? 'warning' : 'default'}>
                            {apt.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handlePrintID(apt.patient)}>Print ID</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-primary ${apt.status !== 'PENDING' ? 'opacity-50 pointer-events-none' : ''}`}
                            disabled={apt.status !== 'PENDING' || updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'CONFIRMED' })}
                          >
                            {apt.status === 'CONFIRMED' ? 'Checked In' : apt.status === 'COMPLETED' ? 'Done' : 'Check-in'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No upcoming appointments today.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock size={18} className="text-warning" />
                Pending Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-400 py-6 text-sm">
                All caught up!
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Patient Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle>Register Walk-In Patient</CardTitle>
              <button onClick={() => setIsRegisterOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">First Name</label>
                    <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newPatient.firstName} onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Last Name</label>
                    <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newPatient.lastName} onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Email (for Portal Access)</label>
                    <input required type="email" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Temporary Password</label>
                    <input required type="password" minLength="6" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newPatient.password} onChange={e => setNewPatient({ ...newPatient, password: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Phone</label>
                    <input required type="tel" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Emergency Contact</label>
                    <input required type="tel" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newPatient.emergencyContact} onChange={e => setNewPatient({ ...newPatient, emergencyContact: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Date of Birth</label>
                    <input required type="date" max={new Date().toISOString().split('T')[0]} className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newPatient.dob} onChange={e => setNewPatient({ ...newPatient, dob: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase">Gender</label>
                      <select required className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-surface" value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase">Blood Group</label>
                      <select required className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-surface" value={newPatient.bloodGroup} onChange={e => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}>
                        <option value="">Select</option>
                        <option value="O_POS">O+</option>
                        <option value="O_NEG">O-</option>
                        <option value="A_POS">A+</option>
                        <option value="A_NEG">A-</option>
                        <option value="B_POS">B+</option>
                        <option value="B_NEG">B-</option>
                        <option value="AB_POS">AB+</option>
                        <option value="AB_NEG">AB-</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? 'Registering...' : 'Register Patient'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle>Book New Appointment</CardTitle>
              <button onClick={() => setIsBookModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={e => { e.preventDefault(); bookAppointmentMutation.mutate(newAppointment); }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Select Patient</label>
                  <select required className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-surface" value={newAppointment.patientId} onChange={e => setNewAppointment({ ...newAppointment, patientId: e.target.value })}>
                    <option value="">-- Choose a Patient --</option>
                    {patients?.map(p => (
                      <option key={p.id} value={p.patientProfile?.id || p.id}>
                        {p.firstName} {p.lastName} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Select Doctor</label>
                  <select required className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-surface" value={newAppointment.doctorId} onChange={e => setNewAppointment({ ...newAppointment, doctorId: e.target.value })}>
                    <option value="">-- Choose a Doctor --</option>
                    {doctors?.map(doc => (
                      <option key={doc.id} value={doc.doctorProfile?.id || doc.id}>
                        Dr. {doc.firstName} {doc.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Date</label>
                    <input required type="date" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newAppointment.date} onChange={e => setNewAppointment({ ...newAppointment, date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Time</label>
                    <input required type="time" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newAppointment.time} onChange={e => setNewAppointment({ ...newAppointment, time: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Reason for Visit</label>
                  <textarea required className="w-full p-2 border border-gray-200 rounded-lg text-sm h-20" placeholder="Briefly describe the symptoms..." value={newAppointment.reason} onChange={e => setNewAppointment({ ...newAppointment, reason: e.target.value })}></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsBookModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={bookAppointmentMutation.isPending}>
                    {bookAppointmentMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
