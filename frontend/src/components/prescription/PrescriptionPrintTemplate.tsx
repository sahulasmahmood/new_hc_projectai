import React from 'react';
import { format } from 'date-fns';

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
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTop: '1px solid #000',
        paddingTop: '12pt',
      },
      signatureBox: {
        textAlign: 'center' as const,
        width: '140pt',
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
        maxHeight: '30pt',
        maxWidth: '120pt',
        marginBottom: '4pt',
        border: '1px solid #ccc',
      },
      doctorName: {
        fontWeight: 'bold',
        fontSize: '10pt',
      },
      regNumber: {
        fontSize: '8pt',
        color: '#666',
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
          {hospitalInfo?.license && (
            <div style={styles.hospitalDetails}>Reg. No: {hospitalInfo.license}</div>
          )}
        </div>

        {/* Patient Information - Structured Layout */}
        <div style={styles.patientInfo}>
          <div style={styles.patientDetails}>
            <div>
              <span style={styles.patientLabel}>Patient:</span>
              {prescription.patientName || prescription.patient?.name || patientName}
            </div>
            <div>
              <span style={styles.patientLabel}>ID:</span>
              {prescription.patientVisibleId || prescription.patient?.visibleId || patientId}
            </div>
            <div>
              <span style={styles.patientLabel}>Age/Gender:</span>
              {prescription.patientAge || prescription.patient?.age || 'N/A'} years, {prescription.patientGender || prescription.patient?.gender || 'N/A'}
            </div>
          </div>
          <div style={styles.dateInfo}>
            <div><strong>Date:</strong> {format(new Date(prescription.createdAt), 'dd/MM/yyyy')}</div>
            <div><strong>Time:</strong> {format(new Date(prescription.createdAt), 'HH:mm')}</div>
            <div><strong>Doctor:</strong> Dr. {prescription.doctorName}</div>
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
            <div style={styles.signatureLabel}>Patient/Guardian Signature</div>
            <div style={styles.signatureLine}></div>
            <div style={{ fontSize: '8pt', marginTop: '4pt' }}>Date: ___________</div>
          </div>
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
            <div style={styles.doctorName}>Dr. {prescription.doctorName}</div>
            {hospitalInfo?.license && (
              <div style={styles.regNumber}>Reg. No: {hospitalInfo.license}</div>
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