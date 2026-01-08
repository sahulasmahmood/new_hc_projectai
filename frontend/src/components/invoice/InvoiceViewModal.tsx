import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, X } from "lucide-react";
import { useReactToPrint } from 'react-to-print';
import InvoicePrintTemplate from './InvoicePrintTemplate';
import { downloadInvoicePDF } from './InvoicePDF';
import api from '@/lib/api';

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

interface InvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
}

const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  isOpen,
  onClose,
  bill,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>({
    name: 'Medical Clinic',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHospitalInfo();
    }
  }, [isOpen]);

  const fetchHospitalInfo = async () => {
    try {
      const response = await api.get('/settings/hospital');
      if (response.data) {
        setHospitalInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching hospital info:', error);
      // Use default values if API fails
      setHospitalInfo({
        name: 'Medical Clinic',
        address: '',
        phone: '',
        email: '',
        license: '',
      });
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${bill?.billNumber}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `,
  });

  const handleDownloadPDF = async () => {
    if (!bill) return;
    
    setIsLoading(true);
    try {
      await downloadInvoicePDF(bill, hospitalInfo);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!bill) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Invoice - {bill.billNumber}</DialogTitle>
              <DialogDescription>
                View, print, or download the invoice for this bill
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Small delay to ensure content is ready
                  setTimeout(() => {
                    handlePrint();
                  }, 100);
                }}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isLoading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <InvoicePrintTemplate
              ref={printRef}
              bill={bill}
              hospitalInfo={hospitalInfo}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceViewModal;