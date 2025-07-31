
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import MedicalRecordsHeader from "./medical-records/MedicalRecordsHeader";
import VisitsTab from "./medical-records/VisitsTab";
import PrescriptionsTab from "./medical-records/PrescriptionsTab";
import LabResultsTab from "./medical-records/LabResultsTab";

interface MedicalRecordsDialogProps {
  patient: any;
  trigger?: React.ReactNode;
}

const MedicalRecordsDialog = ({ patient, trigger }: MedicalRecordsDialogProps) => {
  // Mock medical records data
  const [medicalRecords, setMedicalRecords] = useState({
    visits: [
      {
        id: 1,
        date: "2024-01-15",
        doctor: "Dr. Smith",
        diagnosis: "Routine checkup",
        treatment: "Blood pressure monitoring",
        notes: "Patient showing improvement in BP control"
      },
      {
        id: 2,
        date: "2024-01-10",
        doctor: "Dr. Johnson",
        diagnosis: "Hypertension follow-up",
        treatment: "Medication adjustment",
        notes: "Increased dosage of Lisinopril"
      }
    ],
    prescriptions: [
      {
        id: 1,
        date: "2024-01-15",
        medication: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        doctor: "Dr. Smith",
        status: "Active"
      },
      {
        id: 2,
        date: "2024-01-10",
        medication: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        doctor: "Dr. Johnson",
        status: "Completed"
      }
    ],
    labResults: [
      {
        id: 1,
        date: "2024-01-15",
        test: "Blood Pressure",
        result: "135/85 mmHg",
        range: "Normal: <120/80",
        status: "High"
      },
      {
        id: 2,
        date: "2024-01-15",
        test: "Blood Sugar",
        result: "95 mg/dL",
        range: "Normal: 70-100",
        status: "Normal"
      },
      {
        id: 3,
        date: "2024-01-10",
        test: "Cholesterol",
        result: "180 mg/dL",
        range: "Normal: <200",
        status: "Normal"
      }
    ]
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      "Active": "bg-green-100 text-green-800",
      "Completed": "bg-blue-100 text-blue-800",
      "High": "bg-red-100 text-red-800",
      "Normal": "bg-green-100 text-green-800",
      "Low": "bg-yellow-100 text-yellow-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleDeleteVisit = (visitId: number) => {
    setMedicalRecords(prev => ({
      ...prev,
      visits: prev.visits.filter(visit => visit.id !== visitId)
    }));
  };

  const handleDeletePrescription = (prescriptionId: number) => {
    setMedicalRecords(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(prescription => prescription.id !== prescriptionId)
    }));
  };

  const handleDownloadReport = (type: string) => {
    console.log(`Downloading ${type} report for ${patient.name}`);
    // Implementation for downloading reports
  };

  const handlePrintReport = (type: string) => {
    console.log(`Printing ${type} report for ${patient.name}`);
    // Implementation for printing reports
  };

  const handleShareReport = (type: string) => {
    console.log(`Sharing ${type} report for ${patient.name}`);
    // Implementation for sharing reports
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            View Records
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <MedicalRecordsHeader
          patientName={patient.name}
          onDownloadReport={handleDownloadReport}
          onPrintReport={handlePrintReport}
          onShareReport={handleShareReport}
        />

        <Tabs defaultValue="visits" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visits">Medical Visits</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="labs">Lab Results</TabsTrigger>
          </TabsList>

          <TabsContent value="visits">
            <VisitsTab
              visits={medicalRecords.visits}
              onDeleteVisit={handleDeleteVisit}
              onDownloadReport={handleDownloadReport}
            />
          </TabsContent>

          <TabsContent value="prescriptions">
            <PrescriptionsTab
              prescriptions={medicalRecords.prescriptions}
              onDeletePrescription={handleDeletePrescription}
              onDownloadReport={handleDownloadReport}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          <TabsContent value="labs">
            <LabResultsTab
              labResults={medicalRecords.labResults}
              onDownloadReport={handleDownloadReport}
              onPrintReport={handlePrintReport}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MedicalRecordsDialog;
