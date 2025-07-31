
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  User, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Download,
  Eye
} from "lucide-react";

interface Visit {
  id: number;
  date: string;
  doctor: string;
  diagnosis: string;
  treatment: string;
  notes: string;
}

interface VisitsTabProps {
  visits: Visit[];
  onDeleteVisit: (visitId: number) => void;
  onDownloadReport: (type: string) => void;
}

const VisitsTab = ({ visits, onDeleteVisit, onDownloadReport }: VisitsTabProps) => {
  const [editingVisit, setEditingVisit] = useState<number | null>(null);
  const [showAddVisit, setShowAddVisit] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Medical Visits History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowAddVisit(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Visit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDownloadReport('visits')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showAddVisit && (
          <Card className="mb-4 border-dashed border-2 border-medical-200">
            <CardHeader>
              <CardTitle className="text-lg">Add New Visit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="text-sm font-medium">Doctor</label>
                  <Input placeholder="Dr. Name" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Diagnosis</label>
                <Input placeholder="Enter diagnosis" />
              </div>
              <div>
                <label className="text-sm font-medium">Treatment</label>
                <Input placeholder="Enter treatment" />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea placeholder="Enter additional notes" />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Visit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddVisit(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Treatment</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {visit.date}
                </TableCell>
                <TableCell>{visit.doctor}</TableCell>
                <TableCell>{visit.diagnosis}</TableCell>
                <TableCell>{visit.treatment}</TableCell>
                <TableCell className="max-w-xs truncate">{visit.notes}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingVisit(visit.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Visit Record</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this visit record? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteVisit(visit.id)} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

export default VisitsTab;
