

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Calendar, User, Search, Filter, Receipt, IndianRupee, Loader2 } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import PrescriptionViewModal from "@/components/prescription/PrescriptionViewModal";


const Reports = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  // Set default date to today in YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const [date, setDate] = useState<string>(`${yyyy}-${mm}-${dd}`);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [tab, setTab] = useState<'prescriptions'|'appointments'>("prescriptions");
  
  // Billing related states
  const [billsMap, setBillsMap] = useState<Map<number, any>>(new Map());
  const [loadingBills, setLoadingBills] = useState<Set<number>>(new Set());
  const [generatingBills, setGeneratingBills] = useState<Set<number>>(new Set());
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [date, page, tab]);

  useEffect(() => {
    if (tab === 'prescriptions' && prescriptions.length > 0) {
      checkExistingBills();
    }
  }, [prescriptions, tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "prescriptions") {
        const res = await api.get("/reports/prescriptions", { params: { date, page, pageSize } });
        setPrescriptions(res.data.data);
        setTotal(res.data.total);
      } else {
        const res = await api.get("/reports/appointments", { params: { date, page, pageSize } });
        setAppointments(res.data.data);
        setTotal(res.data.total);
      }
      const summaryRes = await api.get("/reports/summary", { params: { date } });
      setSummary(summaryRes.data);
    } catch (e) {
      // handle error
    }
    setLoading(false);
  };

  const checkExistingBills = async () => {
    const prescriptionIds = prescriptions.map(p => p.id);
    if (prescriptionIds.length === 0) return;

    try {
      const response = await api.get('/billing', {
        params: {
          prescriptionIds: prescriptionIds.join(','),
          limit: 100
        }
      });

      const bills = response.data.bills || response.data || [];
      const newBillsMap = new Map();
      
      bills.forEach((bill: any) => {
        if (bill.prescriptionId) {
          newBillsMap.set(bill.prescriptionId, bill);
        }
      });
      
      setBillsMap(newBillsMap);
    } catch (error) {
      console.error('Error checking existing bills:', error);
    }
  };

  const handleGenerateBill = async (prescriptionId: number) => {
    setGeneratingBills(prev => new Set([...prev, prescriptionId]));
    
    try {
      const response = await api.post("/billing/create-from-prescription", {
        prescriptionId: prescriptionId,
      });

      toast({
        title: "Bill Generated",
        description: `Bill ${response.data.billNumber} has been created successfully.`,
      });

      // Update the bills map with the new bill
      setBillsMap(prev => new Map([...prev, [prescriptionId, response.data]]));
      
    } catch (error: any) {
      console.error("Error generating bill:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to generate bill";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGeneratingBills(prev => {
        const newSet = new Set(prev);
        newSet.delete(prescriptionId);
        return newSet;
      });
    }
  };

  const handleViewBill = async (prescriptionId: number) => {
    const existingBill = billsMap.get(prescriptionId);
    if (!existingBill) return;

    // Navigate to billing page with the specific bill
    navigate('/billing', { 
      state: { 
        selectedBillId: existingBill.id,
        billNumber: existingBill.billNumber 
      } 
    });
  };

  const handleViewPrescription = (prescription: any) => {
    setSelectedPrescription(prescription);
    setShowPrescriptionModal(true);
  };

  const handleExport = async (type: 'csv'|'pdf') => {
    const url = tab === 'prescriptions' ? '/reports/prescriptions/export' : '/reports/appointments/export';
    const format = type;
    const params = { date, format };
    const response = await api.get(url, { params, responseType: 'blob' });
    const blob = new Blob([response.data], { type: type === 'csv' ? 'text/csv' : 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${tab}_report.${type}`;
    link.click();
  };

  // Patient filter for prescriptions
  const patients = Array.from(new Set(prescriptions.map((p) => p.patientName)));
  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesPatient = selectedPatient === "all" || p.patientName === selectedPatient;
    const matchesSearch =
      (p.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patientVisibleId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.chiefComplaint?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPatient && matchesSearch;
  });

  // Patient filter for appointments
  const appointmentPatients = Array.from(new Set(appointments.map((a) => a.patientId)));
  const filteredAppointments = appointments.filter((a) => {
    const matchesPatient = selectedPatient === "all" || a.patientId === selectedPatient;
    const matchesSearch =
      (a.patientId?.toString().includes(searchQuery) ||
        a.status?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPatient && matchesSearch;
  });

  // Format date as DD/MM/YYYY, HH:MM AM/PM
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return format(d, "dd/MM/yyyy, hh:mm a");
  };

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return format(d, "dd/MM/yyyy");
  };

  // Extract time from date string (ISO) as fallback
  const getAppointmentTime = (a: any) => {
    if (a.time && /^\d{2}:\d{2}(:\d{2})?$/.test(a.time)) {
      return format(new Date(`1970-01-01T${a.time}`), "hh:mm a");
    }
    // Try to extract from date field
    if (a.date) {
      const d = new Date(a.date);
      if (!isNaN(d.getTime())) {
        return format(d, "hh:mm a");
      }
    }
    return "-";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "not_visited": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Clinic Reports</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}><Download className="h-4 w-4 mr-1" />Export PDF</Button>
        </div>
      </div>

      {/* Tabs for Prescriptions/Appointments */}
      <div className="flex gap-2 mb-2">
        <Button variant={tab === 'prescriptions' ? 'default' : 'outline'} onClick={() => { setTab('prescriptions'); setPage(1); setSelectedPatient('all'); }}>Prescriptions</Button>
        <Button variant={tab === 'appointments' ? 'default' : 'outline'} onClick={() => { setTab('appointments'); setPage(1); setSelectedPatient('all'); }}>Appointments</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.totalAppointments ?? '-'}</div>
            <div className="text-sm text-gray-600">Total Appointments (all statuses)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summary.completedAppointments ?? '-'}</div>
            <div className="text-sm text-gray-600">Completed (visited)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.noShowAppointments ?? '-'}</div>
            <div className="text-sm text-gray-600">No Shows (not visited)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalPrescriptions ?? '-'}</div>
            <div className="text-sm text-gray-600">Total Prescriptions</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={tab === 'prescriptions' ? "Search patient, doctor, complaint..." : "Search patient ID, status..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  {(tab === 'prescriptions' ? patients : appointmentPatients).map((patient) => (
                    <SelectItem key={patient} value={patient}>{patient}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              {tab === 'prescriptions' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Patient</th>
                        <th className="p-2 text-left">Doctor</th>
                        <th className="p-2 text-left">Complaint</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrescriptions.map((p) => {
                        const existingBill = billsMap.get(p.id);
                        const isGenerating = generatingBills.has(p.id);
                        const isLoadingBill = loadingBills.has(p.id);
                        
                        return (
                          <tr key={p.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div>
                                <span className="font-medium">{p.patientName}</span>
                                <span className="text-xs text-gray-400 ml-1">({p.patientVisibleId})</span>
                              </div>
                            </td>
                            <td className="p-2">{p.doctorName}</td>
                            <td className="p-2">
                              <div className="max-w-xs truncate" title={p.chiefComplaint}>
                                {p.chiefComplaint}
                              </div>
                            </td>
                            <td className="p-2">{formatDateTime(p.createdAt)}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewPrescription(p)}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  View
                                </Button>
                                
                                {existingBill ? (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      Bill: {existingBill.billNumber}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewBill(p.id)}
                                      disabled={isLoadingBill}
                                      className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                                    >
                                      {isLoadingBill ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Receipt className="h-3 w-3" />
                                      )}
                                      View Bill
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerateBill(p.id)}
                                    disabled={isGenerating}
                                    className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    {isGenerating ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <IndianRupee className="h-3 w-3" />
                                    )}
                                    {isGenerating ? "Generating..." : "Generate Bill"}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Patient</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Time</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map((a) => (
                        <tr key={a.id} className="border-b">
                          <td className="p-2">
                            {a.patientName ? (
                              <>
                                {a.patientName} <span className="text-xs text-gray-400">({a.patientVisibleId || a.patientId})</span>
                              </>
                            ) : (
                              a.patientId
                            )}
                          </td>
                          <td className="p-2">{formatDateOnly(a.date)}</td>
                          <td className="p-2">{getAppointmentTime(a)}</td>
                          <td className="p-2"><span className={`px-2 py-1 rounded ${getStatusColor(a.status)}`}>{a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Pagination */}
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
                    </PaginationItem>
                    {[...Array(Math.ceil(total / pageSize)).keys()].map((i) => (
                      <PaginationItem key={i}>
                        <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Prescription View Modal */}
      {selectedPrescription && (
        <PrescriptionViewModal
          prescription={selectedPrescription}
          onClose={() => {
            setShowPrescriptionModal(false);
            setSelectedPrescription(null);
            // Refresh bills after prescription modal closes (in case bill was generated)
            if (tab === 'prescriptions') {
              checkExistingBills();
            }
          }}
        />
      )}
    </div>
  );
};

export default Reports;
