import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Mail, Calendar, Home, AlertCircle, Eye } from "lucide-react";
import ABHAStatus from "./ABHAStatus";

interface PatientDetailsDialogProps {
  patient: any;
  trigger?: React.ReactNode;
}

const PatientDetailsDialog = ({ patient, trigger }: PatientDetailsDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-medical-500" />
            Patient Details - {patient.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{patient.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{patient.visibleId}</p>
                <p className="text-gray-600">{patient.age} years old • {patient.gender}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{patient.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No visits yet'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <Badge className={patient.status === "Active" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                  {patient.status}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Primary Condition</p>
                <Badge className="bg-medical-100 text-medical-800">{patient.condition}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Allergies</p>
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy: string) => (
                      <Badge key={allergy} className="bg-red-100 text-red-800 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No known allergies</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ABHA Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ABHAStatus 
                abhaId={patient.abhaId} 
                verified={patient.abhaVerified}
                className="mb-3"
              />
              {patient.abhaId && (
                <p className="text-sm text-gray-600">
                  ABHA ID: {patient.abhaId}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.emergencyContact ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{patient.emergencyContact}</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{patient.emergencyPhone}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No emergency contact on file</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsDialog;
