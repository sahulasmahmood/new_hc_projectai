

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Calendar, User, Search, Filter } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import api from "@/lib/api";


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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [date, page, tab]);

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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrescriptions.map((p) => (
                        <tr key={p.id} className="border-b">
                          <td className="p-2">{p.patientName} <span className="text-xs text-gray-400">({p.patientVisibleId})</span></td>
                          <td className="p-2">{p.doctorName}</td>
                          <td className="p-2">{p.chiefComplaint}</td>
                          <td className="p-2">{formatDateTime(p.createdAt)}</td>
                        </tr>
                      ))}
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
    </div>
  );
};

export default Reports;
