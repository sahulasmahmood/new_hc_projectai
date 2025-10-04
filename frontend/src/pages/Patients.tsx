import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Phone, Mail, Calendar, Shield, Edit, Stethoscope, Clock, X, AlertTriangle, Copy, Check } from "lucide-react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import ABHAModal from "@/components/patients/ABHAModal";
import ABHAStatus from "@/components/patients/ABHAStatus";
import PatientFormDialog from "@/components/patients/PatientFormDialog";
import PatientDetailsDialog from "@/components/patients/PatientDetailsDialog";
import ScheduleDialog from "@/components/patients/ScheduleDialog";
import MedicalRecordsDialog from "@/components/patients/MedicalRecordsDialog";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/lib/api";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  lastVisit: string;
  condition: string;
  status: string;
  abhaId?: string;
  abhaVerified?: boolean;
  allergies: string[];
  emergencyContact: string;
  emergencyPhone: string;
  visibleId: string;
  address: string;
  createdFromEmergency?: boolean;
  createdAt: string;
  consultationStatus?: 'active' | 'completed' | null;
  consultationStartTime?: string;
  activeAppointmentId?: number;
  hasUpcomingAppointments?: boolean;
  upcomingAppointmentCount?: number;
}

const Patients = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortConsultationDialogOpen, setAbortConsultationDialogOpen] = useState(false);
  const [patientToAbortConsultation, setPatientToAbortConsultation] = useState<Patient | null>(null);
  const [abortReason, setAbortReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(9); // 3x3 grid
  const [autoOpenMedicalRecords, setAutoOpenMedicalRecords] = useState<{
    patient: Patient | null;
    activeTab: string;
    prescriptionToOpen?: any;
  }>({ patient: null, activeTab: 'prescriptions' });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    return {
      startDate: todayStr,
      endDate: todayStr
    };
  });
  const [filterType, setFilterType] = useState<"lastVisit" | "createdAt" | "consultation" | "all">("lastVisit");
  const navigate = useNavigate();
  const isInitialMount = useRef(true);
  
  // Check if we're coming from appointments with a consultation ID
  const urlParams = new URLSearchParams(window.location.search);
  const consultationId = urlParams.get('consultationId');
  
  // Check if we're coming from reports to open medical records
  const location = useLocation();
  const navigationState = location.state as {
    openMedicalRecords?: boolean;
    patientId?: number;
    patientName?: string;
    activeTab?: string;
    prescriptionToOpen?: any;
  } | null;
  


  // Fetch patients data
  const fetchPatients = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      const response = await api.get(`/patients?${params}`);
      setPatients(response.data);
      setCurrentPage(1); // Reset to first page when searching
    } catch (err) {
      setError("Failed to fetch patients");
      console.error("Error fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  // Combined fetch logic for initial load and search
  useEffect(() => {
    if (isInitialMount.current) {
      // Initial load - fetch without search
      fetchPatients();
      isInitialMount.current = false;
      
      // If coming from appointments with consultation ID, set filter to consultation
      if (consultationId) {
        setFilterType("consultation");
      }
    } else {
      // Search with debounce
      const debounceTimer = setTimeout(() => {
        fetchPatients(searchTerm || undefined);
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, consultationId]);

  // Handle navigation from reports to open medical records
  useEffect(() => {
    if (navigationState?.openMedicalRecords && navigationState.patientId && patients.length > 0) {
      const targetPatient = patients.find(p => p.id === navigationState.patientId);
      if (targetPatient) {
        setAutoOpenMedicalRecords({
          patient: targetPatient,
          activeTab: navigationState.activeTab || 'prescriptions',
          prescriptionToOpen: navigationState.prescriptionToOpen
        });
        // Clear the navigation state
        navigate(location.pathname, { replace: true, state: null });
      }
    }
  }, [navigationState, patients, navigate, location.pathname]);



  // Filter patients based on dateRange and filterType
  const filteredPatients = patients.filter(patient => {
    if (filterType === "all") {
      return true; // Show all patients
    } else if (filterType === "consultation") {
      return patient.consultationStatus === 'active'; // Show only patients with active consultations
    } else if (filterType === "lastVisit") {
      if (!patient.lastVisit) return false; // Skip patients with no last visit
      const patientDate = patient.lastVisit.split('T')[0];
      
      // Check if patient date is within the range
      if (dateRange.startDate && patientDate < dateRange.startDate) return false;
      if (dateRange.endDate && patientDate > dateRange.endDate) return false;
      
      return true;
    } else {
      // filterType === "createdAt"
      const patientDate = patient.createdAt.split('T')[0];
      
      // Check if patient date is within the range
      if (dateRange.startDate && patientDate < dateRange.startDate) return false;
      if (dateRange.endDate && patientDate > dateRange.endDate) return false;
      
      return true;
    }
  });

  // Calculate pagination for filtered patients
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const getStatusColor = (hasUpcomingAppointments?: boolean) => {
    // Only show badge for patients with upcoming appointments
    if (hasUpcomingAppointments) {
      return "bg-green-100 text-green-800";
    }
    
    // No badge for patients without appointments
    return null;
  };

  const getDisplayStatus = (hasUpcomingAppointments?: boolean, upcomingCount?: number) => {
    // Show Active badge only for patients with upcoming appointments
    if (hasUpcomingAppointments) {
      return upcomingCount === 1 ? "Active" : `Active (${upcomingCount})`;
    }
    
    // No status to display
    return null;
  };

  const shouldShowBadge = (hasUpcomingAppointments?: boolean) => {
    return hasUpcomingAppointments;
  };

  const handleStartExam = (patientId: number, appointmentId?: number) => {
    const params = new URLSearchParams({
      patientId: patientId.toString(),
      role: 'doctor'
    });
    
    if (appointmentId) {
      params.append('appointmentId', appointmentId.toString());
    }
    
    navigate(`/patient-exam?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAbortConsultationClick = (patient: Patient) => {
    setPatientToAbortConsultation(patient);
    setAbortReason(""); // Reset reason
    setAbortConsultationDialogOpen(true);
  };

  const handleAbortConsultation = async (patientId: number, appointmentId?: number, reason?: string) => {
    try {
      // Find the active appointment for this patient
      let activeAppointmentId = appointmentId;
      
      if (!activeAppointmentId) {
        // If no appointment ID provided, we need to find the active appointment
        // This would require an API call to get patient's active appointment
        // For now, we'll show an error
        toast({
          title: "Error",
          description: "Unable to find active appointment for this patient.",
          variant: "destructive"
        });
        return;
      }

      const response = await api.post(`/appointments/${activeAppointmentId}/abort-consultation`, {
        reason: reason || 'Aborted by staff from patient management'
      });
      
      // Update the patient in the local state
      setPatients(prev => prev.map(p => 
        p.id === patientId 
          ? { ...p, consultationStatus: null, consultationStartTime: undefined, activeAppointmentId: undefined }
          : p
      ));
      
      toast({
        title: "Consultation Aborted",
        description: `Active consultation for ${patientToAbortConsultation?.name} has been aborted successfully.`
      });
      
      // Refresh patients data to get updated state
      fetchPatients();
    } catch (error: unknown) {
      let errorMessage = "Failed to abort consultation";
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        errorMessage = (error.response.data as { error?: string }).error || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleConfirmAbortConsultation = async () => {
    if (patientToAbortConsultation) {
      await handleAbortConsultation(patientToAbortConsultation.id, patientToAbortConsultation.activeAppointmentId, abortReason);
      setAbortConsultationDialogOpen(false);
      setPatientToAbortConsultation(null);
      setAbortReason("");
    }
  };

  const handleCopyToClipboard = async (text: string, fieldId: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-medical-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
            {filteredPatients.length !== patients.length && filterType !== "all" && (
              <p className="text-sm text-gray-600">
                {filterType === "consultation" 
                  ? `Showing ${filteredPatients.length} patients with active consultations`
                  : `Showing ${filteredPatients.length} of ${patients.length} patients by ${filterType === "lastVisit" ? "last visit" : "registration"} date${dateRange.startDate === dateRange.endDate ? `: ${dateRange.startDate}` : ` range: ${dateRange.startDate} to ${dateRange.endDate}`}`
                }
              </p>
            )}
          </div>
        </div>
        <PatientFormDialog onSuccess={fetchPatients} />
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients by name, phone, condition, or ABHA ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Select value={filterType} onValueChange={(value: "lastVisit" | "createdAt" | "consultation" | "all") => setFilterType(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Show All Patients</SelectItem>
                  <SelectItem value="consultation">Active Consultations</SelectItem>
                  <SelectItem value="lastVisit">Last Visit Date</SelectItem>
                  <SelectItem value="createdAt">Registration Date</SelectItem>
                </SelectContent>
              </Select>
              {filterType !== "consultation" && filterType !== "all" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">From:</span>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="border rounded px-2 py-1"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <span className="text-sm text-gray-600">To:</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="border rounded px-2 py-1"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setDateRange({ startDate: today, endDate: today });
                    }}
                    className="text-xs"
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDateRange({ startDate: "", endDate: "" })}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && patients.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-pulse">Loading patients...</div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="p-12 text-center text-red-500">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Patient Cards */}
      {!error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {patient.name}
                      <span className="ml-2 text-xs text-gray-500 font-mono">{patient.visibleId}</span>
                      {patient.createdFromEmergency && (
                        <Badge className="ml-2 bg-red-100 text-red-700 border-red-300" variant="outline">
                          Emergency
                        </Badge>
                      )}
                      {patient.consultationStatus === 'active' && (
                        <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-300 animate-pulse" variant="outline">
                          In Consultation
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {shouldShowBadge(patient.hasUpcomingAppointments) && (
                        <Badge className={getStatusColor(patient.hasUpcomingAppointments)}>
                          {getDisplayStatus(patient.hasUpcomingAppointments, patient.upcomingAppointmentCount)}
                        </Badge>
                      )}
                      <PatientFormDialog
                        patient={patient}
                        onSuccess={fetchPatients}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{patient.age} years old • {patient.gender}</p>
                  
                  {/* ABHA Status */}
                  <div className="flex items-center justify-between mt-2">
                    <ABHAStatus 
                      abhaId={patient.abhaId} 
                      verified={patient.abhaVerified}
                    />
                    {!patient.abhaId && (
                      <ABHAModal
                        trigger={
                          <Button variant="outline" size="sm" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Add ABHA
                          </Button>
                        }
                        patientId={patient.id}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-gray-700">{patient.visibleId}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-blue-50"
                        onClick={() => handleCopyToClipboard(patient.visibleId, `id-${patient.id}`, "Patient ID")}
                      >
                        {copiedField === `id-${patient.id}` ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-blue-500" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{patient.phone}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-blue-50"
                        onClick={() => handleCopyToClipboard(patient.phone, `phone-${patient.id}`, "Phone Number")}
                      >
                        {copiedField === `phone-${patient.id}` ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-blue-500" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No visits yet'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Registered: {new Date(patient.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  {patient.consultationStatus === 'active' && patient.consultationStartTime && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                      <Clock className="h-4 w-4" />
                      <span>Consultation started: {new Date(patient.consultationStartTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ({new Date(patient.consultationStartTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})</span>
                    </div>
                  )}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-gray-700">Primary Condition</p>
                    <p className="text-sm text-medical-600">{patient.condition}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <PatientDetailsDialog
                      patient={patient}
                      trigger={
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                      }
                    />
                    <Button 
                      size="sm" 
                      className="flex-1 bg-medical-500 hover:bg-medical-600"
                      onClick={() => handleStartExam(patient.id, patient.activeAppointmentId)}
                    >
                      <Stethoscope className="h-4 w-4 mr-1" />
                      {patient.consultationStatus === 'active' ? 'Continue Consultation' : 'Consultation'}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <ScheduleDialog
                      patient={patient}
                      trigger={
                        <Button variant="outline" size="sm" className="flex-1">
                          Schedule
                        </Button>
                      }
                    />
                    <MedicalRecordsDialog
                      patient={patient}
                      trigger={
                        <Button variant="outline" size="sm" className="flex-1">
                          View Records
                        </Button>
                      }
                    />
                    {patient.consultationStatus === 'active' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleAbortConsultationClick(patient)}
                        title="Abort Consultation"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {/* ABHA Actions */}
                    {patient.abhaId && (
                      <ABHAModal
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Manage ABHA
                          </Button>
                        }
                        patientId={patient.id}
                        existingABHA={patient.abhaId}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} patients
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {!loading && !error && filteredPatients.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600">
              {patients.length === 0 
                ? "Try adjusting your search criteria or add a new patient."
                : filterType === "all"
                ? "No patients found. Try adding a new patient."
                : filterType === "consultation"
                ? "No patients with active consultations found. If you expected to see active consultations, they may have been completed or aborted."
                : `No patients found by ${filterType === "lastVisit" ? "last visit" : "registration"} date${dateRange.startDate === dateRange.endDate ? ` (${dateRange.startDate})` : ` range (${dateRange.startDate} to ${dateRange.endDate})`}. Try selecting a different date range or filter type.`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Abort Consultation Dialog */}
      {abortConsultationDialogOpen && patientToAbortConsultation && (
        <AlertDialog open={abortConsultationDialogOpen} onOpenChange={setAbortConsultationDialogOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Abort Active Consultation
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to abort the active consultation for <strong>{patientToAbortConsultation.name}</strong>?
                <br />
                <br />
                This will mark the consultation as aborted and clear the patient's active consultation status.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Reason for aborting (optional):
              </label>
              <Select value={abortReason} onValueChange={setAbortReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Patient didn't show up">Patient didn't show up</SelectItem>
                  <SelectItem value="Wrong patient selected">Wrong patient selected</SelectItem>
                  <SelectItem value="Patient left early">Patient left early</SelectItem>
                  <SelectItem value="Technical issues">Technical issues</SelectItem>
                  <SelectItem value="Emergency interruption">Emergency interruption</SelectItem>
                  <SelectItem value="Staff error">Staff error</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Consultation Active</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmAbortConsultation}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Abort Consultation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Auto-open Medical Records Dialog from Reports navigation */}
      {autoOpenMedicalRecords.patient && (
        <MedicalRecordsDialog
          patient={autoOpenMedicalRecords.patient}
          defaultActiveTab={autoOpenMedicalRecords.activeTab}
          prescriptionToOpen={autoOpenMedicalRecords.prescriptionToOpen}
          trigger={null}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setAutoOpenMedicalRecords({ patient: null, activeTab: 'prescriptions' });
            }
          }}
        />
      )}
    </div>
  );
};

export default Patients;
