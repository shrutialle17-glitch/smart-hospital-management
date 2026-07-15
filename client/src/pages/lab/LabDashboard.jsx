import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TestTube, Upload, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { format } from 'date-fns';
import { useState } from 'react';

const fetchPendingReports = async () => {
  const { data } = await api.get('/lab/reports', { params: { status: 'PENDING' } });
  return data.data;
};

const LabDashboard = () => {
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [uploadData, setUploadData] = useState({ result: '', file: null });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const { data: pending, isLoading } = useQuery({
    queryKey: ['pendingLabReports'],
    queryFn: fetchPendingReports
  });

  const uploadMutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      formData.append('status', 'COMPLETED');
      formData.append('result', data.result);
      if (data.file) formData.append('report', data.file);

      return api.patch(`/lab/reports/${data.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingLabReports']);
      setIsUploadOpen(false);
      setSelectedReport(null);
      setUploadData({ result: '', file: null });
      toast.success("Report uploaded successfully! The PDF is now available in the Patient's portal.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Upload failed");
    }
  });

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      toast.error("Please select a PDF file first.");
      return;
    }
    // Simulate cloud upload success if not hooked up, but we are hooked up now!
    uploadMutation.mutate({ id: selectedReport.id, result: uploadData.result, file: uploadData.file });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary mb-2">Laboratory Portal</h1>
          <p className="text-gray-500">Process test requests and upload results.</p>
        </div>
      </div>

      <Card className="border-warning/20">
        <CardHeader className="bg-warning/5 rounded-t-xl border-b border-warning/10 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-warning flex items-center gap-2">
            <TestTube size={20} />
            Pending Test Requests
          </CardTitle>
          <Badge variant="warning">{pending?.length || 0} Pending</Badge>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 rounded-lg" />)}
            </div>
          ) : pending?.length > 0 ? (
            <div className="space-y-4">
              {pending.map(report => (
                <div key={report.id} className="flex flex-col sm:flex-row justify-between p-4 bg-surface border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">{report.test.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Patient: <span className="font-medium">{report.patient.user.firstName} {report.patient.user.lastName}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Requested on {format(new Date(report.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-surface border-gray-200 dark:border-gray-800"
                      onClick={() => {
                        setSelectedDetails(report);
                        setIsDetailsOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                    <Button size="sm" onClick={() => { setSelectedReport(report); setIsUploadOpen(true); }}>
                      <Upload size={16} className="mr-2" />
                      Upload Result
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <TestTube size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">No pending requests</p>
              <p className="text-sm">The laboratory queue is currently empty.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Result Modal */}
      {isUploadOpen && selectedReport && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle>Upload Lab Result</CardTitle>
              <button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-semibold text-primary">{selectedReport.test.name}</p>
                <p className="text-xs text-gray-600">Patient: {selectedReport.patient.user.firstName} {selectedReport.patient.user.lastName}</p>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">File Upload (PDF)</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50/50">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg"
                      className="w-full text-sm"
                      onChange={e => setUploadData({ ...uploadData, file: e.target.files[0] })}
                    />
                    {uploadData.file && (
                      <div className="text-success text-sm font-medium mt-2 flex items-center justify-center gap-2">
                        <FileText size={16} /> {uploadData.file.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Lab Notes / Result Summary</label>
                  <textarea required className="w-full p-2 border border-gray-200 rounded-lg text-sm h-24" placeholder="Enter key findings..." value={uploadData.result} onChange={e => setUploadData({ ...uploadData, result: e.target.value })}></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={uploadMutation.isPending || !uploadData.file}>
                    {uploadMutation.isPending ? 'Uploading to Cloudinary...' : 'Complete & Notify'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Details Modal */}
      {isDetailsOpen && selectedDetails && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle>Test Request Details</CardTitle>
              <button onClick={() => setIsDetailsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Requested Test</p>
                <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedDetails.test.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Patient</p>
                  <p className="font-medium text-gray-900">{selectedDetails.patient.user.firstName} {selectedDetails.patient.user.lastName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prescribing Doctor</p>
                  <p className="font-medium text-gray-900">{selectedDetails.doctor}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Clinical Notes & Instructions</p>
                <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg text-sm text-gray-800 leading-relaxed">
                  {selectedDetails.notes || "No specific instructions provided by the doctor."}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                <Button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedReport(selectedDetails);
                    setIsUploadOpen(true);
                  }}
                >
                  <Upload size={16} className="mr-2" />
                  Upload Result Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LabDashboard;
