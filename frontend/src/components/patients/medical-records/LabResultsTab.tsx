
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TestTube, 
  Calendar, 
  Plus, 
  Edit,
  Download,
  Printer,
  Share,
  Eye
} from "lucide-react";

interface LabResult {
  id: number;
  date: string;
  test: string;
  result: string;
  range: string;
  status: string;
}

interface LabResultsTabProps {
  labResults: LabResult[];
  onDownloadReport: (type: string) => void;
  onPrintReport: (type: string) => void;
  getStatusBadge: (status: string) => string;
}

const LabResultsTab = ({ labResults, onDownloadReport, onPrintReport, getStatusBadge }: LabResultsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Laboratory Results
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Lab Result
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDownloadReport('labs')}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPrintReport('labs')}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Reference Range</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labResults.map((result) => (
              <TableRow key={result.id}>
                <TableCell className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {result.date}
                </TableCell>
                <TableCell>{result.test}</TableCell>
                <TableCell className="font-medium">{result.result}</TableCell>
                <TableCell className="text-sm text-gray-600">{result.range}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(result.status)}>
                    {result.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LabResultsTab;
