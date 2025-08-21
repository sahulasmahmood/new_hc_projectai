
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { FileText, Loader2 } from "lucide-react";
import MedicalRecordsHeader from "./medical-records/MedicalRecordsHeader";
import VisitsTab from "./medical-records/VisitsTab";
import PrescriptionsTab from "./medical-records/PrescriptionsTab";
import api from "@/lib/api";

interface MedicalRecordsDialogProps {
  patient: unknown;
  trigger?: React.ReactNode;
}

const MedicalRecordsDialog = ({ patient, trigger }: MedicalRecordsDialogProps) => {
  const [medicalRecords, setMedicalRecords] = useState({
    visits: [],
    prescriptions: []
  });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch real medical records data
  const fetchMedicalRecords = useCallback(async () => {
    if (!patient?.id) {
      console.error('No patient ID provided');
      return;
    }
    
    setLoading(true);
    try {

      
      // Fetch appointments (visits) and prescriptions in parallel
      const [appointmentsResponse, prescriptionsResponse] = await Promise.all([
        api.get(`/appointments`),
        api.get(`/prescriptions/patient/${patient.id}`)
      ]);

      // Filter and format appointments as visits for this patient
      const patientAppointments = (appointmentsResponse.data || []).filter((appointment: unknown) => 
        appointment.patientId === patient.id
      );
      
      const visits = patientAppointments.map((appointment: unknown) => ({
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        type: appointment.type || 'Consultation',
        status: appointment.status,
        notes: appointment.notes || '',
        duration: appointment.duration,
        actualStartTime: appointment.actualStartTime,
        actualEndTime: appointment.actualEndTime
      }));

      // Format prescriptions - include ALL fields needed by PrescriptionViewModal
      const prescriptions = (prescriptionsResponse.data || []).map((prescription: unknown) => ({
        id: prescription.id,
        date: prescription.createdAt,
        createdAt: prescription.createdAt,
        doctorName: prescription.doctorName,
        doctorSignature: prescription.doctorSignature,
        chiefComplaint: prescription.chiefComplaint,
        medications: prescription.medications || [],
        investigations: prescription.investigations,
        doctorNotes: prescription.doctorNotes,
        advice: prescription.advice,
        // Direct patient fields (stored in prescription)
        patientName: prescription.patientName,
        patientVisibleId: prescription.patientVisibleId,
        patientAge: prescription.patientAge,
        patientGender: prescription.patientGender,
        // Keep old patient relation for backward compatibility
        patient: prescription.patient,
        appointment: prescription.appointment
      }));

      setMedicalRecords({
        visits,
        prescriptions
      });
    } catch (error) {
      console.error('Error fetching medical records:', error);
      // Set empty arrays on error
      setMedicalRecords({
        visits: [],
        prescriptions: []
      });
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  // Fetch data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchMedicalRecords();
    }
  }, [isOpen, fetchMedicalRecords]);

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



  const handleDeletePrescription = (prescriptionId: number) => {
    setMedicalRecords(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(prescription => prescription.id !== prescriptionId)
    }));
  };

  const handleDownloadReport = (type: string, format: string = 'pdf') => {
    const visits = medicalRecords.visits;
    const prescriptions = medicalRecords.prescriptions;
    const fileName = `${patient.name.replace(/\s+/g, '_')}_medical_records_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'pdf') {
      // Generate PDF content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Unable to open a new window. Please check your browser settings.",
          variant: "destructive",
        });
        return;
      }
      
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Medical Records - ${patient.name}</title>
            <style>
              @page { size: A4; margin: 1.5cm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
              .header h1 { color: #3b82f6; margin: 0; }
              .header .generated { font-size: 12px; color: #666; margin-top: 10px; }
              .patient-info { background-color: #f8fafc; padding: 15px; margin-bottom: 30px; border-left: 4px solid #3b82f6; }
              .section { margin-bottom: 30px; }
              .section h3 { color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th { background-color: #f1f5f9; padding: 10px; border: 1px solid #e2e8f0; text-align: left; }
              td { padding: 10px; border: 1px solid #e2e8f0; }
              .prescription-card { border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 15px; background-color: #f8fafc; }
              .medication-item { background-color: white; padding: 8px; margin: 5px 0; border-left: 3px solid #3b82f6; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e2e8f0; padding-top: 20px; }
              .time-info { font-size: 11px; color: #888; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Medical Records System</h1>
              <h2>Patient Medical History</h2>
              <div class="generated">Computer Generated Report - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
            </div>
            
            <div class="patient-info">
              <h3>Patient Information</h3>
              <p><strong>Name:</strong> ${patient.name}</p>
              <p><strong>Patient ID:</strong> ${patient.visibleId || patient.id}</p>
              ${patient.phone ? `<p><strong>Phone:</strong> ${patient.phone}</p>` : ''}
              ${patient.email ? `<p><strong>Email:</strong> ${patient.email}</p>` : ''}
              ${patient.dateOfBirth ? `<p><strong>Date of Birth:</strong> ${new Date(patient.dateOfBirth).toLocaleDateString()}</p>` : ''}
              ${patient.gender ? `<p><strong>Gender:</strong> ${patient.gender}</p>` : ''}
              <p><strong>Records Summary:</strong> ${visits.length} visits, ${prescriptions.length} prescriptions</p>
            </div>

            ${visits.length > 0 ? `
              <div class="section">
                <h3>Medical Visits (${visits.length})</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${visits.map(visit => {
                      const visitDate = new Date(visit.date);
                      const startTime = visit.actualStartTime ? new Date(visit.actualStartTime).toLocaleTimeString() : (visit.time || 'N/A');
                      const endTime = visit.actualEndTime ? new Date(visit.actualEndTime).toLocaleTimeString() : '';
                      const timeDisplay = endTime ? `${startTime} - ${endTime}` : startTime;
                      
                      return `
                        <tr>
                          <td>${visitDate.toLocaleDateString()}</td>
                          <td>${timeDisplay}</td>
                          <td>${visit.type}</td>
                          <td>${visit.status}</td>
                          <td>${visit.duration || 'N/A'}</td>
                          <td>${visit.notes || 'No notes recorded'}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div class="section"><h3>Medical Visits</h3><p>No visits recorded in the system.</p></div>'}

            ${prescriptions.length > 0 ? `
              <div class="section">
                <h3>Prescriptions (${prescriptions.length})</h3>
                ${prescriptions.map(prescription => `
                  <div class="prescription-card">
                    <p><strong>Date:</strong> ${new Date(prescription.date).toLocaleDateString()}</p>
                    <p><strong>Prescribing Doctor:</strong> ${prescription.doctorName}</p>
                    ${prescription.chiefComplaint ? `<p><strong>Chief Complaint:</strong> ${prescription.chiefComplaint}</p>` : ''}
                    
                    ${prescription.medications && prescription.medications.length > 0 ? `
                      <div>
                        <strong>Prescribed Medications:</strong>
                        ${prescription.medications.map(med => `
                          <div class="medication-item">
                            <strong>${med.medicineName}</strong><br>
                            Dosage: ${med.dosage} | Frequency: ${med.frequency} | Duration: ${med.duration}
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                    
                    ${prescription.investigations ? `<p><strong>Investigations:</strong> ${prescription.investigations}</p>` : ''}
                    ${prescription.doctorNotes ? `<p><strong>Clinical Notes:</strong> ${prescription.doctorNotes}</p>` : ''}
                    ${prescription.advice ? `<p><strong>Medical Advice:</strong> ${prescription.advice}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : '<div class="section"><h3>Prescriptions</h3><p>No prescriptions recorded in the system.</p></div>'}
            
            <div class="footer">
              <p>Computer Generated Medical Records Report</p>
              <p>Generated from Medical Records Management System</p>
              <p>Report ID: MR-${patient.id}</p>
              <div class="time-info">Generated: ${new Date().toISOString()}</div>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      toast({
        title: "PDF Download",
        description: "Use Ctrl+P (or Cmd+P) and select 'Save as PDF' to download.",
        duration: 5000,
      });
    }
  };

  const handlePrintReport = (type: string) => {
    const visits = medicalRecords.visits;
    const prescriptions = medicalRecords.prescriptions;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Records - ${patient.name}</title>
          <style>
            @page { size: A4; margin: 1.5cm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .header h1 { color: #3b82f6; margin: 0; }
            .header .generated { font-size: 12px; color: #666; margin-top: 10px; }
            .patient-info { background-color: #f8fafc; padding: 15px; margin-bottom: 30px; border-left: 4px solid #3b82f6; }
            .section { margin-bottom: 30px; }
            .section h3 { color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #f1f5f9; padding: 10px; border: 1px solid #e2e8f0; text-align: left; }
            td { padding: 10px; border: 1px solid #e2e8f0; }
            .prescription-card { border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 15px; background-color: #f8fafc; }
            .medication-item { background-color: white; padding: 8px; margin: 5px 0; border-left: 3px solid #3b82f6; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .time-info { font-size: 11px; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Medical Records System</h1>
            <h2>Patient Medical History</h2>
            <div class="generated">Computer Generated Report - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="patient-info">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${patient.name}</p>
            <p><strong>Patient ID:</strong> ${patient.visibleId || patient.id}</p>
            ${patient.phone ? `<p><strong>Phone:</strong> ${patient.phone}</p>` : ''}
            ${patient.email ? `<p><strong>Email:</strong> ${patient.email}</p>` : ''}
            ${patient.dateOfBirth ? `<p><strong>Date of Birth:</strong> ${new Date(patient.dateOfBirth).toLocaleDateString()}</p>` : ''}
            ${patient.gender ? `<p><strong>Gender:</strong> ${patient.gender}</p>` : ''}
            <p><strong>Records Summary:</strong> ${visits.length} visits, ${prescriptions.length} prescriptions</p>
          </div>

          ${visits.length > 0 ? `
            <div class="section">
              <h3>Medical Visits (${visits.length})</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${visits.map(visit => {
                    const visitDate = new Date(visit.date);
                    const startTime = visit.actualStartTime ? new Date(visit.actualStartTime).toLocaleTimeString() : (visit.time || 'N/A');
                    const endTime = visit.actualEndTime ? new Date(visit.actualEndTime).toLocaleTimeString() : '';
                    const timeDisplay = endTime ? `${startTime} - ${endTime}` : startTime;
                    
                    return `
                      <tr>
                        <td>${visitDate.toLocaleDateString()}</td>
                        <td>${timeDisplay}</td>
                        <td>${visit.type}</td>
                        <td>${visit.status}</td>
                        <td>${visit.duration || 'N/A'}</td>
                        <td>${visit.notes || 'No notes recorded'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : '<div class="section"><h3>Medical Visits</h3><p>No visits recorded in the system.</p></div>'}

          ${prescriptions.length > 0 ? `
            <div class="section">
              <h3>Prescriptions (${prescriptions.length})</h3>
              ${prescriptions.map(prescription => `
                <div class="prescription-card">
                  <p><strong>Date:</strong> ${new Date(prescription.date).toLocaleDateString()}</p>
                  <p><strong>Prescribing Doctor:</strong> ${prescription.doctorName}</p>
                  ${prescription.chiefComplaint ? `<p><strong>Chief Complaint:</strong> ${prescription.chiefComplaint}</p>` : ''}
                  
                  ${prescription.medications && prescription.medications.length > 0 ? `
                    <div>
                      <strong>Prescribed Medications:</strong>
                      ${prescription.medications.map(med => `
                        <div class="medication-item">
                          <strong>${med.medicineName}</strong><br>
                          Dosage: ${med.dosage} | Frequency: ${med.frequency} | Duration: ${med.duration}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                  
                  ${prescription.investigations ? `<p><strong>Investigations:</strong> ${prescription.investigations}</p>` : ''}
                  ${prescription.doctorNotes ? `<p><strong>Clinical Notes:</strong> ${prescription.doctorNotes}</p>` : ''}
                  ${prescription.advice ? `<p><strong>Medical Advice:</strong> ${prescription.advice}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : '<div class="section"><h3>Prescriptions</h3><p>No prescriptions recorded in the system.</p></div>'}
          
          <div class="footer">
            <p>Computer Generated Medical Records Report</p>
            <p>Generated from Medical Records Management System</p>
            <p>Report ID: MR-${patient.id}</p>
            <div class="time-info">Generated: ${new Date().toISOString()}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    toast({
      title: "Print Initiated",
      description: "Medical records are being printed.",
      duration: 3000,
    });
  };

  const handleShareReport = async (type: string, method: string = 'share') => {
    const visits = medicalRecords.visits;
    const prescriptions = medicalRecords.prescriptions;
    
    // Create a summary for sharing
    const shareText = `MEDICAL RECORDS SUMMARY

Patient: ${patient.name}
Patient ID: ${patient.visibleId || patient.id}
Phone: ${patient.phone || 'N/A'}
Generated: ${new Date().toLocaleDateString()}

SUMMARY:
- Total Visits: ${visits.length}
- Total Prescriptions: ${prescriptions.length}

${visits.length > 0 ? `
RECENT VISITS:
${visits.slice(0, 3).map(visit => 
  `• ${new Date(visit.date).toLocaleDateString()} - ${visit.type} (${visit.status})`
).join('\n')}` : ''}

${prescriptions.length > 0 ? `
RECENT PRESCRIPTIONS:
${prescriptions.slice(0, 3).map(prescription => 
  `• ${new Date(prescription.date).toLocaleDateString()} - Dr. ${prescription.doctorName}`
).join('\n')}` : ''}

This is a confidential medical record from MediClinic.`;
    
    // Try native sharing first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Medical Records - ${patient.name}`,
          text: shareText,
        });
        
        // Only show success message if share was actually completed
        toast({
          title: "Shared Successfully",
          description: "Medical records summary has been shared.",
          duration: 3000,
        });
        return;
      } catch (error) {
        // User cancelled or sharing failed, fall back to clipboard
        if (error.name === 'AbortError') {
          // User cancelled the share, don't show error
          return;
        }
      }
    }
    
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to Clipboard",
        description: "Medical records summary copied. You can now paste it anywhere.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Unable to share or copy the medical records summary.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          patientId={patient.visibleId}
          onDownloadReport={handleDownloadReport}
          onPrintReport={handlePrintReport}
          onShareReport={handleShareReport}
        />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading medical records...</span>
          </div>
        ) : (
          <Tabs defaultValue="visits" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visits">Medical Visits ({medicalRecords.visits.length})</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions ({medicalRecords.prescriptions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="visits">
              <VisitsTab
                visits={medicalRecords.visits}
                onDownloadReport={handleDownloadReport}
                patientName={patient.name}
                patientId={patient.visibleId || patient.id}
              />
            </TabsContent>

            <TabsContent value="prescriptions">
              <PrescriptionsTab
                prescriptions={medicalRecords.prescriptions}
                onDeletePrescription={handleDeletePrescription}
                onDownloadReport={handleDownloadReport}
                getStatusBadge={getStatusBadge}
                patientName={patient.name}
                patientId={patient.visibleId || patient.id}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MedicalRecordsDialog;
