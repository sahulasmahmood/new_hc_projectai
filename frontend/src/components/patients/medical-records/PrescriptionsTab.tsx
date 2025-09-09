import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pill,
  Calendar,
  Download,
  Eye,
  Printer,
} from "lucide-react";
import PrescriptionViewModal from "@/components/prescription/PrescriptionViewModal";
import PrescriptionPrintTemplate from "@/components/prescription/PrescriptionPrintTemplate";
import { downloadPrescriptionPDF } from "@/components/prescription/PrescriptionPDF";

interface Prescription {
  id: number;
  date: string;
  createdAt: string;
  doctorName: string;
  doctorSignature?: string;
  chiefComplaint?: string;
  medications: Array<{
    id: number;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  investigations?: string;
  doctorNotes?: string;
  advice?: string;
  // Direct patient fields (stored in prescription)
  patientName?: string;
  patientVisibleId?: string;
  patientAge?: number;
  patientGender?: string;
  // Keep old patient relation for backward compatibility
  patient?: {
    name: string;
    visibleId: string;
    age: number;
    gender: string;
  };
}

interface PrescriptionsTabProps {
  prescriptions: Prescription[];
  onDownloadReport: (type: string, format?: string) => void;
  patientName: string;
  patientId: string;
}

const PrescriptionsTab = ({
  prescriptions,
  onDownloadReport,
  patientName,
  patientId,
}: PrescriptionsTabProps) => {
  const [showAllPrescriptions, setShowAllPrescriptions] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionToPrint, setPrescriptionToPrint] = useState<Prescription | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);

  // Fetch hospital info for print header
  useEffect(() => {
    const fetchHospitalInfo = async () => {
      try {
        const res = await (await import('@/lib/api')).default.get('/settings/hospital-settings');
        setHospitalInfo(res.data);
      } catch (e) {
        setHospitalInfo({
          name: 'MEDICAL CLINIC',
          address: '',
          phone: '',
          license: '',
        });
      }
    };
    fetchHospitalInfo();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Prescription-${prescriptionToPrint?.id || 'Unknown'}`,
    onAfterPrint: () => setPrescriptionToPrint(null),
  });

  const triggerPrint = (prescription: Prescription) => {
    setPrescriptionToPrint(prescription);
    // Small delay to ensure state is updated before printing
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const handleDownloadPDF = async (prescription: Prescription) => {
    if (hospitalInfo) {
      await downloadPrescriptionPDF(prescription, hospitalInfo, patientName, patientId);
    }
  };

  // No need for complex CSS print styles anymore - react-to-print handles this



  const RECENT_LIMIT = 5;
  const displayedPrescriptions = showAllPrescriptions
    ? prescriptions
    : prescriptions.slice(0, RECENT_LIMIT);
  const hasMorePrescriptions = prescriptions.length > RECENT_LIMIT;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Prescription History
              <span className="text-sm font-normal text-gray-500">
                (
                {showAllPrescriptions
                  ? prescriptions.length
                  : Math.min(prescriptions.length, RECENT_LIMIT)}{" "}
                of {prescriptions.length})
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadReport("prescriptions")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No prescriptions recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Chief Complaint</TableHead>
                  <TableHead>Medications</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="font-medium">
                        {new Date(prescription.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        Dr. {prescription.doctorName}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div
                        className="truncate"
                        title={prescription.chiefComplaint}
                      >
                        {prescription.chiefComplaint || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-sm">
                      {prescription.medications.length > 0 ? (
                        <div className="space-y-1">
                          {prescription.medications.slice(0, 2).map((med) => (
                            <div key={med.id} className="text-sm">
                              <span className="font-medium">
                                {med.medicineName}
                              </span>
                              <span className="text-gray-500 ml-2">
                                {med.dosage} • {med.frequency}
                              </span>
                            </div>
                          ))}
                          {prescription.medications.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{prescription.medications.length - 2} more
                              medications
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">No medications</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div
                        className="truncate text-sm"
                        title={prescription.doctorNotes || prescription.advice}
                      >
                        {prescription.doctorNotes ||
                          prescription.advice ||
                          "No notes"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPrescription(prescription)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Full Prescription</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => triggerPrint(prescription)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Print Prescription</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(prescription)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download PDF</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Show All / Show Recent Toggle */}
          {hasMorePrescriptions && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllPrescriptions(!showAllPrescriptions)}
                className="text-medical-600 hover:text-medical-700"
              >
                {showAllPrescriptions ? (
                  <>Show Recent Only ({RECENT_LIMIT})</>
                ) : (
                  <>Show All Prescriptions ({prescriptions.length})</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      {selectedPrescription && (
        <PrescriptionViewModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}

      {/* Hidden Print Template */}
      <div style={{ display: 'none' }}>
        {prescriptionToPrint && hospitalInfo && (
          <PrescriptionPrintTemplate
            ref={printRef}
            prescription={prescriptionToPrint}
            hospitalInfo={hospitalInfo}
            patientName={patientName}
            patientId={patientId}
          />
        )}
      </div>
    </>
  );
};

export default PrescriptionsTab;