import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
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

interface BillItem {
  id: number;
  itemType: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstAmount: number;
  gstRate?: {
    name: string;
    rate: number;
  };
}

interface Bill {
  id: number;
  billNumber: string;
  patientId: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  paymentDate?: string;
  createdAt: string;
  items: BillItem[];
  patient: {
    name: string;
    visibleId: string;
    phone: string;
    email?: string;
    address?: string;
  };
  appointment?: {
    date: string;
    time: string;
    type: string;
  };
  prescription?: {
    doctorName: string;
    createdAt: string;
  };
}

interface HospitalInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  license?: string;
}

interface InvoicePDFProps {
  bill: Bill;
  hospitalInfo: HospitalInfo;
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
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  invoiceDetails: {
    fontSize: 10,
    lineHeight: 1.3,
  },
  invoiceDetailRow: {
    marginBottom: 2,
  },
  label: {
    fontWeight: 'bold',
    width: 80,
    display: 'inline-block',
  },
  patientInfo: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  patientTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1f2937',
  },
  patientDetails: {
    fontSize: 10,
    lineHeight: 1.3,
  },
  patientDetailRow: {
    marginBottom: 2,
  },
  itemsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 2,
  },
  itemsTable: {
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
  summarySection: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  summaryBox: {
    width: 200,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 10,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentInfo: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1e40af',
  },
  paymentDetails: {
    fontSize: 10,
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

const InvoicePDF: React.FC<InvoicePDFProps> = ({ bill, hospitalInfo }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Hospital Header */}
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
        {hospitalInfo?.license && (
          <Text style={styles.hospitalDetails}>Reg. No: {hospitalInfo.license}</Text>
        )}
      </View>

      {/* Invoice Title */}
      <Text style={styles.invoiceTitle}>INVOICE</Text>

      {/* Invoice Information */}
      <View style={styles.invoiceInfo}>
        <View style={styles.invoiceDetails}>
          <Text style={styles.invoiceDetailRow}>
            <Text style={styles.label}>Invoice No:</Text>
            {bill.billNumber}
          </Text>
          <Text style={styles.invoiceDetailRow}>
            <Text style={styles.label}>Date:</Text>
            {format(new Date(bill.createdAt), 'dd/MM/yyyy')}
          </Text>
          <Text style={styles.invoiceDetailRow}>
            <Text style={styles.label}>Status:</Text>
            {bill.status}
          </Text>
        </View>
        <View style={styles.invoiceDetails}>
          {bill.appointment && (
            <>
              <Text style={styles.invoiceDetailRow}>
                <Text style={styles.label}>Service Date:</Text>
                {format(new Date(bill.appointment.date), 'dd/MM/yyyy')}
              </Text>
              <Text style={styles.invoiceDetailRow}>
                <Text style={styles.label}>Service Type:</Text>
                {bill.appointment.type}
              </Text>
            </>
          )}
          {bill.prescription?.doctorName && (
            <Text style={styles.invoiceDetailRow}>
              <Text style={styles.label}>Doctor:</Text>
              Dr. {bill.prescription.doctorName}
            </Text>
          )}
        </View>
      </View>

      {/* Patient Information */}
      <View style={styles.patientInfo}>
        <Text style={styles.patientTitle}>BILL TO:</Text>
        <View style={styles.patientDetails}>
          <Text style={styles.patientDetailRow}>
            <Text style={styles.label}>Patient:</Text>
            {bill.patient.name}
          </Text>
          <Text style={styles.patientDetailRow}>
            <Text style={styles.label}>Patient ID:</Text>
            {bill.patient.visibleId}
          </Text>
          <Text style={styles.patientDetailRow}>
            <Text style={styles.label}>Phone:</Text>
            {bill.patient.phone}
          </Text>
          {bill.patient.email && (
            <Text style={styles.patientDetailRow}>
              <Text style={styles.label}>Email:</Text>
              {bill.patient.email}
            </Text>
          )}
          {bill.patient.address && (
            <Text style={styles.patientDetailRow}>
              <Text style={styles.label}>Address:</Text>
              {bill.patient.address}
            </Text>
          )}
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>SERVICES & ITEMS</Text>
        
        <View style={styles.itemsTable}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { width: '8%' }]}>S.No</Text>
            <Text style={[styles.tableHeader, { width: '35%' }]}>Description</Text>
            <Text style={[styles.tableHeader, { width: '12%' }]}>Qty</Text>
            <Text style={[styles.tableHeader, { width: '15%' }]}>Unit Price</Text>
            <Text style={[styles.tableHeader, { width: '15%' }]}>Amount</Text>
            <Text style={[styles.tableHeader, { width: '15%' }]}>GST</Text>
          </View>
          
          {/* Table Body */}
          {bill.items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '8%' }]}>{index + 1}</Text>
              <Text style={[styles.tableCell, { width: '35%' }]}>
                {item.itemName}
                {item.description && (
                  <Text style={{ fontSize: 8, color: '#666' }}>
                    {'\n'}{item.description}
                  </Text>
                )}
              </Text>
              <Text style={[styles.tableCell, { width: '12%' }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>₹{item.unitPrice.toFixed(2)}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>₹{item.totalPrice.toFixed(2)}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>
                {item.gstAmount > 0 ? (
                  <>
                    ₹{item.gstAmount.toFixed(2)}
                    {item.gstRate && (
                      <Text style={{ fontSize: 7 }}>
                        {'\n'}({item.gstRate.rate}%)
                      </Text>
                    )}
                  </>
                ) : (
                  '₹0.00'
                )}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Subtotal:</Text>
            <Text>₹{bill.subtotal.toFixed(2)}</Text>
          </View>
          {bill.gstAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text>Total GST:</Text>
              <Text>₹{bill.gstAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.summaryTotal}>
            <Text>TOTAL AMOUNT:</Text>
            <Text>₹{bill.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Information */}
      {bill.status === 'Paid' && (
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>PAYMENT INFORMATION</Text>
          <View style={styles.paymentDetails}>
            <Text>Payment Status: PAID</Text>
            {bill.paymentMethod && <Text>Payment Method: {bill.paymentMethod}</Text>}
            {bill.paymentDate && (
              <Text>Payment Date: {format(new Date(bill.paymentDate), 'dd/MM/yyyy HH:mm')}</Text>
            )}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footerNote}>
        <Text style={styles.footerRow}>
          Thank you for choosing {hospitalInfo?.name || 'our medical services'}!
        </Text>
        <Text style={styles.footerRow}>
          This is a computer-generated invoice and does not require a signature.
        </Text>
        <Text style={styles.footerRow}>
          For any queries, please contact: {hospitalInfo?.phone || 'Contact Hospital'}
        </Text>
      </View>
    </Page>
  </Document>
);

// Export function to generate and download PDF
export const downloadInvoicePDF = async (
  bill: Bill,
  hospitalInfo: HospitalInfo
) => {
  const blob = await pdf(
    <InvoicePDF bill={bill} hospitalInfo={hospitalInfo} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice-${bill.billNumber}-${format(new Date(bill.createdAt), 'yyyy-MM-dd')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export default InvoicePDF;