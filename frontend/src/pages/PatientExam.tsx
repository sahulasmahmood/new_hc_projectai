
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, User, Clock, AlertTriangle } from "lucide-react";
import VitalsPanel from "@/components/exam/VitalsPanel";
import ExaminationNotes from "@/components/exam/ExaminationNotes";
import MedicalHistory from "@/components/exam/MedicalHistory";
import DiagnosticTools from "@/components/exam/DiagnosticTools";
import PatientInfo from "@/components/exam/PatientInfo";
import NursePanel from "@/components/exam/NursePanel";

const PatientExam = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || '1';
  const userRole = searchParams.get('role') || 'doctor'; // doctor or nurse
  
  const [selectedPatient] = useState({
    id: patientId,
    name: "John Smith",
    age: 45,
    gender: "Male",
    mrn: "MRN001234",
    phone: "+1 (555) 123-4567",
    email: "john.smith@email.com",
    condition: "Hypertension",
    admissionDate: "2024-01-15",
    roomNumber: "A-204",
    allergies: ["Penicillin", "Shellfish"],
    emergencyContact: "Jane Smith - Wife",
    emergencyPhone: "+1 (555) 987-6543"
  });

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

        <NursePanel patient={selectedPatient} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-medical-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Examination Panel</h1>
            <p className="text-gray-600">Comprehensive patient assessment and care</p>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="examination">Examination</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals">
          <VitalsPanel patientId={selectedPatient.id} />
        </TabsContent>

        <TabsContent value="examination">
          <ExaminationNotes patientId={selectedPatient.id} />
        </TabsContent>

        <TabsContent value="history">
          <MedicalHistory patientId={selectedPatient.id} />
        </TabsContent>

        <TabsContent value="diagnostics">
          <DiagnosticTools patientId={selectedPatient.id} />
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-medical-500" />
                Clinical Notes & Observations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  className="w-full h-32 p-3 border rounded-md"
                  placeholder="Enter clinical observations, treatment notes, and patient response..."
                />
                <div className="flex justify-end">
                  <button className="px-4 py-2 bg-medical-500 text-white rounded-md hover:bg-medical-600">
                    Save Notes
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientExam;
