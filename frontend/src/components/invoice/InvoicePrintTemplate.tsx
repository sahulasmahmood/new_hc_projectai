import React from 'react';
import { format } from 'date-fns';

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

interface InvoicePrintTemplateProps {
  bill: Bill;
  hospitalInfo: HospitalInfo;
}

const InvoicePrintTemplate = React.forwardRef<HTMLDivElement, InvoicePrintTemplateProps>(
  ({ bill, hospitalInfo }, ref) => {
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
      invoiceTitle: {
        fontSize: '18pt',
        fontWeight: 'bold',
        textAlign: 'center' as const,
        marginBottom: '16pt',
        color: '#2563eb',
        textTransform: 'uppercase' as const,
      },
      invoiceInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16pt',
        paddingBottom: '8pt',
        borderBottom: '1px solid #000',
      },
      invoiceDetails: {
        fontSize: '10pt',
        lineHeight: '1.3',
      },
      label: {
        fontWeight: 'bold',
        display: 'inline-block',
        width: '80pt',
      },
      patientInfo: {
        marginBottom: '16pt',
        padding: '8pt',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
      },
      patientTitle: {
        fontSize: '12pt',
        fontWeight: 'bold',
        marginBottom: '6pt',
        color: '#1f2937',
      },
      patientDetails: {
        fontSize: '10pt',
        lineHeight: '1.3',
      },
      itemsSection: {
        marginTop: '16pt',
        marginBottom: '16pt',
      },
      itemsTitle: {
        fontSize: '12pt',
        fontWeight: 'bold',
        marginBottom: '8pt',
        color: '#1f2937',
        borderBottom: '1px solid #ccc',
        paddingBottom: '2pt',
      },
      itemsTable: {
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
      summarySection: {
        marginTop: '16pt',
        display: 'flex',
        justifyContent: 'flex-end',
      },
      summaryBox: {
        width: '200pt',
        padding: '8pt',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
      },
      summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4pt',
        fontSize: '10pt',
      },
      summaryTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8pt',
        paddingTop: '8pt',
        borderTop: '1px solid #000',
        fontSize: '12pt',
        fontWeight: 'bold',
      },
      paymentInfo: {
        marginTop: '16pt',
        padding: '8pt',
        backgroundColor: '#f0f9ff',
        border: '1px solid #3b82f6',
      },
      paymentTitle: {
        fontSize: '11pt',
        fontWeight: 'bold',
        marginBottom: '4pt',
        color: '#1e40af',
      },
      paymentDetails: {
        fontSize: '10pt',
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
        {/* Hospital Header */}
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

        {/* Invoice Title */}
        <div style={styles.invoiceTitle}>INVOICE</div>

        {/* Invoice Information */}
        <div style={styles.invoiceInfo}>
          <div style={styles.invoiceDetails}>
            <div>
              <span style={styles.label}>Invoice No:</span>
              {bill.billNumber}
            </div>
            <div>
              <span style={styles.label}>Date:</span>
              {format(new Date(bill.createdAt), 'dd/MM/yyyy')}
            </div>
            <div>
              <span style={styles.label}>Status:</span>
              {bill.status}
            </div>
          </div>
          <div style={styles.invoiceDetails}>
            {bill.appointment && (
              <>
                <div>
                  <span style={styles.label}>Service Date:</span>
                  {format(new Date(bill.appointment.date), 'dd/MM/yyyy')}
                </div>
                <div>
                  <span style={styles.label}>Service Type:</span>
                  {bill.appointment.type}
                </div>
              </>
            )}
            {bill.prescription?.doctorName && (
              <div>
                <span style={styles.label}>Doctor:</span>
                Dr. {bill.prescription.doctorName}
              </div>
            )}
          </div>
        </div>

        {/* Patient Information */}
        <div style={styles.patientInfo}>
          <div style={styles.patientTitle}>BILL TO:</div>
          <div style={styles.patientDetails}>
            <div>
              <span style={styles.label}>Patient:</span>
              {bill.patient.name}
            </div>
            <div>
              <span style={styles.label}>Patient ID:</span>
              {bill.patient.visibleId}
            </div>
            <div>
              <span style={styles.label}>Phone:</span>
              {bill.patient.phone}
            </div>
            {bill.patient.email && (
              <div>
                <span style={styles.label}>Email:</span>
                {bill.patient.email}
              </div>
            )}
            {bill.patient.address && (
              <div>
                <span style={styles.label}>Address:</span>
                {bill.patient.address}
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div style={styles.itemsSection}>
          <div style={styles.itemsTitle}>SERVICES & ITEMS</div>
          
          <table style={styles.itemsTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>S.No</th>
                <th style={styles.tableHeader}>Description</th>
                <th style={styles.tableHeader}>Qty</th>
                <th style={styles.tableHeader}>Unit Price</th>
                <th style={styles.tableHeader}>Amount</th>
                <th style={styles.tableHeader}>GST</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, index) => (
                <tr key={item.id}>
                  <td style={styles.tableCell}>{index + 1}</td>
                  <td style={styles.tableCell}>
                    <strong>{item.itemName}</strong>
                    {item.description && (
                      <div style={{ fontSize: '8pt', color: '#666', marginTop: '2pt' }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={styles.tableCell}>{item.quantity}</td>
                  <td style={styles.tableCell}>₹{item.unitPrice.toFixed(2)}</td>
                  <td style={styles.tableCell}>₹{item.totalPrice.toFixed(2)}</td>
                  <td style={styles.tableCell}>
                    {item.gstAmount > 0 ? (
                      <>
                        ₹{item.gstAmount.toFixed(2)}
                        {item.gstRate && (
                          <div style={{ fontSize: '7pt' }}>
                            ({item.gstRate.rate}%)
                          </div>
                        )}
                      </>
                    ) : (
                      '₹0.00'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div style={styles.summarySection}>
          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.gstAmount > 0 && (
              <div style={styles.summaryRow}>
                <span>Total GST:</span>
                <span>₹{bill.gstAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={styles.summaryTotal}>
              <span>TOTAL AMOUNT:</span>
              <span>₹{bill.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {bill.status === 'Paid' && (
          <div style={styles.paymentInfo}>
            <div style={styles.paymentTitle}>PAYMENT INFORMATION</div>
            <div style={styles.paymentDetails}>
              <div>Payment Status: PAID</div>
              {bill.paymentMethod && <div>Payment Method: {bill.paymentMethod}</div>}
              {bill.paymentDate && (
                <div>Payment Date: {format(new Date(bill.paymentDate), 'dd/MM/yyyy HH:mm')}</div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footerNote}>
          <div>Thank you for choosing {hospitalInfo?.name || 'our medical services'}!</div>
          <div>This is a computer-generated invoice and does not require a signature.</div>
          <div>For any queries, please contact: {hospitalInfo?.phone || 'Contact Hospital'}</div>
        </div>
      </div>
    );
  }
);

InvoicePrintTemplate.displayName = 'InvoicePrintTemplate';

export default InvoicePrintTemplate;