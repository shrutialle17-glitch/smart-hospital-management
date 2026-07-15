import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Package, AlertTriangle, Search, Plus, X, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useState } from 'react';

const fetchLowStockMedicines = async () => {
  const { data } = await api.get('/pharmacy/medicines', { params: { lowStock: 'true' } });
  return data.data;
};

const fetchAllMedicines = async () => {
  const { data } = await api.get('/pharmacy/medicines', { params: { limit: 100 } });
  return data.data;
};

const PharmacistDashboard = () => {
  const queryClient = useQueryClient();
  const [isDispenseOpen, setIsDispenseOpen] = useState(false);
  const [dispenseData, setDispenseData] = useState({ medicineId: '', quantity: 1, notes: '' });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addData, setAddData] = useState({ name: '', categoryId: '', manufacturer: '', unitPrice: '', stockLevel: '', minStock: '10' });
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [restockMedicine, setRestockMedicine] = useState(null);
  const [restockQty, setRestockQty] = useState(50);

  const { data: incomingPrescriptions, isLoading: isPrescriptionsLoading } = useQuery({
    queryKey: ['incomingPrescriptions'],
    queryFn: async () => {
      const { data } = await api.get('/pharmacy/prescriptions');
      // Map DB structure to UI structure expected by PharmacistDashboard
      return data.data.filter(p => p.status === 'PENDING').map(p => ({
        id: p.id,
        patientId: p.patient.id,
        doctor: `Dr. ${p.doctor.user.lastName}`,
        patient: `${p.patient.user.firstName} ${p.patient.user.lastName}`,
        time: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meds: p.items.map(i => ({
          name: i.medicine.name,
          medicineId: i.medicine.id,
          unitPrice: i.medicine.unitPrice,
          qty: parseInt(i.duration) * (parseInt(i.dosage) || 1) || 10, // heuristic
          instructions: `${i.dosage} - ${i.frequency} for ${i.duration}`
        }))
      }));
    }
  });

  const { data: allMedicines, isLoading: isAllLoading } = useQuery({
    queryKey: ['allMedicines'],
    queryFn: async () => {
      const { data } = await api.get('/pharmacy/medicines', { params: { limit: 500 } });
      return data.data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['medicineCategories'],
    queryFn: async () => {
      const { data } = await api.get('/pharmacy/categories');
      return data.data;
    }
  });

  const { data: lowStock, isLoading } = useQuery({
    queryKey: ['lowStockMedicines'],
    queryFn: fetchLowStockMedicines
  });



  const dispenseMutation = useMutation({
    mutationFn: (data) => api.patch(`/pharmacy/medicines/${data.medicineId}/stock`, {
      quantity: data.quantity,
      transactionType: 'OUT',
      notes: data.notes || 'Dispensed to patient'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['lowStockMedicines']);
      queryClient.invalidateQueries(['allMedicines']);
      setIsDispenseOpen(false);
      setDispenseData({ medicineId: '', quantity: 1, notes: '' });
      toast.success("Medicine dispensed successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to dispense medicine.");
    }
  });

  const handleDispense = (e) => {
    e.preventDefault();
    dispenseMutation.mutate(dispenseData);
  };

  const restockMutation = useMutation({
    mutationFn: (data) => api.patch(`/pharmacy/medicines/${data.id}/stock`, {
      quantity: data.quantity,
      transactionType: 'IN',
      notes: 'Manual restock from dashboard'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['lowStockMedicines']);
      queryClient.invalidateQueries(['allMedicines']);
      setRestockMedicine(null);
      setRestockQty(50);
      toast.success("Inventory restocked successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to restock medicine.");
    }
  });

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/pharmacy/medicines', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lowStockMedicines']);
      queryClient.invalidateQueries(['allMedicines']);
      setIsAddOpen(false);
      setAddData({ name: '', categoryId: '', manufacturer: '', unitPrice: '', stockLevel: '', minStock: '10' });
      toast.success("New medicine added successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || "Failed to add medicine.");
    }
  });

  const fulfillMutation = useMutation({
    mutationFn: async (prescription) => {
      const patientId = prescription.patientId;
      if (!patientId) throw new Error("No patient found to bill to.");

      const billItems = prescription.meds.map(m => {
        const medData = allMedicines?.find(med => med.id === m.medicineId);
        if (medData && medData.stockLevel < m.qty) {
          throw new Error(`Insufficient stock for ${m.name}. Current stock: ${medData.stockLevel}, Required: ${m.qty}. Please restock first.`);
        }

        return {
          description: `Prescription: ${m.name}`,
          amount: m.unitPrice || 15.00,
          quantity: m.qty,
          type: 'MEDICINE',
          medicineId: m.medicineId
        };
      });

      // 3. Create Bill
      await api.post('/billing', { patientId, items: billItems });

      // 4. Reduce Stock for each item
      for (const item of billItems) {
        if (item.medicineId) {
          await api.patch(`/pharmacy/medicines/${item.medicineId}/stock`, {
            quantity: item.quantity,
            transactionType: 'OUT',
            notes: `Dispensed for prescription ${prescription.id}`
          });
        }
      }

      // 5. Update Prescription Status
      await api.patch(`/pharmacy/prescriptions/${prescription.id}/status`, { status: 'FULFILLED' });
    },
    onSuccess: (_, prescription) => {
      toast.success('Medicines successfully dispensed! Stock reduced and Bill generated.');
      setSelectedPrescription(null);
      queryClient.invalidateQueries(['lowStockMedicines']);
      queryClient.invalidateQueries(['allMedicines']);
      queryClient.invalidateQueries(['incomingPrescriptions']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || err.message || "Failed to fulfill prescription.");
    }
  });

  const handleAdd = (e) => {
    e.preventDefault();
    addMutation.mutate(addData);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary mb-2">Pharmacy Operations</h1>
          <p className="text-gray-500">Manage inventory and dispense prescriptions.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="bg-surface border-gray-200 dark:border-gray-800 text-primary hover:bg-primary/5" onClick={() => setIsDispenseOpen(true)}>
            <Search size={18} className="mr-2" />
            Dispense Medicine
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={18} className="mr-2" />
            Add Medicine
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-error/20">
          <CardHeader className="bg-error/5 rounded-t-xl border-b border-error/10 pb-4">
            <CardTitle className="text-error flex items-center gap-2">
              <AlertTriangle size={20} />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-50 rounded" />)}
              </div>
            ) : lowStock?.length > 0 ? (
              <div className="space-y-3">
                {lowStock.map(med => (
                  <div key={med.id} className="flex items-center justify-between p-3 bg-surface border border-gray-100 dark:border-gray-800 rounded-lg shadow-sm">
                    <div>
                      <p className="font-semibold text-sm">{med.name}</p>
                      <p className="text-xs text-gray-500">{med.category.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Current Stock</p>
                        <p className="font-bold text-error">{med.stockLevel}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={restockMutation.isPending}
                        onClick={() => {
                          setRestockMedicine(med);
                          setRestockQty(50);
                        }}
                      >
                        Restock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Package size={32} className="mx-auto text-success/50 mb-2" />
                Inventory levels are healthy.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-primary/5 rounded-t-xl border-b border-primary/10 pb-4">
            <CardTitle className="text-primary flex items-center gap-2">
              <FileText size={20} />
              Incoming Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {isPrescriptionsLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 rounded" />)}
                </div>
              ) : !incomingPrescriptions || incomingPrescriptions.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                  No pending prescriptions.
                </div>
              ) : (
                incomingPrescriptions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{p.patient}</p>
                        <p className="text-xs text-gray-500">From {p.doctor} • {p.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-xs font-medium text-text-secondary bg-surface px-2 py-1 rounded border border-gray-200 dark:border-gray-800">{p.meds.length} items</span>
                      <Button size="sm" onClick={() => setSelectedPrescription(p)}>
                        Review & Dispense
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <div className="text-center pt-4 text-xs text-gray-400">
                *Prescriptions sent directly from the Doctor Portal arrive here automatically.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dispense Medicine Modal */}
      {isDispenseOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle>Manual Dispense</CardTitle>
              <button onClick={() => setIsDispenseOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs mb-4">
                Use this for walk-in patients or counter sales without an e-prescription.
              </div>
              <form onSubmit={handleDispense} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Select Medicine</label>
                  <select required className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-surface" value={dispenseData.medicineId} onChange={e => setDispenseData({ ...dispenseData, medicineId: e.target.value })}>
                    <option value="">-- Choose Medicine --</option>
                    {allMedicines?.map(med => (
                      <option key={med.id} value={med.id} disabled={med.stockLevel <= 0}>
                        {med.name} ({med.stockLevel > 0 ? `${med.stockLevel} in stock` : 'Out of Stock'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Quantity</label>
                  <input required type="number" min="1" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={dispenseData.quantity} onChange={e => setDispenseData({ ...dispenseData, quantity: e.target.value })} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Patient Name / Notes</label>
                  <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. John Doe - Rx #12345" value={dispenseData.notes} onChange={e => setDispenseData({ ...dispenseData, notes: e.target.value })} />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDispenseOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={dispenseMutation.isPending}>
                    {dispenseMutation.isPending ? 'Dispensing...' : 'Confirm Dispense'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Medicine Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl my-8">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle>Add New Medicine to Inventory</CardTitle>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Medicine Name</label>
                  <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Paracetamol 500mg" value={addData.name} onChange={e => setAddData({ ...addData, name: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Category</label>
                    <select required className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-surface" value={addData.categoryId} onChange={e => setAddData({ ...addData, categoryId: e.target.value })}>
                      <option value="">-- Select Category --</option>
                      {categories?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Manufacturer</label>
                    <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Pfizer" value={addData.manufacturer} onChange={e => setAddData({ ...addData, manufacturer: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Unit Price (₹)</label>
                    <input required type="number" step="0.01" min="0" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={addData.unitPrice} onChange={e => setAddData({ ...addData, unitPrice: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Initial Stock</label>
                    <input required type="number" min="0" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={addData.stockLevel} onChange={e => setAddData({ ...addData, stockLevel: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Min Alert Level</label>
                    <input required type="number" min="1" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={addData.minStock} onChange={e => setAddData({ ...addData, minStock: e.target.value })} />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending ? 'Adding...' : 'Save to Inventory'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Prescription Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-2xl my-8">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <CardTitle>Prescription Review</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Patient: <span className="font-semibold text-gray-900">{selectedPrescription.patient}</span> | Prescribed by: {selectedPrescription.doctor}</p>
              </div>
              <button onClick={() => setSelectedPrescription(null)} className="text-gray-400 hover:text-gray-600 self-start">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Medicine</th>
                      <th className="px-4 py-3">Instructions</th>
                      <th className="px-4 py-3 text-right">Qty to Dispense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPrescription.meds.map((m, idx) => (
                      <tr key={idx} className="bg-surface">
                        <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                        <td className="px-4 py-3 text-gray-600">{m.instructions}</td>
                        <td className="px-4 py-3 text-right font-bold text-primary">{m.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <Button type="button" variant="outline" onClick={() => setSelectedPrescription(null)}>Cancel</Button>
                <Button
                  disabled={fulfillMutation.isPending}
                  onClick={() => fulfillMutation.mutate(selectedPrescription)}
                >
                  <CheckCircle size={16} className="mr-2" />
                  {fulfillMutation.isPending ? 'Processing...' : 'Fulfill & Generate Bill'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Restock Modal */}
      {restockMedicine && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle>Restock Inventory</CardTitle>
              <button onClick={() => setRestockMedicine(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  How many units of <span className="font-semibold text-gray-900">{restockMedicine.name}</span> do you want to add?
                </p>
                <input
                  type="number"
                  min="1"
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setRestockMedicine(null)}>Cancel</Button>
                  <Button
                    disabled={restockMutation.isPending || !restockQty || restockQty <= 0}
                    onClick={() => {
                      restockMutation.mutate({ id: restockMedicine.id, quantity: Number(restockQty) });
                    }}
                  >
                    Confirm Restock
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PharmacistDashboard;
