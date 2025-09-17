import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register fonts for better typography (fallback to system fonts if external fails)
try {
  Font.register({
    family: 'Times-Roman',
    src: 'https://fonts.gstatic.com/s/timesnewroman/v1/Times_New_Roman.ttf',
  });
} catch (error) {
  // Fallback to system fonts if external font fails
  console.warn('External font loading failed, using system fonts');
}

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

interface PrescriptionPDFProps {
  prescription: Prescription;
  hospitalInfo: HospitalInfo;
  patientName: string;
  patientId: string;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 15,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
    lineHeight: 1.4,
    backgroundColor: 'white',
  },
  header: {
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 12,
    marginBottom: 16,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  hospitalDetails: {
    fontSize: 9,
    marginBottom: 1,
  },
  contactInfo: {
    fontSize: 9,
    marginTop: 4,
  },
  patientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  patientDetails: {
    fontSize: 10,
    lineHeight: 1.3,
  },
  patientDetailRow: {
    marginBottom: 2,
  },
  patientLabel: {
    fontWeight: 'bold',
    width: 60,
    display: 'inline-block',
  },
  dateInfo: {
    textAlign: 'right',
    fontSize: 10,
    lineHeight: 1.3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 2,
  },
  sectionContent: {
    fontSize: 10,
    marginBottom: 12,
    padding: 4,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    lineHeight: 1.4,
  },
  medicationsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  rxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
  },
  rxSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  rxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  medicationsTable: {
    marginTop: 8,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: 9,
    padding: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableCell: {
    fontSize: 9,
    padding: 6,
    borderWidth: 1,
    borderColor: '#000',
    verticalAlign: 'top',
  },
  tableRow: {
    flexDirection: 'row',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 12,
  },
  signatureBox: {
    alignItems: 'center',
    width: 140,
  },
  signatureLabel: {
    fontSize: 9,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: 120,
    height: 30,
    marginBottom: 4,
  },
  signatureImage: {
    maxHeight: 30,
    maxWidth: 120,
    marginBottom: 4,
    border: '1px solid #ccc',
  },
  doctorName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  regNumber: {
    fontSize: 8,
    color: '#666',
  },
  footerNote: {
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    fontSize: 8,
    textAlign: 'center',
    color: '#666',
    lineHeight: 1.2,
  },
  footerRow: {
    marginBottom: 3,
  },
});

const PrescriptionPDF: React.FC<PrescriptionPDFProps> = ({
  prescription,
  hospitalInfo,
  patientName,
  patientId,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Hospital Header - Clean and Professional */}
      <View style={styles.header}>
        <Text style={styles.hospitalName}>
          {hospitalInfo?.name?.toUpperCase() || 'MEDICAL CLINIC'}
        </Text>
        {hospitalInfo?.address && (
          <Text style={styles.hospitalDetails}>{hospitalInfo.address}</Text>
        )}
        <Text style={styles.contactInfo}>
          {hospitalInfo?.phone && `Tel: ${hospitalInfo.phone}`}
          {hospitalInfo?.phone && hospitalInfo?.email && ' | '}
          {hospitalInfo?.email && `Email: ${hospitalInfo.email}`}
        </Text>
      </View>

      {/* Patient Information - Structured Layout */}
      <View style={styles.patientInfo}>
        <View style={styles.patientDetails}>
          <Text style={[styles.patientDetailRow, { fontSize: 12, fontWeight: 'bold', marginBottom: 4 }]}>
            Patient: {prescription.patientName || prescription.patient?.name || patientName}
          </Text>
          <Text style={styles.patientDetailRow}>
            <Text style={{ fontWeight: 'bold' }}>ID: </Text>
            {prescription.patientVisibleId || prescription.patient?.visibleId || patientId}
          </Text>
          <Text style={styles.patientDetailRow}>
            <Text style={{ fontWeight: 'bold' }}>Age & Gender: </Text>
            {prescription.patientAge || prescription.patient?.age || 'N/A'} years • {prescription.patientGender || prescription.patient?.gender || 'N/A'}
          </Text>
        </View>
        <View style={styles.dateInfo}>
          <Text style={styles.patientDetailRow}>
            <Text style={{ fontWeight: 'bold' }}>Date: </Text>
            {format(new Date(prescription.createdAt), 'dd MMM yyyy')}
          </Text>
          <Text style={styles.patientDetailRow}>
            <Text style={{ fontWeight: 'bold' }}>Doctor: </Text>
            Dr. {prescription.doctorName}
            {prescription.doctorQualification && `, ${prescription.doctorQualification}`}
          </Text>
          {prescription.doctorRegistrationNumber && (
            <Text style={styles.patientDetailRow}>
              <Text style={{ fontWeight: 'bold' }}>Reg. No: </Text>
              {prescription.doctorRegistrationNumber}
            </Text>
          )}
        </View>
      </View>

      {/* Chief Complaint & Diagnosis */}
      {prescription.chiefComplaint && (
        <View>
          <Text style={styles.sectionTitle}>Chief Complaint & Diagnosis</Text>
          <Text style={styles.sectionContent}>{prescription.chiefComplaint}</Text>
        </View>
      )}

      {/* Medications - Professional Table Format */}
      <View style={styles.medicationsSection}>
        <View style={styles.rxHeader}>
          <Text style={styles.rxSymbol}>℞</Text>
          <Text style={styles.rxTitle}>PRESCRIPTION</Text>
        </View>
        
        {prescription.medications.length > 0 ? (
          <View style={styles.medicationsTable}>
            {/* Table Header */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, { width: '8%' }]}>S.No</Text>
              <Text style={[styles.tableHeader, { width: '35%' }]}>Medicine Name</Text>
              <Text style={[styles.tableHeader, { width: '19%' }]}>Dosage</Text>
              <Text style={[styles.tableHeader, { width: '19%' }]}>Frequency</Text>
              <Text style={[styles.tableHeader, { width: '19%' }]}>Duration</Text>
            </View>
            {/* Table Body */}
            {prescription.medications.map((med, index) => (
              <View key={med.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '8%' }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { width: '35%', fontWeight: 'bold' }]}>{med.medicineName}</Text>
                <Text style={[styles.tableCell, { width: '19%' }]}>{med.dosage}</Text>
                <Text style={[styles.tableCell, { width: '19%' }]}>{med.frequency}</Text>
                <Text style={[styles.tableCell, { width: '19%' }]}>{med.duration}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.sectionContent}>No medications prescribed</Text>
        )}
      </View>

      {/* Investigations */}
      {prescription.investigations && (
        <View>
          <Text style={styles.sectionTitle}>Investigations / Lab Tests</Text>
          <Text style={styles.sectionContent}>{prescription.investigations}</Text>
        </View>
      )}

      {/* Doctor Notes */}
      {prescription.doctorNotes && (
        <View>
          <Text style={styles.sectionTitle}>Clinical Notes</Text>
          <Text style={styles.sectionContent}>{prescription.doctorNotes}</Text>
        </View>
      )}

      {/* Advice & Follow-up */}
      {prescription.advice && (
        <View>
          <Text style={styles.sectionTitle}>Advice & Follow-up</Text>
          <Text style={styles.sectionContent}>{prescription.advice}</Text>
        </View>
      )}

      {/* Professional Signature Section */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Doctor's Signature</Text>
          {prescription.doctorSignature && prescription.doctorSignature.startsWith('data:image') ? (
            <Image
              src={prescription.doctorSignature}
              style={styles.signatureImage}
            />
          ) : (
            <View style={styles.signatureLine} />
          )}
          <Text style={styles.doctorName}>
            Dr. {prescription.doctorName}
            {prescription.doctorQualification && `, ${prescription.doctorQualification}`}
          </Text>
          {prescription.doctorRegistrationNumber && (
            <Text style={styles.regNumber}>Reg. No: {prescription.doctorRegistrationNumber}</Text>
          )}
        </View>
      </View>

      {/* Professional Footer */}
      <View style={styles.footerNote}>
        <Text style={styles.footerRow}>
          This prescription is valid for 30 days from the date of issue.
        </Text>
        <Text style={styles.footerRow}>
          For any queries, please contact: {hospitalInfo?.phone || 'Contact Hospital'}
        </Text>
      </View>
    </Page>
  </Document>
);

// Export function to generate and download PDF
export const downloadPrescriptionPDF = async (
  prescription: Prescription,
  hospitalInfo: HospitalInfo,
  patientName: string,
  patientId: string
) => {
  const blob = await pdf(
    <PrescriptionPDF
      prescription={prescription}
      hospitalInfo={hospitalInfo}
      patientName={patientName}
      patientId={patientId}
    />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Prescription-${prescription.id}-${format(new Date(prescription.createdAt), 'yyyy-MM-dd')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export default PrescriptionPDF;