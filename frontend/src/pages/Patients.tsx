import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Phone, Mail, Calendar, Shield, Edit, Stethoscope } from "lucide-react";
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
}

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(9); // 3x3 grid
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  });
  const [filterType, setFilterType] = useState<"lastVisit" | "createdAt" | "all">("lastVisit");
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

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
    } else {
      // Search with debounce
      const debounceTimer = setTimeout(() => {
        fetchPatients(searchTerm || undefined);
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm]);

  // Filter patients based on selectedDate and filterType
  const filteredPatients = patients.filter(patient => {
    if (filterType === "all") {
      return true; // Show all patients
    } else if (filterType === "lastVisit") {
      if (!patient.lastVisit) return false; // Skip patients with no last visit
      const patientDate = patient.lastVisit.split('T')[0];
      return patientDate === selectedDate;
    } else {
      // filterType === "createdAt"
      const patientDate = patient.createdAt.split('T')[0];
      return patientDate === selectedDate;
    }
  });

  // Calculate pagination for filtered patients
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Recovery": return "bg-blue-100 text-blue-800";
      case "Critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleStartExam = (patientId: number) => {
    navigate(`/patient-exam?patientId=${patientId}&role=doctor`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                Showing {filteredPatients.length} of {patients.length} patients by {filterType === "lastVisit" ? "last visit" : "registration"} date: {selectedDate}
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
              <Select value={filterType} onValueChange={(value: "lastVisit" | "createdAt") => setFilterType(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Show All Patients</SelectItem>
                  <SelectItem value="lastVisit">Last Visit Date</SelectItem>
                  <SelectItem value="createdAt">Registration Date</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border rounded px-2 py-1"
                max={new Date().toISOString().split('T')[0]}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-xs"
              >
                Today
              </Button>
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
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(patient.status)}>
                        {patient.status}
                      </Badge>
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
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{patient.phone}</span>
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
                    {patient.createdFromEmergency && (
                      <Badge className="ml-1 bg-red-100 text-red-700 border-red-300" variant="outline">
                        Emergency
                      </Badge>
                    )}
                  </div>
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
                      onClick={() => handleStartExam(patient.id)}
                    >
                      <Stethoscope className="h-4 w-4 mr-1" />
                      Start Exam
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
                    {/* ABHA Actions */}
                    {patient.abhaId && (
                      <>
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
                        <MedicalRecordsDialog
                          patient={patient}
                          trigger={
                            <Button variant="outline" size="sm" className="flex-1 text-xs">
                              View Records
                            </Button>
                          }
                        />
                      </>
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
                : `No patients found by ${filterType === "lastVisit" ? "last visit" : "registration"} date (${selectedDate}). Try selecting a different date or filter type.`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Patients;
