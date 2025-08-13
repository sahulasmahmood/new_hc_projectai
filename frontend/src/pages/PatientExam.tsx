
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Clock, FileText, Eye, Lock } from "lucide-react";
import VitalsPanel from "@/components/exam/VitalsPanel";
import PatientInfo from "@/components/exam/PatientInfo";
import NursePanel from "@/components/exam/NursePanel";
import PrescriptionForm from "@/components/prescription/PrescriptionForm";
import PrescriptionViewModal from "@/components/prescription/PrescriptionViewModal";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PatientExam = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || '1';
  const userRole = searchParams.get('role') || 'doctor'; // doctor or nurse
  const appointmentId = searchParams.get('appointmentId');
  const { toast } = useToast();
  
  interface Patient {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    condition: string;
    allergies: string[];
    emergencyContact: string;
    emergencyPhone: string;
    roomNumber?: string; // Optional for NursePanel
    visibleId?: string;
    medicalReports?: Array<{
      id: number;
      filePath: string;
      description?: string;
      uploadedAt: string;
    }>;
    lastVisit?: string;
    consultationStatus?: string;
  }

  interface Prescription {
    id: number;
    createdAt: string;
    chiefComplaint?: string;
    investigations?: string;
    doctorNotes?: string;
    advice?: string;
    doctorName: string;
    doctorSignature?: string;
    patientName?: string;
    patientVisibleId?: string;
    patientAge?: number;
    patientGender?: string;
    medications: Array<{
      id: number;
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    patient?: {
      name: string;
      visibleId: string;
      age: number;
      gender: string;
    };
    appointment?: {
      date: string;
      time: string;
      type: string;
    };
  }

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showAllPrescriptions, setShowAllPrescriptions] = useState(false);

  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const [patientResponse, prescriptionsResponse] = await Promise.all([
          api.get(`/patients/${patientId}`),
          api.get(`/prescriptions/patient/${patientId}`)
        ]);
        
        setSelectedPatient(patientResponse.data);
        setPrescriptions(prescriptionsResponse.data);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, toast]);

  const handlePrescriptionSaved = (newPrescription: Prescription) => {
    setPrescriptions(prev => [newPrescription, ...prev]);
    // Refresh patient data to update consultation status
    setSelectedPatient((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        consultationStatus: 'completed'
      };
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500"></div>
        <span className="ml-3">Loading patient data...</span>
      </div>
    );
  }

  if (!selectedPatient) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Patient not found</h3>
            <p className="text-gray-500">The requested patient could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPriorityBadge = (condition: string) => {
    const priority = condition === "Hypertension" ? "medium" : "low";
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800", 
      low: "bg-green-100 text-green-800"
    };
    return colors[priority as keyof typeof colors];
  };

  if (userRole === 'nurse') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-medical-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nurse Station - Patient Care</h1>
              <p className="text-gray-600">Patient: {selectedPatient.name}</p>
            </div>
          </div>
          <Badge className={getPriorityBadge(selectedPatient.condition)}>
            {selectedPatient.condition}
          </Badge>
        </div>

        <NursePanel patient={{
          ...selectedPatient,
          roomNumber: selectedPatient.roomNumber || 'N/A'
        }} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-medical-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Consultation</h1>
            <p className="text-gray-600">Consultation and prescription management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      <PatientInfo patient={selectedPatient} />

      <Tabs defaultValue="vitals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vitals">Vitals (Optional)</TabsTrigger>
          <TabsTrigger value="prescription">Prescription</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals">
          <VitalsPanel 
            patientId={selectedPatient.id} 
            appointmentId={appointmentId || undefined}
          />
        </TabsContent>

        <TabsContent value="prescription">
          <div className="space-y-6">
            {selectedPatient.consultationStatus === 'active' ? (
              <>
                {/* Previous Prescriptions - Always show during consultation for reference */}
                {prescriptions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FileText className="h-4 w-4 text-medical-500" />
                          Previous Prescriptions (For Reference)
                        </CardTitle>
                        {prescriptions.length > 2 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowAllPrescriptions(!showAllPrescriptions)}
                            className="text-xs"
                          >
                            {showAllPrescriptions ? 'Show Less' : `Show All (${prescriptions.length})`}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {(showAllPrescriptions ? prescriptions : prescriptions.slice(0, 2)).map((prescription) => (
                          <div 
                            key={prescription.id}
                            className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => setSelectedPrescription(prescription)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="font-medium text-sm">
                                  {new Date(prescription.createdAt).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {prescription.medications.length} med(s)
                                </div>
                              </div>
                              {prescription.chiefComplaint && (
                                <div className="text-xs text-gray-500 truncate mt-1">
                                  {prescription.chiefComplaint}
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* New Prescription Form - During active consultation */}
                <PrescriptionForm 
                  patientId={selectedPatient.id} 
                  patientName={selectedPatient.name}
                  appointmentId={appointmentId || undefined}
                  onSave={handlePrescriptionSaved}
                />
              </>
            ) : (
              // Show only prescription history if consultation is not active
              <div className="space-y-4">
                {/* No Active Consultation Message */}
                <Card>
                  <CardContent className="p-6 text-center">
                    <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Active Consultation
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start a consultation from the appointments page to create a new prescription.
                    </p>
                    {selectedPatient.consultationStatus === 'completed' && (
                      <Badge className="bg-green-100 text-green-800">
                        Last consultation completed
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Previous Prescriptions - View only when no active consultation */}
                {prescriptions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Previous Prescriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {prescriptions.map((prescription) => (
                          <div 
                            key={prescription.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedPrescription(prescription)}
                          >
                            <div>
                              <div className="font-medium">
                                {new Date(prescription.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-sm text-gray-600">
                                {prescription.medications.length} medication(s) prescribed
                              </div>
                              {prescription.chiefComplaint && (
                                <div className="text-sm text-gray-500 truncate max-w-md">
                                  {prescription.chiefComplaint}
                                </div>
                              )}
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {prescriptions.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Prescriptions Yet
                      </h3>
                      <p className="text-gray-600">
                        This patient has no prescription history.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Prescription View Modal */}
      {selectedPrescription && (
        <PrescriptionViewModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}
    </div>
  );
};

export default PatientExam;
