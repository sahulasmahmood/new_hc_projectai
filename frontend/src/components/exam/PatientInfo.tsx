
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, Calendar, AlertCircle, FileText, Eye } from "lucide-react";

interface PatientInfoProps {
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    condition: string;
    allergies: string[];
    emergencyContact: string;
    emergencyPhone: string;
    visibleId?: string;
    medicalReports?: Array<{
      id: number;
      filePath: string;
      description?: string;
      uploadedAt: string;
    }>;
    lastVisit?: string;
  };
}

const PatientInfo = ({ patient }: PatientInfoProps) => {
  return (
    <Card className="border-l-4 border-l-medical-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-medical-700">
          <User className="h-5 w-5" />
          Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Basic Info */}
          <div className="lg:col-span-1">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{patient.name}</h3>
                <p className="text-sm text-gray-600">ID: {patient.visibleId || patient.id}</p>
                <p className="text-sm text-gray-600">{patient.age} years • {patient.gender}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-medical-500" />
                  <span className="text-sm">{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-medical-500" />
                  <span className="text-sm truncate">{patient.email}</span>
                </div>
                {patient.lastVisit && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-medical-500" />
                    <span className="text-sm">Last: {new Date(patient.lastVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medical Info */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Primary Condition</p>
                <Badge className="bg-medical-100 text-medical-800">{patient.condition}</Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Allergies</p>
                {patient.allergies && patient.allergies.length > 0 ? (
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
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="lg:col-span-1">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-900 font-medium">{patient.emergencyContact}</p>
                <p className="text-sm text-gray-600">{patient.emergencyPhone}</p>
              </div>
            </div>
          </div>

          {/* Medical Reports */}
          <div className="lg:col-span-1">
            {patient.medicalReports && patient.medicalReports.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Medical Reports ({patient.medicalReports.length})
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {patient.medicalReports.slice(0, 4).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-medical-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">
                            {report.description || 'Medical Report'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(report.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 hover:bg-medical-100"
                        onClick={() => {
                          // Extract just the filename from the full path
                          const filename = report.filePath.split('/').pop() || report.filePath.split('\\').pop();
                          // Use the backend API base URL with uploads path
                          window.open(`http://localhost:5000/uploads/${filename}`, '_blank');
                        }}
                        title="View report"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {patient.medicalReports.length > 4 && (
                    <p className="text-xs text-gray-500 text-center py-1">
                      +{patient.medicalReports.length - 4} more reports
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Medical Reports</p>
                <p className="text-xs text-gray-500">No reports uploaded</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientInfo;
