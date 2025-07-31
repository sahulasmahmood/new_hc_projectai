
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Pill, AlertTriangle, FileText, Plus } from "lucide-react";

interface MedicalHistoryProps {
  patientId: string;
}

const MedicalHistory = ({ patientId }: MedicalHistoryProps) => {
  const medicalHistory = {
    chronicConditions: [
      { condition: "Hypertension", diagnosed: "2020-03-15", status: "Active", severity: "Moderate" },
      { condition: "Type 2 Diabetes", diagnosed: "2019-08-22", status: "Controlled", severity: "Mild" },
      { condition: "Hyperlipidemia", diagnosed: "2021-01-10", status: "Active", severity: "Mild" }
    ],
    currentMedications: [
      { 
        name: "Lisinopril", 
        dosage: "10mg", 
        frequency: "Once daily", 
        prescribed: "2020-03-15",
        prescriber: "Dr. Johnson"
      },
      { 
        name: "Metformin", 
        dosage: "500mg", 
        frequency: "Twice daily", 
        prescribed: "2019-08-22",
        prescriber: "Dr. Smith"
      },
      { 
        name: "Atorvastatin", 
        dosage: "20mg", 
        frequency: "Once daily", 
        prescribed: "2021-01-10",
        prescriber: "Dr. Wilson"
      }
    ],
    surgicalHistory: [
      {
        procedure: "Appendectomy",
        date: "2018-07-12",
        surgeon: "Dr. Brown",
        complications: "None",
        notes: "Uncomplicated laparoscopic appendectomy"
      },
      {
        procedure: "Cataract Surgery (Right Eye)",
        date: "2022-09-05",
        surgeon: "Dr. Lee",
        complications: "None",
        notes: "Successful phacoemulsification"
      }
    ],
    familyHistory: [
      { condition: "Cardiovascular Disease", relation: "Father", ageOfOnset: "65" },
      { condition: "Diabetes Type 2", relation: "Mother", ageOfOnset: "58" },
      { condition: "Breast Cancer", relation: "Sister", ageOfOnset: "45" }
    ],
    socialHistory: {
      smoking: "Former smoker (quit 2015)",
      alcohol: "Occasional social drinking",
      exercise: "Walks 30 minutes daily",
      occupation: "Office Manager",
      maritalStatus: "Married"
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Mild": return "bg-green-100 text-green-800";
      case "Moderate": return "bg-yellow-100 text-yellow-800";
      case "Severe": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-red-100 text-red-800";
      case "Controlled": return "bg-green-100 text-green-800";
      case "Resolved": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Chronic Conditions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-medical-500" />
              Chronic Conditions
            </CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {medicalHistory.chronicConditions.map((condition, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{condition.condition}</h4>
                  <p className="text-sm text-gray-600">Diagnosed: {condition.diagnosed}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(condition.status)}>
                    {condition.status}
                  </Badge>
                  <Badge className={getSeverityColor(condition.severity)}>
                    {condition.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Medications */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-medical-500" />
              Current Medications
            </CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {medicalHistory.currentMedications.map((medication, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{medication.name}</h4>
                    <p className="text-sm text-gray-600">{medication.dosage} - {medication.frequency}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Prescribed by: {medication.prescriber}</p>
                  <p>Date: {medication.prescribed}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Surgical History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-medical-500" />
              Surgical History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {medicalHistory.surgicalHistory.map((surgery, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h4 className="font-medium">{surgery.procedure}</h4>
                    <p className="text-sm text-gray-600 mb-1">{surgery.date}</p>
                    <p className="text-sm text-gray-600">Surgeon: {surgery.surgeon}</p>
                    <p className="text-sm text-gray-500">{surgery.notes}</p>
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      {surgery.complications === "None" ? "No Complications" : surgery.complications}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Family History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-medical-500" />
              Family History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {medicalHistory.familyHistory.map((history, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{history.condition}</h4>
                      <p className="text-sm text-gray-600">{history.relation}</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">
                      Age {history.ageOfOnset}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-medical-500" />
            Social History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Smoking:</span>
                <span className="ml-2 text-gray-600">{medicalHistory.socialHistory.smoking}</span>
              </div>
              <div>
                <span className="font-medium">Alcohol:</span>
                <span className="ml-2 text-gray-600">{medicalHistory.socialHistory.alcohol}</span>
              </div>
              <div>
                <span className="font-medium">Exercise:</span>
                <span className="ml-2 text-gray-600">{medicalHistory.socialHistory.exercise}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Occupation:</span>
                <span className="ml-2 text-gray-600">{medicalHistory.socialHistory.occupation}</span>
              </div>
              <div>
                <span className="font-medium">Marital Status:</span>
                <span className="ml-2 text-gray-600">{medicalHistory.socialHistory.maritalStatus}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalHistory;
