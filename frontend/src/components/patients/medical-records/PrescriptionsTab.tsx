
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Pill, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Download,
  Printer,
  Archive
} from "lucide-react";

interface Prescription {
  id: number;
  date: string;
  medication: string;
  dosage: string;
  frequency: string;
  doctor: string;
  status: string;
}

interface PrescriptionsTabProps {
  prescriptions: Prescription[];
  onDeletePrescription: (prescriptionId: number) => void;
  onDownloadReport: (type: string) => void;
  getStatusBadge: (status: string) => string;
}

const PrescriptionsTab = ({ prescriptions, onDeletePrescription, onDownloadReport, getStatusBadge }: PrescriptionsTabProps) => {
  const [editingPrescription, setEditingPrescription] = useState<number | null>(null);
  const [showAddPrescription, setShowAddPrescription] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Prescription History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowAddPrescription(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Prescription
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDownloadReport('prescriptions')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showAddPrescription && (
          <Card className="mb-4 border-dashed border-2 border-medical-200">
            <CardHeader>
              <CardTitle className="text-lg">Add New Prescription</CardTitle>
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Medication</label>
                  <Input placeholder="Medication name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Dosage</label>
                  <Input placeholder="e.g., 10mg" />
                </div>
                <div>
                  <label className="text-sm font-medium">Frequency</label>
                  <Input placeholder="e.g., Twice daily" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Prescription
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddPrescription(false)}>
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
              <TableHead>Medication</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.map((prescription) => (
              <TableRow key={prescription.id}>
                <TableCell className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {prescription.date}
                </TableCell>
                <TableCell>{prescription.medication}</TableCell>
                <TableCell>{prescription.dosage}</TableCell>
                <TableCell>{prescription.frequency}</TableCell>
                <TableCell>{prescription.doctor}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(prescription.status)}>
                    {prescription.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingPrescription(prescription.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this prescription record? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeletePrescription(prescription.id)} className="bg-red-600 hover:bg-red-700">
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

export default PrescriptionsTab;
