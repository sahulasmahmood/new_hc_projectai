import React from 'react';
import { format } from 'date-fns';

interface Prescription {
  id: number;
  date: string;
  createdAt: string;
  doctorName: string;
  doctorQualification?: string;
  doctorRegistrationNumber?: string;
  doctorSignature?: string;
  chiefComplaint?: string;
  medications: Array<{
    id: number;
    medicineName: string;
    dosage: string;
    frequency: string;
    timing?: string;
    duration: string;
  }>;
  investigations?: string;
  doctorNotes?: string;
  advice?: string;
  patientName?: string;
  patientVisibleId?: string;
  patientAge?: number;
  patientGender?: string;
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

interface HospitalInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  license?: string;
}

interface PrescriptionPrintTemplateProps {
  prescription: Prescription;
  hospitalInfo: HospitalInfo;
  patientName: string;
  patientId: string;
}

// Helper function to format timing display
const formatTiming = (timing?: string) => {
  if (!timing) return 'No meal restriction';
  
  const timingMap: Record<string, string> = {
    'AC': 'Before meals (AC)',
    'PC': 'After meals (PC)',
    'HS': 'At bedtime (HS)',
    'Empty stomach': 'Empty stomach',
    'With food': 'With food',
    'No meal restriction': 'No meal restriction'
  };
  
  return timingMap[timing] || timing;
};

const PrescriptionPrintTemplate = React.forwardRef<HTMLDivElement, PrescriptionPrintTemplateProps>(
  ({ prescription, hospitalInfo, patientName, patientId }, ref) => {
    const styles = {
      container: {
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm',
        margin: '0',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11pt',
        lineHeight: '1.4',
        color: 'black',
        boxSizing: 'border-box' as const,
      },
      header: {
        textAlign: 'center' as const,
        borderBottom: '2px solid #000',
        paddingBottom: '12pt',
        marginBottom: '16pt',
      },
      hospitalName: {
        fontSize: '16pt',
        fontWeight: 'bold',
        margin: '0 0 6pt 0',
        color: 'black',
        letterSpacing: '0.5pt',
      },
      hospitalDetails: {
        fontSize: '9pt',
        margin: '1pt 0',
        color: 'black',
      },
      contactInfo: {
        fontSize: '9pt',
        marginTop: '4pt',
        color: 'black',
      },
      patientInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16pt',
        paddingBottom: '8pt',
        borderBottom: '1px solid #000',
      },
      patientDetails: {
        fontSize: '10pt',
        lineHeight: '1.3',
      },
      patientLabel: {
        fontWeight: 'bold',
        display: 'inline-block',
        width: '80pt',
      },
      dateInfo: {
        textAlign: 'right' as const,
        fontSize: '10pt',
        lineHeight: '1.3',
      },
      sectionTitle: {
        fontWeight: 'bold',
        fontSize: '11pt',
        margin: '12pt 0 6pt 0',
        color: 'black',
        textTransform: 'uppercase' as const,
        borderBottom: '1px solid #ccc',
        paddingBottom: '2pt',
      },
      sectionContent: {
        fontSize: '10pt',
        marginBottom: '12pt',
        lineHeight: '1.4',
        padding: '4pt 8pt',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
      },
      medicationsSection: {
        margin: '16pt 0',
      },
      rxHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12pt',
        borderBottom: '1px solid #000',
        paddingBottom: '4pt',
      },
      rxSymbol: {
        fontSize: '20pt',
        fontWeight: 'bold',
        color: 'black',
        marginRight: '8pt',
      },
      medicationsTable: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        marginTop: '8pt',
      },
      tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
        fontSize: '9pt',
        padding: '6pt 4pt',
        border: '1px solid #000',
        textAlign: 'left' as const,
      },
      tableCell: {
        fontSize: '9pt',
        padding: '6pt 4pt',
        border: '1px solid #000',
        verticalAlign: 'top' as const,
      },
      signatureSection: {
        marginTop: '30pt',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        borderTop: '1px solid #000',
        paddingTop: '12pt',
        minHeight: '100pt', // Ensures enough vertical space for alignment
      },
      signatureBox: {
        textAlign: 'center' as const,
        width: '140pt',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: '6pt', // Adds even spacing between elements
      },
      signatureLabel: {
        fontSize: '9pt',
        marginBottom: '4pt',
        fontWeight: 'bold',
      },
      signatureLine: {
        borderBottom: '1px solid black',
        width: '120pt',
        height: '30pt',
        marginBottom: '4pt',
        margin: '0 auto',
      },
      signatureImage: {
        maxHeight: '36pt',
        maxWidth: '120pt',
        margin: '0 auto 4pt auto',
        border: '1px solid #ccc',
        display: 'block',
      },
      doctorName: {
        fontWeight: 'bold',
        fontSize: '10pt',
        marginTop: '2pt',
      },
      regNumber: {
        fontSize: '8pt',
        color: '#666',
        marginTop: '2pt',
      },
      footerNote: {
        marginTop: '20pt',
        paddingTop: '8pt',
        borderTop: '1px solid #ccc',
        fontSize: '8pt',
        textAlign: 'center' as const,
        color: '#666',
        lineHeight: '1.2',
      },
    };

    return (
      <div ref={ref} style={styles.container}>
        {/* Hospital Header - Clean and Professional */}
        <div style={styles.header}>
          <div style={styles.hospitalName}>
            {hospitalInfo?.name?.toUpperCase() || 'MEDICAL CLINIC'}
          </div>
          {hospitalInfo?.address && (
            <div style={styles.hospitalDetails}>{hospitalInfo.address}</div>
          )}
          <div style={styles.contactInfo}>
            {hospitalInfo?.phone && `Tel: ${hospitalInfo.phone}`}
            {hospitalInfo?.phone && hospitalInfo?.email && ' | '}
            {hospitalInfo?.email && `Email: ${hospitalInfo.email}`}
          </div>
        </div>

        {/* Patient Information - Structured Layout */}
        <div style={styles.patientInfo}>
          <div style={styles.patientDetails}>
            <div style={{ marginBottom: '6pt' }}>
              <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>Patient: </span>
              <span style={{ fontSize: '12pt' }}>{prescription.patientName || prescription.patient?.name || patientName}</span>
            </div>
            <div style={{ marginBottom: '4pt' }}>
              <span style={{ fontWeight: 'bold' }}>ID: </span>
              {prescription.patientVisibleId || prescription.patient?.visibleId || patientId}
            </div>
            <div style={{ marginBottom: '4pt' }}>
              <span style={{ fontWeight: 'bold' }}>Age & Gender: </span>
              {prescription.patientAge || prescription.patient?.age || 'N/A'} years • {prescription.patientGender || prescription.patient?.gender || 'N/A'}
            </div>
          </div>
          <div style={styles.dateInfo}>
            <div style={{ marginBottom: '4pt' }}><strong>Date:</strong> {format(new Date(prescription.createdAt), 'dd MMM yyyy')}</div>
            <div style={{ marginBottom: '4pt' }}>
              <strong>Doctor:</strong> Dr. {prescription.doctorName}
              {prescription.doctorQualification && `, ${prescription.doctorQualification}`}
            </div>
            {prescription.doctorRegistrationNumber && (
              <div><strong>Reg. No:</strong> {prescription.doctorRegistrationNumber}</div>
            )}
          </div>
        </div>

        {/* Chief Complaint & Diagnosis */}
        {prescription.chiefComplaint && (
          <div>
            <div style={styles.sectionTitle}>Chief Complaint & Diagnosis</div>
            <div style={styles.sectionContent}>{prescription.chiefComplaint}</div>
          </div>
        )}

        {/* Medications - Professional Table Format */}
        <div style={styles.medicationsSection}>
          <div style={styles.rxHeader}>
            <span style={styles.rxSymbol}>℞</span>
            <span style={{ fontSize: '12pt', fontWeight: 'bold' }}>PRESCRIPTION</span>
          </div>
          
          {prescription.medications.length > 0 ? (
            <table style={styles.medicationsTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>S.No</th>
                  <th style={styles.tableHeader}>Medicine Name</th>
                  <th style={styles.tableHeader}>Dosage</th>
                  <th style={styles.tableHeader}>Frequency</th>
                  <th style={styles.tableHeader}>Timing</th>
                  <th style={styles.tableHeader}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {prescription.medications.map((med, index) => (
                  <tr key={med.id}>
                    <td style={styles.tableCell}>{index + 1}</td>
                    <td style={styles.tableCell}><strong>{med.medicineName}</strong></td>
                    <td style={styles.tableCell}>{med.dosage}</td>
                    <td style={styles.tableCell}>{med.frequency}</td>
                    <td style={styles.tableCell}>{formatTiming(med.timing)}</td>
                    <td style={styles.tableCell}>{med.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.sectionContent}>No medications prescribed</div>
          )}
        </div>

        {/* Investigations */}
        {prescription.investigations && (
          <div>
            <div style={styles.sectionTitle}>Investigations / Lab Tests</div>
            <div style={styles.sectionContent}>{prescription.investigations}</div>
          </div>
        )}

        {/* Doctor Notes */}
        {prescription.doctorNotes && (
          <div>
            <div style={styles.sectionTitle}>Clinical Notes</div>
            <div style={styles.sectionContent}>{prescription.doctorNotes}</div>
          </div>
        )}

        {/* Advice & Follow-up */}
        {prescription.advice && (
          <div>
            <div style={styles.sectionTitle}>Advice & Follow-up</div>
            <div style={styles.sectionContent}>{prescription.advice}</div>
          </div>
        )}

        {/* Professional Signature Section */}
        <div style={styles.signatureSection}>
          <div style={styles.signatureBox}>
            <div style={styles.signatureLabel}>Doctor's Signature</div>
            {prescription.doctorSignature && prescription.doctorSignature.startsWith('data:image') ? (
              <img 
                src={prescription.doctorSignature} 
                alt="Doctor Signature" 
                style={styles.signatureImage}
              />
            ) : (
              <div style={styles.signatureLine}></div>
            )}
            <div style={styles.doctorName}>
              Dr. {prescription.doctorName}
              {prescription.doctorQualification && `, ${prescription.doctorQualification}`}
            </div>
            {prescription.doctorRegistrationNumber && (
              <div style={styles.regNumber}>Reg. No: {prescription.doctorRegistrationNumber}</div>
            )}
          </div>
        </div>

        {/* Professional Footer */}
        <div style={styles.footerNote}>
          <div>This prescription is valid for 30 days from the date of issue.</div>
          <div>For any queries, please contact: {hospitalInfo?.phone || 'Contact Hospital'}</div>
        </div>
      </div>
    );
  }
);

PrescriptionPrintTemplate.displayName = 'PrescriptionPrintTemplate';

export default PrescriptionPrintTemplate;