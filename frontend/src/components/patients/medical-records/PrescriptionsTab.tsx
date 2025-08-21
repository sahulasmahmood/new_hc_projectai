import { useState, useEffect, useRef } from "react";
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
import { format } from "date-fns";

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
  onDeletePrescription: (prescriptionId: number) => void;
  onDownloadReport: (type: string, format?: string) => void;
  getStatusBadge: (status: string) => string;
  patientName: string;
  patientId: string;
}

const PrescriptionsTab = ({
  prescriptions,
  onDeletePrescription,
  onDownloadReport,
  getStatusBadge,
  patientName,
  patientId,
}: PrescriptionsTabProps) => {
  const [showAllPrescriptions, setShowAllPrescriptions] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const handlePrint = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsPrinting(true);

    // Wait for the modal to be rendered
    setTimeout(() => {
      if (printContainerRef.current) {
        window.print();
        setIsPrinting(false);
        setSelectedPrescription(null);
      }
    }, 100);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          size: A4;
          margin: 15mm;
        }
        
        body * {
          visibility: hidden;
        }
        
        .print-section,
        .print-section * {
          visibility: visible !important;
        }
        
        .print-section {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          background-color: white !important;
          color: black !important;
        }

        .no-print, 
        .no-print * {
          display: none !important;
        }

        .print-section button,
        .print-section [role="dialog"],
        .print-section .close-button {
          display: none !important;
        }

        /* Professional Print Styles */
        .print-prescription-content {
          font-size: 11pt;
          line-height: 1.4;
          font-family: 'Arial', sans-serif !important;
          color: black !important;
        }

        .print-prescription-content h1 {
          font-size: 20pt !important;
          color: #2563eb !important;
        }

        .print-prescription-content h2,
        .print-prescription-content h3 {
          color: #2563eb !important;
        }

        .print-prescription-content p {
          margin-bottom: 0.4em !important;
        }

        /* Borders and Dividers */
        .border-medical-600 {
          border-color: #2563eb !important;
        }

        .border-medical-200 {
          border-color: #e5e7eb !important;
        }

        /* Background Colors */
        .bg-gray-50 {
          background-color: #f9fafb !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Text Colors */
        .text-medical-600,
        .text-medical-700 {
          color: #2563eb !important;
        }

        .text-gray-600,
        .text-gray-700 {
          color: #4b5563 !important;
        }

        /* Spacing and Layout */
        .mb-1 { margin-bottom: 0.25rem !important; }
        .mb-2 { margin-bottom: 0.5rem !important; }
        .mb-4 { margin-bottom: 1rem !important; }
        .mb-6 { margin-bottom: 1.5rem !important; }
        .mt-8 { margin-top: 2rem !important; }

        /* Footer Styles */
        .print-prescription-footer {
          margin-top: 2rem !important;
          padding-top: 1rem !important;
          border-top: 1px solid #e5e7eb !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);



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
                                onClick={() => handlePrint(prescription)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Print Prescription</p>
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

      {/* Use PrescriptionViewModal directly - EXACT same functionality */}
      {selectedPrescription && (
        <div className={isPrinting ? "print-section" : ""} ref={printContainerRef}>
          {isPrinting ? (
            <div className="print-prescription-content p-8 max-w-4xl mx-auto">
              {/* Clinic Header */}
              <div className="text-center mb-6 border-b-2 border-medical-600 pb-4">
                <h1 className="text-2xl font-bold text-medical-600 mb-1">AI-MEDICO HEALTHCARE</h1>
                <p className="text-sm text-gray-600 mb-1">Multi-Specialty Hospital & Research Center</p>
                <p className="text-sm text-gray-600">License No: MCI-123456</p>
                <div className="flex justify-center items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>📞 Emergency: +91-XXX-XXXX</span>
                  <span>|</span>
                  <span>🏥 24x7 Care</span>
                </div>
              </div>

              {/* Prescription Title & Date */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-medical-600">Medical Prescription</h2>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Date: {format(new Date(selectedPrescription.date), 'dd MMM yyyy')}</p>
                  <p className="text-sm text-gray-600">Time: {format(new Date(selectedPrescription.date), 'hh:mm a')}</p>
                </div>
              </div>

              {/* Patient Details */}
              <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">PATIENT INFORMATION</h3>
                  <p className="mb-1"><span className="font-semibold">Name:</span> {selectedPrescription.patientName || patientName}</p>
                  <p className="mb-1"><span className="font-semibold">Patient ID:</span> {selectedPrescription.patientVisibleId || patientId}</p>
                  {selectedPrescription.patientAge && <p className="mb-1"><span className="font-semibold">Age:</span> {selectedPrescription.patientAge} years</p>}
                  {selectedPrescription.patientGender && <p><span className="font-semibold">Gender:</span> {selectedPrescription.patientGender}</p>}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">CONSULTATION DETAILS</h3>
                  <p className="mb-1"><span className="font-semibold">Doctor:</span> Dr. {selectedPrescription.doctorName}</p>
                  {selectedPrescription.chiefComplaint && (
                    <p className="mb-1"><span className="font-semibold">Chief Complaint:</span> {selectedPrescription.chiefComplaint}</p>
                  )}
                </div>
              </div>

              {/* Rx Symbol and Medications */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <span className="text-2xl font-serif italic mr-2">℞</span>
                  <h3 className="text-lg font-semibold text-medical-600">Medications</h3>
                </div>
                <div className="pl-6 border-l-2 border-medical-200">
                  {selectedPrescription.medications.map((med, index) => (
                    <div key={med.id} className="mb-4 last:mb-0">
                      <p className="font-medium text-medical-700">
                        {index + 1}. {med.medicineName}
                      </p>
                      <div className="ml-5 text-gray-600 flex gap-4 mt-1">
                        <span>💊 {med.dosage}</span>
                        <span>⏰ {med.frequency}</span>
                        <span>📅 {med.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investigations */}
              {selectedPrescription.investigations && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-medical-600 mb-2">Investigations Required</h3>
                  <div className="pl-6 border-l-2 border-medical-200">
                    <p className="text-gray-700">{selectedPrescription.investigations}</p>
                  </div>
                </div>
              )}

              {/* Notes & Advice */}
              {(selectedPrescription.doctorNotes || selectedPrescription.advice) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-medical-600 mb-2">Clinical Notes & Advice</h3>
                  <div className="pl-6 border-l-2 border-medical-200">
                    {selectedPrescription.doctorNotes && <p className="text-gray-700 mb-2">{selectedPrescription.doctorNotes}</p>}
                    {selectedPrescription.advice && <p className="text-gray-700">{selectedPrescription.advice}</p>}
                  </div>
                </div>
              )}

              {/* Footer with Signature */}
              <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-end">
                  <div className="text-xs text-gray-500">
                    <p>Please follow the prescribed medication schedule carefully</p>
                    <p>For any emergency, contact: +91-XXX-XXXX</p>
                  </div>
                  <div className="text-right">
                    {selectedPrescription.doctorSignature ? (
                      <img 
                        src={selectedPrescription.doctorSignature} 
                        alt="Doctor's Signature" 
                        className="inline-block h-16 mb-1"
                      />
                    ) : (
                      <div className="h-16 mb-1 border-b-2 border-gray-400 w-40"></div>
                    )}
                    <p className="font-semibold">Dr. {selectedPrescription.doctorName}</p>
                    <p className="text-sm text-gray-600">Reg. No: XXXXX</p>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
                <p>This is a digital copy of the prescription. For verification, please contact the hospital.</p>
                <p className="mt-1">AI-MEDICO HEALTHCARE - Where Care Meets Excellence</p>
              </div>
            </div>
          ) : (
            <PrescriptionViewModal
              prescription={selectedPrescription}
              onClose={() => setSelectedPrescription(null)}
            />
          )}
        </div>
      )}
    </>
  );
};

export default PrescriptionsTab;