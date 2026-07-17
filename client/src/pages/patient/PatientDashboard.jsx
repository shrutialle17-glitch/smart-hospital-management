import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Calendar as CalendarIcon, FileText, Pill, Search, Plus, X, Download, TestTube, Mic, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useAIStore } from '../../store/aiStore';
import { format } from 'date-fns';
import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';

const fetchPatientData = async () => {
  const { data: appointments } = await api.get('/appointments');
  const { data: bills } = await api.get('/billing');
  const { data: reports } = await api.get('/lab/reports');
  const { data: prescriptions } = await api.get('/pharmacy/prescriptions');
  // Filter out cancelled or completed appointments for the "Next Appointment" view
  const activeAppointments = appointments.data.filter(apt => apt.status === 'PENDING' || apt.status === 'CONFIRMED');
  
  // Fetch patient timeline using the 'me' alias
  let timeline = { data: [] };
  try {
    const { data: tData } = await api.get('/patients/me/timeline');
    timeline = tData;
  } catch (err) {
    console.error("Timeline error:", err);
  }

  return { 
    appointments: activeAppointments, 
    bills: bills.data, 
    reports: reports.data, 
    prescriptions: prescriptions.data,
    timeline: timeline.data
  };
};

const fetchDoctors = async () => {
  const { data } = await api.get('/public/doctors');
  return data.data;
};

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const { openDrawer } = useAIStore();
  const queryClient = useQueryClient();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ doctorId: '', date: '', time: '', reason: '' });
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  
  const { data, isLoading } = useQuery({
    queryKey: ['patientDashboard', user?.id],
    queryFn: fetchPatientData,
    enabled: !!user?.id
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctorsList'],
    queryFn: fetchDoctors,
    enabled: isBookingOpen
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: (apptData) => {
      const start = new Date(`${apptData.date}T${apptData.time}`);
      const end = new Date(start.getTime() + 30 * 60000); 
      
      return api.post('/appointments', {
        doctorId: apptData.doctorId,
        date: apptData.date,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        reason: apptData.reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patientDashboard']);
      setIsBookingOpen(false);
      setNewAppointment({ doctorId: '', date: '', time: '', reason: '' });
      toast.success("Appointment booked successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to book appointment.");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['patientDashboard']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to cancel appointment.");
    }
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (paymentData) => api.post(`/payments/verify`, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries(['patientDashboard']);
      toast.success("Payment processed successfully! Bill is updated.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Payment verification failed.");
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: (bill) => api.post('/payments/create-order', {
      amount: bill.totalAmount - bill.paidAmount,
      billId: bill.id
    }),
    onSuccess: (res, variables) => {
      const order = res.data.data;
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
        amount: order.amount,
        currency: order.currency,
        name: 'MediCore Hospital',
        description: `Payment for Bill #${variables.id.substring(0, 6).toUpperCase()}`,
        image: '/logo.png',
        order_id: order.id,
        handler: function (response) {
          verifyPaymentMutation.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            billId: variables.id
          });
        },
        prefill: {
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
          contact: user?.phone
        },
        theme: {
          color: '#10b981'
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        toast.error("Payment failed: " + response.error.description);
      });
      rzp1.open();
    },
    onError: (err) => {
      console.error(err);
      toast.error(err.response?.data?.error?.message || "Failed to initiate payment.");
    }
  });

  const handlePayBill = (bill) => {
    createOrderMutation.mutate(bill);
  };

  const handleBookAppointment = (e) => {
    e.preventDefault();
    bookAppointmentMutation.mutate(newAppointment);
  };

  const generateInvoicePDF = (bill) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("MediCore Hospital", 14, 22);
    doc.setFontSize(12);
    doc.text("Official Billing Invoice", 14, 32);
    doc.text(`Patient: ${user?.firstName} ${user?.lastName}`, 14, 42);
    doc.text(`Date: ${format(new Date(bill.createdAt), 'MMM dd, yyyy')}`, 14, 48);
    doc.text(`Status: ${bill.status}`, 14, 54);

    const tableData = bill.items && bill.items.length > 0 ? bill.items.map(item => [
      item.description,
      item.type,
      item.quantity,
      `Rs. ${item.amount.toFixed(2)}`
    ]) : [['Consultation Fee', 'CONSULTATION', 1, `Rs. ${bill.totalAmount.toFixed(2)}`]];

    autoTable(doc, {
      startY: 65,
      head: [['Description', 'Type', 'Qty', 'Amount']],
      body: tableData,
    });

    const finalY = doc.lastAutoTable.finalY || 65;
    doc.setFontSize(14);
    doc.text(`Total Amount: Rs. ${bill.totalAmount.toFixed(2)}`, 14, finalY + 15);
    doc.text(`Amount Paid: Rs. ${bill.paidAmount.toFixed(2)}`, 14, finalY + 25);
    
    doc.save(`MediCore_Invoice_${bill.id.substring(0,6)}.pdf`);
  };

  const generateLabReportPDF = (report) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("MediCore Hospital", 14, 22);
    doc.setFontSize(12);
    doc.text("Official Laboratory Report", 14, 32);
    doc.text(`Patient: ${user?.firstName} ${user?.lastName}`, 14, 42);
    doc.text(`Date: ${format(new Date(report.date), 'MMM dd, yyyy')}`, 14, 48);
    doc.text(`Test Name: ${report.test.name}`, 14, 54);
    doc.text(`Status: ${report.status}`, 14, 60);

    doc.setFontSize(14);
    doc.text("Clinical Notes / Result Summary:", 14, 75);
    
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(report.result || "No detailed results provided.", 180);
    doc.text(splitText, 14, 85);

    if (report.fileUrl) {
      doc.text("Note: An attachment is available. Please view the portal for the raw file.", 14, 85 + (splitText.length * 7) + 10);
    }
    
    doc.save(`MediCore_LabReport_${report.id.substring(0,6)}.pdf`);
  };

  const generateConsultationPDF = (record) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(15, 118, 110);
    doc.text("MediCore Hospital", 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Clinical Consultation Note", 14, 32);
    
    doc.setFontSize(11);
    doc.text(`Patient: ${user?.firstName} ${user?.lastName}`, 14, 45);
    doc.text(`Date: ${format(new Date(record.date), 'MMM dd, yyyy')}`, 14, 52);
    
    doc.setLineWidth(0.5);
    doc.line(14, 58, 196, 58);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Clinical Notes", 14, 70);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    
    const splitText = doc.splitTextToSize(record.description || "No detailed notes provided.", 180);
    doc.text(splitText, 14, 80);
    
    doc.setFont(undefined, 'italic');
    doc.setFontSize(10);
    doc.text("This is an electronically generated consultation summary.", 14, 280);
    
    doc.save(`MediCore_Consultation_${record.id.substring(0,6)}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary mb-2">My Health Portal</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.firstName}.</p>
        </div>
        <Button onClick={() => setIsBookingOpen(true)} className="shadow-sm">
          <Plus size={18} className="mr-2" /> Book Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-surface border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-secondary flex items-center gap-2">
              <CalendarIcon size={20} className="text-[#84A98C]" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-lg w-full mt-2" />
              </div>
            ) : data?.appointments?.length > 0 ? (
              <div>
                <p className="font-semibold text-lg">{format(new Date(data.appointments[0].date), 'MMM dd, yyyy')}</p>
                <p className="text-sm text-gray-500">at {format(new Date(data.appointments[0].startTime), 'h:mm a')} with Dr. {data.appointments[0].doctor.user.lastName}</p>
                <div className="mt-4 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full bg-white dark:bg-surface border-gray-200 dark:border-gray-800 text-xs"
                    disabled={cancelMutation.isPending}
                    onClick={() => setIsRescheduleModalOpen(true)}
                  >
                    {cancelMutation.isPending ? 'Canceling...' : 'Reschedule'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-2 text-center sm:text-left">
                <p className="text-gray-400 text-sm mb-4">No upcoming appointments.</p>
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setIsBookingOpen(true)}>
                  <Plus size={14} className="mr-1.5" /> Book Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} className="text-info" />
              Recent Lab Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="space-y-4 animate-pulse">
                 <div className="flex justify-between items-center">
                   <div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" /><div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" /></div>
                   <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
                 </div>
               </div>
            ) : data?.reports?.length > 0 ? (
              <div className="space-y-3">
                {data.reports.slice(0, 3).map(report => (
                  <div key={report.id} className="border border-gray-100 dark:border-gray-800 rounded-xl p-3 last:border-0">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium text-sm">{report.test.name}</p>
                        <p className="text-xs text-gray-400">{format(new Date(report.date), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={report.status === 'COMPLETED' ? 'success' : 'warning'}>
                          {report.status}
                        </Badge>
                        {report.status === 'COMPLETED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => generateLabReportPDF(report)}
                            title="Download Report"
                          >
                            <Download size={16} className="text-primary" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {report.result && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 italic">Result: {report.result}</p>
                    )}
                    <button
                      onClick={() => openDrawer()}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-secondary font-medium transition-colors"
                    >
                      <Bot size={13} /> Ask AI to summarize this report
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-2">No recent lab reports.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
              <Pill size={20} className="text-warning" />
              Active Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="space-y-4 animate-pulse">
                 <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg space-y-2">
                   <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                   <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                 </div>
               </div>
            ) : data?.prescriptions?.length > 0 ? (
               <div className="space-y-4">
                 {data.prescriptions.flatMap(p =>
                   p.items.map(item => (
                     <div key={item.id} className="border border-gray-100 dark:border-gray-800 bg-surface rounded-xl p-4">
                       <div className="flex justify-between items-start mb-2">
                         <div>
                           <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.medicine.name}</p>
                           <p className="text-xs text-gray-500">{item.dosage} - {item.frequency}</p>
                         </div>
                         <Badge variant="warning">{item.duration}</Badge>
                       </div>
                       <p className="text-xs text-gray-400 mt-2">Prescribed by Dr. {p.doctor.user.lastName} on {format(new Date(p.createdAt), 'MMM dd, yyyy')}</p>
                       <button
                         onClick={() => { openDrawer(); }}
                         className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-secondary font-medium transition-colors"
                       >
                         <Bot size={13} /> Ask AI to explain this prescription
                       </button>
                     </div>
                   ))
                 )}
               </div>
            ) : (
              <p className="text-gray-400 text-sm py-2">No active prescriptions.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Digital Hospital ID */}
        <Card>
          <CardHeader>
            <CardTitle>Digital Hospital ID</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 bg-surface">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
              <QRCode 
                value={JSON.stringify({
                  userId: user?.id,
                  name: `${user?.firstName} ${user?.lastName}`,
                  role: user?.role
                })} 
                size={180} 
                level="H"
              />
            </div>
            <p className="font-semibold text-lg">{user?.firstName} {user?.lastName}</p>
            <p className="text-gray-500 text-sm mb-4">NovaCare Patient ID</p>
            <Badge variant="success">Verified Profile</Badge>
          </CardContent>
        </Card>

        {/* Patient Health Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Health Timeline</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[350px] overflow-y-auto">
            {isLoading ? (
               <div className="space-y-4 animate-pulse">
                 {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded w-full" />)}
               </div>
            ) : data?.timeline?.length > 0 ? (
               <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                 {data.timeline.map((event, idx) => (
                   <div key={`${event.id}-${idx}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {event.type === 'APPOINTMENT' && <CalendarIcon size={16} />}
                        {event.type === 'PRESCRIPTION' && <Pill size={16} />}
                        {event.type === 'LAB_REPORT' && <TestTube size={16} />}
                        {event.type === 'BILL' && <FileText size={16} />}
                        {event.type === 'MEDICAL_RECORD' && <FileText size={16} />}
                        {event.type === 'VOICE_NOTE' && <Mic size={16} />}
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                       <div className="flex justify-between items-center mb-1">
                         <span className="font-bold text-sm text-gray-900">{event.title}</span>
                         <span className="text-xs text-gray-400">{format(new Date(event.date), 'MMM dd')}</span>
                       </div>
                       <p className="text-xs text-gray-600 line-clamp-2">{event.description}</p>
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-gray-400 text-sm text-center py-6">No timeline events found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Consultations & Certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            My Consultations & Certificates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map(i => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded w-full" />
              ))}
            </div>
          ) : data?.timeline?.filter(t => t.type === 'MEDICAL_RECORD' || t.type === 'VOICE_NOTE').length > 0 ? (
            <div className="space-y-4">
              {data.timeline.filter(t => t.type === 'MEDICAL_RECORD' || t.type === 'VOICE_NOTE').map((record) => (
                <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                  <div className="flex-1 pr-4">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {record.type === 'VOICE_NOTE' ? record.title : record.title.replace('Medical Record: ', '')}
                    </p>
                    <p className="text-xs text-gray-400 mb-1">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{record.description}</p>
                  </div>
                  <div className="mt-3 sm:mt-0 flex-shrink-0">
                    {record.type === 'VOICE_NOTE' && record.fileUrl ? (
                      <audio controls src={record.fileUrl} className="h-8 w-48" preload="none" />
                    ) : record.fileUrl ? (
                      <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="flex items-center gap-2 text-xs">
                          <Download size={14} /> View Document
                        </Button>
                      </a>
                    ) : record.type === 'MEDICAL_RECORD' ? (
                      <Button size="sm" variant="outline" className="flex items-center gap-2 text-xs" onClick={() => generateConsultationPDF(record)}>
                        <Download size={14} /> Download PDF
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No consultations or certificates found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Billing History</CardTitle>
        </CardHeader>
        <CardContent>
           {isLoading ? (
               <div className="space-y-3 animate-pulse">
                 {[1, 2].map(i => (
                   <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                 ))}
               </div>
            ) : data?.bills?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-surface/50 border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bills.map((bill) => (
                      <tr key={bill.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{format(new Date(bill.createdAt), 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{bill.totalAmount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{bill.paidAmount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={bill.status === 'PAID' ? 'success' : bill.status === 'PARTIAL' ? 'warning' : 'error'}>
                            {bill.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {bill.status !== 'PAID' && (
                              <Button 
                                size="sm" 
                                onClick={() => handlePayBill(bill)}
                                disabled={createOrderMutation.isPending || verifyPaymentMutation.isPending}
                                className="h-8 px-3 text-xs"
                              >
                                {createOrderMutation.isPending ? 'Processing...' : 'Pay Now'}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => generateInvoicePDF(bill)} title="Download PDF">
                              <Download size={16} className="text-primary" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">No billing history found.</p>
            )}
        </CardContent>
      </Card>

      {/* Book Appointment Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle>Book Appointment</CardTitle>
              <button onClick={() => setIsBookingOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Select Doctor</label>
                  <select required className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-surface" value={newAppointment.doctorId} onChange={e => setNewAppointment({...newAppointment, doctorId: e.target.value})}>
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
                    <input required type="date" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newAppointment.date} onChange={e => setNewAppointment({...newAppointment, date: e.target.value})} min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Time</label>
                    <input required type="time" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newAppointment.time} onChange={e => setNewAppointment({...newAppointment, time: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Reason for Visit</label>
                  <textarea required className="w-full p-2 border border-gray-200 rounded-lg text-sm h-24" placeholder="Briefly describe your symptoms..." value={newAppointment.reason} onChange={e => setNewAppointment({...newAppointment, reason: e.target.value})}></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsBookingOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={bookAppointmentMutation.isPending}>
                    {bookAppointmentMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reschedule Confirmation Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle>Reschedule Appointment</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-6">To reschedule, we will cancel your current appointment so you can book a new time. Proceed?</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>Cancel</Button>
                <Button 
                  disabled={cancelMutation.isPending}
                  onClick={() => {
                    cancelMutation.mutate(data.appointments[0].id, {
                      onSuccess: () => {
                        setIsRescheduleModalOpen(false);
                        setIsBookingOpen(true);
                      }
                    });
                  }}
                >
                  {cancelMutation.isPending ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default PatientDashboard;
