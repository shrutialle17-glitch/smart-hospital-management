import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Calendar as CalendarIcon, Clock, User, FileText, Pill, History, CalendarPlus, X, TestTube, FileBadge, Mic, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

const fetchAppointments = async () => {
  const { data } = await api.get('/appointments', {
    params: { date: new Date().toISOString() } // Today's appointments
  });
  return data.data;
};

const DoctorDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [medicines, setMedicines] = useState([{ medicineId: '', dosage: '', frequency: '', duration: '' }]);
  const [followupDate, setFollowupDate] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');
  const [labTestName, setLabTestName] = useState('');
  const [certDays, setCertDays] = useState(3);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let audioChunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice_note.webm');
        formData.append('consultationId', selectedAppt.id);
        
        setUploadingVoice(true);
        try {
          await api.post('/voice-notes/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast.success("Voice note successfully uploaded to patient record!");
        } catch (error) {
          toast.error("Failed to upload voice note.");
        } finally {
          setUploadingVoice(false);
          stream.getTracks().forEach(t => t.stop());
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied or not available.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const generateCertificate = async () => {
    if (!selectedAppt) return;
    const doc = new jsPDF();
    const patientName = `${selectedAppt.patient.user.firstName} ${selectedAppt.patient.user.lastName}`;
    
    doc.setFontSize(22);
    doc.setTextColor(15, 118, 110);
    doc.text("MEDICAL CERTIFICATE", 105, 30, null, null, "center");
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${format(new Date(), 'MMM dd, yyyy')}`, 150, 45);
    
    doc.text(`To Whom It May Concern,`, 20, 65);
    
    const body = `This is to certify that ${patientName} has been examined by me on ${format(new Date(), 'MMM dd, yyyy')}. It is recommended that they rest for ${certDays} day(s) due to medical reasons starting from today.`;
    const splitBody = doc.splitTextToSize(body, 170);
    doc.text(splitBody, 20, 80);
    
    doc.text(`Doctor: Dr. ${selectedAppt.doctor.user.lastName}`, 20, 140);
    doc.text(`Signature: _______________________`, 20, 160);
    
    doc.save(`${patientName.replace(' ', '_')}_Medical_Certificate.pdf`);
    toast.success('Medical Certificate downloaded successfully');
    
    try {
      const pdfBlob = doc.output('blob');
      const formData = new FormData();
      formData.append('file', pdfBlob, `${patientName.replace(' ', '_')}_Certificate.pdf`);
      formData.append('recordType', 'Medical Certificate');
      formData.append('description', `Medical Certificate recommending ${certDays} days of rest.`);
      formData.append('date', new Date().toISOString());

      await api.post(`/patients/${selectedAppt.patientId}/records`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Certificate saved to patient records.');
    } catch (error) {
      toast.error('Failed to save certificate to patient records.');
    }
  };

  const { data: appointments, isLoading, isError } = useQuery({
    queryKey: ['doctorAppointments', 'today'],
    queryFn: fetchAppointments
  });

  const { data: allMedicines } = useQuery({
    queryKey: ['allMedicines'],
    queryFn: async () => {
      const { data } = await api.get('/pharmacy/medicines', { params: { limit: 100 } });
      return data.data;
    }
  });

  const { data: patientDetails } = useQuery({
    queryKey: ['patientDetails', selectedAppt?.patientId],
    queryFn: async () => {
      if (!selectedAppt?.patientId) return null;
      const { data } = await api.get(`/patients/${selectedAppt.patientId}`);
      return data.data;
    },
    enabled: !!selectedAppt?.patientId
  });

  const completeAppointmentMutation = useMutation({
    mutationFn: async (id) => {
      // 1. Mark appointment as completed
      await api.patch(`/appointments/${id}/status`, { status: 'COMPLETED' });
      
      // 2. Generate the Consultation Bill automatically
      await api.post('/billing', {
        patientId: selectedAppt.patientId,
        items: [{
          description: `Consultation Fee (Dr. ${selectedAppt.doctor.user.lastName})`,
          amount: 500.00,
          quantity: 1,
          type: 'CONSULTATION'
        }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['doctorAppointments']);
      setSelectedAppt(null);
      setIsCompleteModalOpen(false);
      toast.success('Consultation Completed & Bill Generated!');
    }
  });

  const scheduleFollowupMutation = useMutation({
    mutationFn: (data) => api.post('/appointments', data),
    onSuccess: () => {
      toast.success('Follow-up appointment successfully scheduled!');
      setFollowupDate('');
      setFollowupNotes('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to schedule follow-up.");
    }
  });

  const sendLabOrderMutation = useMutation({
    mutationFn: (data) => api.post('/lab/requests', data),
    onSuccess: () => {
      toast.success('Lab test order sent successfully to the Laboratory Department!');
      setLabTestName('');
      setActiveTab('diagnosis');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to order lab test.");
    }
  });

  const generatePrescriptionMutation = useMutation({
    mutationFn: (data) => api.post('/pharmacy/prescriptions', data),
    onSuccess: () => {
      toast.success('Prescription successfully saved and sent to Pharmacy!');
      setSelectedAppt(null);
      setActiveTab('diagnosis');
      setMedicines([{ medicineId: '', dosage: '', duration: '' }]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to generate prescription.");
    }
  });

  const [diagnosisData, setDiagnosisData] = useState({ symptoms: '', diagnosis: '' });

  const saveDiagnosisMutation = useMutation({
    mutationFn: () => api.post(`/patients/${selectedAppt.patientId}/records`, {
      recordType: "Clinical Diagnosis",
      description: `Symptoms: ${diagnosisData.symptoms}\nDiagnosis: ${diagnosisData.diagnosis}`
    }),
    onSuccess: () => {
      toast.success('Diagnosis successfully saved to Patient Medical Records!');
      queryClient.invalidateQueries(['patientDetails', selectedAppt?.patientId]);
      setActiveTab('prescription');
      setDiagnosisData({ symptoms: '', diagnosis: '' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to save diagnosis.");
    }
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED': return <Badge variant="success">Confirmed</Badge>;
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      case 'COMPLETED': return <Badge variant="default">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="error">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary mb-2">Doctor Portal</h1>
          <p className="text-gray-500">Here is your schedule for today.</p>
        </div>
        <Link to="/doctor/schedule">
          <Button>
            <CalendarIcon size={18} className="mr-2" />
            View Full Calendar
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle>Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-lg" />)}
            </div>
          ) : isError ? (
            <div className="text-error p-4 bg-error/10 rounded-lg">Failed to load schedule.</div>
          ) : appointments?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No appointments today</h3>
              <p className="text-gray-500">You have a clear schedule for the rest of the day.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex w-12 h-12 bg-primary/10 rounded-full items-center justify-center text-primary">
                      <User size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">
                        {apt.patient.user.firstName} {apt.patient.user.lastName}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {format(new Date(apt.startTime), 'h:mm a')} - {format(new Date(apt.endTime), 'h:mm a')}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Reason: </span>
                        {apt.reason || 'Not specified'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-4">
                    {getStatusBadge(apt.status)}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-surface border-gray-200 dark:border-gray-800"
                      onClick={() => setSelectedAppt(apt)}
                    >
                      Start Consultation
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consultation Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedAppt.patient.user.firstName} {selectedAppt.patient.user.lastName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Age: {new Date().getFullYear() - new Date(selectedAppt.patient.dob).getFullYear()} | Gender: {selectedAppt.patient.gender} | Blood: {selectedAppt.patient.bloodGroup || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-surface border-success text-success hover:bg-success/10"
                  disabled={completeAppointmentMutation.isPending}
                  onClick={() => setIsCompleteModalOpen(true)}
                >
                  {completeAppointmentMutation.isPending ? 'Saving...' : 'Complete Consultation'}
                </Button>
                <button 
                  onClick={() => {
                    setSelectedAppt(null);
                    setActiveTab('diagnosis');
                    setMedicines([{ medicineId: '', dosage: '', frequency: '', duration: '' }]);
                  }} 
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 shrink-0 bg-surface">
              {[
                { id: 'diagnosis', label: 'Diagnosis', icon: <FileText size={16} /> },
                { id: 'prescription', label: 'Prescription', icon: <Pill size={16} /> },
                { id: 'lab', label: 'Lab Tests', icon: <TestTube size={16} /> },
                { id: 'history', label: 'Medical History', icon: <History size={16} /> },
                { id: 'followup', label: 'Follow-up', icon: <CalendarPlus size={16} /> },
                { id: 'certificate', label: 'Certificate', icon: <FileBadge size={16} /> },
                { id: 'voice', label: 'Voice Notes', icon: <Mic size={16} /> },
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

            {/* Tab Content Area */}
            <div className="p-6 overflow-y-auto flex-1 bg-surface">
              
              {activeTab === 'diagnosis' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Diagnosis</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint / Symptoms</label>
                      <textarea 
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm h-24" 
                        placeholder="Patient reports..."
                        value={diagnosisData.symptoms}
                        onChange={e => setDiagnosisData({...diagnosisData, symptoms: e.target.value})}
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Final Diagnosis</label>
                      <textarea 
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm h-24" 
                        placeholder="Diagnosed with..."
                        value={diagnosisData.diagnosis}
                        onChange={e => setDiagnosisData({...diagnosisData, diagnosis: e.target.value})}
                      ></textarea>
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        disabled={saveDiagnosisMutation.isPending || !diagnosisData.diagnosis}
                        onClick={() => saveDiagnosisMutation.mutate()}
                      >
                        {saveDiagnosisMutation.isPending ? 'Saving...' : 'Save Diagnosis to Records'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'prescription' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">E-Prescription</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setMedicines([...medicines, { name: '', dosage: '', duration: '' }])}
                    >
                      + Add Medicine
                    </Button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 mb-2 px-2">
                      <div className="col-span-3">Medicine Name</div>
                      <div className="col-span-2">Dosage</div>
                      <div className="col-span-3">Frequency</div>
                      <div className="col-span-2">Duration</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>
                    
                    <div className="space-y-2">
                      {medicines.map((med, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 items-center bg-surface p-2 rounded-md border border-gray-100 dark:border-gray-800 text-sm">
                          <div className="col-span-3">
                            <select 
                              className="w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                              value={med.medicineId}
                              onChange={(e) => {
                                const newMeds = [...medicines];
                                newMeds[index].medicineId = e.target.value;
                                setMedicines(newMeds);
                              }}
                            >
                              <option value="">-- Select Medicine --</option>
                              {allMedicines?.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              className="w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                              placeholder="500mg" 
                              value={med.dosage}
                              onChange={(e) => {
                                const newMeds = [...medicines];
                                newMeds[index].dosage = e.target.value;
                                setMedicines(newMeds);
                              }}
                            />
                          </div>
                          <div className="col-span-3">
                            <input 
                              type="text" 
                              className="w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                              placeholder="1-0-1 (After Food)" 
                              value={med.frequency}
                              onChange={(e) => {
                                const newMeds = [...medicines];
                                newMeds[index].frequency = e.target.value;
                                setMedicines(newMeds);
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              className="w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                              placeholder="5 Days" 
                              value={med.duration}
                              onChange={(e) => {
                                const newMeds = [...medicines];
                                newMeds[index].duration = e.target.value;
                                setMedicines(newMeds);
                              }}
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <button 
                              onClick={() => {
                                const newMeds = medicines.filter((_, i) => i !== index);
                                setMedicines(newMeds.length ? newMeds : [{ medicineId: '', dosage: '', frequency: '', duration: '' }]);
                              }}
                              className="text-error hover:underline text-xs font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      disabled={generatePrescriptionMutation.isPending || medicines.length === 0 || !medicines[0].medicineId}
                      onClick={() => {
                        const validMeds = medicines.filter(m => m.medicineId);
                        generatePrescriptionMutation.mutate({
                          patientId: selectedAppt.patientId,
                          doctorId: selectedAppt.doctorId,
                          notes: "E-Prescription generated via portal",
                          items: validMeds.map(m => ({
                            medicineId: m.medicineId,
                            dosage: m.dosage,
                            frequency: m.frequency,
                            duration: m.duration
                          }))
                        });
                      }}
                    >
                      {generatePrescriptionMutation.isPending ? 'Generating...' : 'Generate Prescription'}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'lab' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Lab Diagnostics</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 gap-4 text-sm font-medium text-gray-700">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase">Select Test Type</label>
                        <select 
                          className="w-full p-2.5 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                          value={labTestName}
                          onChange={(e) => setLabTestName(e.target.value)}
                        >
                          <option value="">-- Select Lab Test --</option>
                          <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                          <option value="Lipid Profile">Lipid Profile</option>
                          <option value="Fasting Blood Sugar">Fasting Blood Sugar</option>
                          <option value="Thyroid Function Test">Thyroid Function Test</option>
                          <option value="Urine Routine">Urine Routine</option>
                        </select>
                      </div>
                      <div className="space-y-1 mt-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase">Clinical Notes for Lab Staff</label>
                        <textarea className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm h-20" placeholder="e.g. Ensure 12-hour fasting..."></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      disabled={sendLabOrderMutation.isPending || !labTestName}
                      onClick={() => {
                        sendLabOrderMutation.mutate({
                          patientId: selectedAppt.patientId,
                          testName: labTestName
                        });
                      }}
                    >
                      {sendLabOrderMutation.isPending ? 'Sending...' : 'Send Order to Lab'}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Medical Records</h3>
                  <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                    {!patientDetails?.medicalRecords || patientDetails.medicalRecords.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No past medical records found.</div>
                    ) : (
                      patientDetails.medicalRecords.map((record) => (
                        <div key={record.id} className="p-4 bg-gray-50/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-sm">{record.recordType}</span>
                            <span className="text-xs text-gray-500">{format(new Date(record.date), 'MMM dd, yyyy')}</span>
                          </div>
                          <p className="text-sm text-gray-600">{record.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'followup' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Follow-up</h3>
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Date</label>
                      <input 
                        type="date" 
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" 
                        value={followupDate}
                        onChange={(e) => setFollowupDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Reception</label>
                      <textarea 
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" 
                        placeholder="Needs fasting before next visit..."
                        value={followupNotes}
                        onChange={(e) => setFollowupNotes(e.target.value)}
                      ></textarea>
                    </div>
                    <Button 
                      disabled={scheduleFollowupMutation.isPending || !followupDate}
                      onClick={() => {
                        // Create appointment for 10:00 AM on the selected date by default for demo
                        const dateObj = new Date(followupDate);
                        dateObj.setHours(10, 0, 0, 0);
                        
                        scheduleFollowupMutation.mutate({
                          patientId: selectedAppt.patientId,
                          doctorId: selectedAppt.doctorId,
                          date: dateObj.toISOString(),
                          startTime: dateObj.toISOString(),
                          endTime: new Date(dateObj.getTime() + 30*60000).toISOString(),
                          reason: `Follow-up: ${followupNotes}`
                        });
                      }}
                    >
                      {scheduleFollowupMutation.isPending ? 'Scheduling...' : 'Schedule Appointment'}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'certificate' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Medical Certificate</h3>
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Rest (Days)</label>
                      <input 
                        type="number" 
                        min="1"
                        max="90"
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" 
                        value={certDays}
                        onChange={(e) => setCertDays(Number(e.target.value))}
                      />
                    </div>
                    <Button onClick={generateCertificate}>
                      Download Certificate PDF
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'voice' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center py-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Record Clinical Voice Note</h3>
                  <p className="text-sm text-gray-500 mb-8 text-center max-w-sm">
                    Record your observations. They will be securely uploaded and attached to the patient's medical history.
                  </p>
                  
                  <div className="flex flex-col items-center gap-6">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      isRecording ? 'bg-red-50 border-4 border-red-500 shadow-red-200/50' : 'bg-primary/10 border-4 border-primary/20'
                    }`}>
                      {isRecording ? (
                        <div className="flex gap-2">
                           <span className="w-2 h-8 bg-red-500 rounded-full animate-pulse"></span>
                           <span className="w-2 h-12 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                           <span className="w-2 h-6 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      ) : (
                        <Mic size={48} className="text-primary" />
                      )}
                    </div>
                    
                    {uploadingVoice ? (
                      <Button disabled className="w-48">Uploading...</Button>
                    ) : isRecording ? (
                      <Button variant="destructive" className="w-48 bg-error hover:bg-error/90" onClick={stopRecording}>
                        <Square size={16} className="mr-2" /> Stop Recording
                      </Button>
                    ) : (
                      <Button className="w-48" onClick={startRecording}>
                        <Mic size={16} className="mr-2" /> Start Recording
                      </Button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Complete Consultation Modal */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle>Complete Consultation</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to mark this consultation as completed?</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)}>Cancel</Button>
                <Button 
                  disabled={completeAppointmentMutation.isPending}
                  onClick={() => {
                    completeAppointmentMutation.mutate(selectedAppt.id);
                    setIsCompleteModalOpen(false);
                  }}
                >
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
