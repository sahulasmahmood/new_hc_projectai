import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface PrescriptionViewModalProps {
  prescription: {
    id: number;
    createdAt: string;
    chiefComplaint?: string;
    investigations?: string;
    doctorNotes?: string;
    advice?: string;
    doctorName: string;
    doctorSignature?: string;
    // Direct patient fields (stored in prescription)
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
    // Keep old patient relation for backward compatibility
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
  };
  onClose: () => void;
}

const PrescriptionViewModal = ({ prescription, onClose }: PrescriptionViewModalProps) => {
  const [hospitalInfo, setHospitalInfo] = useState<{
    name?: string;
    phone?: string;
    license?: string;
    address?: string;
  } | null>(null);
  const [loadingHospitalInfo, setLoadingHospitalInfo] = useState(true);

  // Fetch hospital information
  useEffect(() => {
    const fetchHospitalInfo = async () => {
      try {
        const response = await api.get('/settings/hospital-settings');
        setHospitalInfo(response.data);
      } catch (error) {
        console.error('Error fetching hospital settings:', error);
        setHospitalInfo({
          name: "MEDICAL CLINIC",
          phone: "Emergency: Not Configured",
          license: "Please configure in Hospital Settings"
        });
      } finally {
        setLoadingHospitalInfo(false);
      }
    };

    fetchHospitalInfo();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDownload = () => {
    // Create HTML content for download
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${prescription.patientName || prescription.patient?.name || 'Patient'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: white; color: black; }
            .prescription { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0 0 10px 0; font-size: 24px; font-weight: bold; }
            .patient-info { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
            .medications-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .medications-table th, .medications-table td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
            .medications-table th { background-color: #f5f5f5; font-weight: bold; }
            .signature-section { display: flex; justify-content: space-between; align-items: end; margin-top: 30px; padding-top: 15px; border-top: 1px solid #000; }
            .signature img { max-height: 60px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="prescription">
            <div class="header">
              <h1>${hospitalInfo?.name?.toUpperCase() || "MEDICAL CLINIC"}</h1>
              ${hospitalInfo?.phone ? `<p>Emergency: ${hospitalInfo.phone}</p>` : ''}
              ${hospitalInfo?.license ? `<p>Lic. No.: ${hospitalInfo.license}</p>` : ''}
            </div>
            <div class="patient-info">
              <div><strong>Patient:</strong> ${prescription.patientName || prescription.patient?.name || 'N/A'} (${prescription.patientVisibleId || prescription.patient?.visibleId || 'N/A'})<br>
                   <strong>Age/Gender:</strong> ${prescription.patientAge || prescription.patient?.age || 'N/A'} years • ${prescription.patientGender || prescription.patient?.gender || 'N/A'}</div>
              <div><strong>Date:</strong> ${formatDate(prescription.createdAt)}<br>
                   <strong>Doctor:</strong> ${prescription.doctorName}</div>
            </div>
            ${prescription.chiefComplaint ? `<div class="section"><div class="section-title">Chief Complaints & Diagnosis:</div><p>${prescription.chiefComplaint}</p></div>` : ''}
            <div class="section">
              <div class="section-title">Medications:</div>
              ${prescription.medications.length > 0 ? `
                <table class="medications-table">
                  <thead><tr><th>Medicine Name</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
                  <tbody>${prescription.medications.map(med => `<tr><td>${med.medicineName}</td><td>${med.dosage}</td><td>${med.frequency}</td><td>${med.duration}</td></tr>`).join('')}</tbody>
                </table>` : '<p>No medications prescribed</p>'}
            </div>
            ${prescription.investigations ? `<div class="section"><div class="section-title">Investigations:</div><p>${prescription.investigations}</p></div>` : ''}
            ${prescription.doctorNotes ? `<div class="section"><div class="section-title">Doctor Notes:</div><p>${prescription.doctorNotes}</p></div>` : ''}
            ${prescription.advice ? `<div class="section"><div class="section-title">Advice:</div><p>${prescription.advice}</p></div>` : ''}
            <div class="signature-section">
              <div><div style="font-size: 12px; margin-bottom: 5px;">Doctor Signature:</div>
                ${prescription.doctorSignature && prescription.doctorSignature.startsWith('data:image') ? 
                  `<img src="${prescription.doctorSignature}" alt="Doctor Signature" />` :
                  `<div style="font-style: italic; font-size: 16px;">${prescription.doctorName}</div>`}
              </div>
              <div><div style="font-size: 12px; margin-bottom: 5px;">Date:</div><div style="font-weight: bold;">${formatDate(prescription.createdAt)}</div></div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create and download file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prescription_${prescription.patientName || prescription.patient?.name || 'Patient'}_${formatDate(prescription.createdAt)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          .prescription-content { 
            background: white !important; 
            color: black !important;
            font-size: 12px !important;
          }
          .prescription-content .border-gray-300 { border-color: #000 !important; }
          .prescription-content .text-gray-600 { color: #333 !important; }
          .prescription-content .bg-gray-50 { background: #f9f9f9 !important; }
        }
      `}</style>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto prescription-content">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-medical-500" />
              Prescription Details
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-gray-300">
            <CardContent className="p-8">
              {/* Hospital Header */}
              <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
                {loadingHospitalInfo ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                      {hospitalInfo?.name?.toUpperCase() || "MEDICAL CLINIC"}
                    </h1>
                    <div className="text-xs text-gray-600">
                      <div className="flex flex-wrap justify-center gap-2">
                        {hospitalInfo?.phone && (
                          <span>Emergency: {hospitalInfo.phone}</span>
                        )}
                        {hospitalInfo?.phone && hospitalInfo?.license && <span>|</span>}
                        {hospitalInfo?.license && (
                          <span>Lic. No.: {hospitalInfo.license}</span>
                        )}
                        {(!hospitalInfo?.phone && !hospitalInfo?.license) && (
                          <span className="text-orange-600">Please configure Hospital Information in Settings</span>
                        )}
                      </div>
                      {hospitalInfo?.address && (
                        <div className="mt-1 text-xs text-gray-500">
                          {hospitalInfo.address}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Patient Info */}
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
                <div>
                  <h2 className="text-base font-semibold">
                    Patient: {prescription.patientName || prescription.patient?.name || 'Patient information not available'}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    {(prescription.patientName || prescription.patient) ? (
                      <>
                        <p className="text-xs text-gray-600">
                          ID: {prescription.patientVisibleId || prescription.patient?.visibleId}
                        </p>
                        <p className="text-xs text-gray-600">
                          {prescription.patientAge || prescription.patient?.age} years • {prescription.patientGender || prescription.patient?.gender}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-orange-600">
                        Patient details not loaded - please refresh or contact support
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Date: {formatDate(prescription.createdAt)}</p>
                  <p className="text-xs text-gray-600">Doctor: {prescription.doctorName}</p>
                </div>
              </div>

              {/* Form Sections - Compact Layout */}
              <div className="space-y-4">
                {/* Chief Complaints & Diagnosis */}
                {prescription.chiefComplaint && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chief Complaints & Diagnosis:
                    </label>
                    <div className="p-2 border border-gray-300 rounded bg-gray-50 text-sm">
                      {prescription.chiefComplaint}
                    </div>
                  </div>
                )}

                {/* Medication */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medication:
                  </label>
                  
                  {prescription.medications.length > 0 ? (
                    <div className="border border-gray-300 rounded">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Medicine Name</th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Dosage</th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Frequency</th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescription.medications.map((med) => (
                            <tr key={med.id} className="border-t border-gray-200">
                              <td className="px-2 py-1 text-sm">{med.medicineName}</td>
                              <td className="px-2 py-1 text-sm">{med.dosage}</td>
                              <td className="px-2 py-1 text-sm">{med.frequency}</td>
                              <td className="px-2 py-1 text-sm">{med.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-2 border border-gray-300 rounded bg-gray-50 text-sm text-gray-500">
                      No medications prescribed
                    </div>
                  )}
                </div>

                {/* Two Column Layout for remaining sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Investigations / Lab Tests */}
                  {prescription.investigations && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Investigations / Lab Tests:
                      </label>
                      <div className="p-2 border border-gray-300 rounded bg-gray-50 text-sm">
                        {prescription.investigations}
                      </div>
                    </div>
                  )}

                  {/* Doctor Notes */}
                  {prescription.doctorNotes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Doctor Notes:
                      </label>
                      <div className="p-2 border border-gray-300 rounded bg-gray-50 text-sm">
                        {prescription.doctorNotes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Advice & Follow-Up */}
                {prescription.advice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Advice & Follow-Up:
                    </label>
                    <div className="p-2 border border-gray-300 rounded bg-gray-50 text-sm">
                      {prescription.advice}
                    </div>
                  </div>
                )}
              </div>

              {/* Signature Section - Only show if digital signature exists */}
              {prescription.doctorSignature && prescription.doctorSignature.startsWith('data:image') && (
                <div className="flex justify-between items-end mt-6 pt-4 border-t border-gray-300">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Doctor Signature:</div>
                    <div className="space-y-2">
                      <img 
                        src={prescription.doctorSignature} 
                        alt="Doctor Signature" 
                        className="h-16 border border-gray-200 bg-white rounded"
                      />
                      <div className="text-xs text-green-600">✓ Verified Digital Signature</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Date:</div>
                    <div className="font-medium">{formatDate(prescription.createdAt)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default PrescriptionViewModal;