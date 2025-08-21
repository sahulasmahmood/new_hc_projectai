
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Printer,
  Share2
} from "lucide-react";

interface MedicalRecordsHeaderProps {
  patientName: string;
  patientId?: string;
  onDownloadReport: (type: string, format?: string) => void;
  onPrintReport: (type: string) => void;
  onShareReport: (type: string, method?: string) => void;
}

const MedicalRecordsHeader = ({ 
  patientName, 
  patientId,
  onDownloadReport, 
  onPrintReport, 
  onShareReport 
}: MedicalRecordsHeaderProps) => {
  
  return (
    <DialogHeader>
      <div className="flex items-center justify-between">
        <div>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-medical-500" />
            Medical Records - {patientName}
          </DialogTitle>
          {patientId && (
            <p className="text-sm text-gray-500 mt-1">Patient ID: {patientId}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPrintReport('all')}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDownloadReport('all', 'pdf')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onShareReport('all', 'share')}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </DialogHeader>
  );
};

export default MedicalRecordsHeader;
