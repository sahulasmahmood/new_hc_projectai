
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Printer,
  Share
} from "lucide-react";

interface MedicalRecordsHeaderProps {
  patientName: string;
  onDownloadReport: (type: string) => void;
  onPrintReport: (type: string) => void;
  onShareReport: (type: string) => void;
}

const MedicalRecordsHeader = ({ 
  patientName, 
  onDownloadReport, 
  onPrintReport, 
  onShareReport 
}: MedicalRecordsHeaderProps) => {
  return (
    <DialogHeader>
      <div className="flex items-center justify-between">
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-medical-500" />
          Medical Records - {patientName}
        </DialogTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onPrintReport('all')}>
            <Printer className="h-4 w-4 mr-2" />
            Print All
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDownloadReport('all')}>
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
          <Button variant="outline" size="sm" onClick={() => onShareReport('all')}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </DialogHeader>
  );
};

export default MedicalRecordsHeader;
