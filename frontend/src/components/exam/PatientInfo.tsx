
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, Calendar, Home, AlertCircle } from "lucide-react";

interface PatientInfoProps {
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    mrn: string;
    phone: string;
    email: string;
    condition: string;
    admissionDate: string;
    roomNumber: string;
    allergies: string[];
    emergencyContact: string;
    emergencyPhone: string;
  };
}

const PatientInfo = ({ patient }: PatientInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-medical-500" />
          Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{patient.name}</h3>
              <p className="text-gray-600">MRN: {patient.mrn}</p>
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
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Admitted: {patient.admissionDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Room: {patient.roomNumber}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Primary Condition</p>
              <Badge className="bg-medical-100 text-medical-800">{patient.condition}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Allergies</p>
              {patient.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map((allergy) => (
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
            
            <div>
              <p className="text-sm font-medium text-gray-700">Emergency Contact</p>
              <p className="text-sm text-gray-600">{patient.emergencyContact}</p>
              <p className="text-sm text-gray-600">{patient.emergencyPhone}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientInfo;
