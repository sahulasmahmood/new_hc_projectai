
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileImage, FileText, Calendar, Upload, Download, Eye } from "lucide-react";

interface DiagnosticToolsProps {
  patientId: string;
}

const DiagnosticTools = ({ patientId }: DiagnosticToolsProps) => {
  const [selectedTest, setSelectedTest] = useState("");

  const labResults = [
    {
      test: "Complete Blood Count (CBC)",
      date: "2024-01-18",
      status: "Completed",
      results: {
        "WBC": { value: "7.2", range: "4.0-11.0", unit: "K/uL", status: "Normal" },
        "RBC": { value: "4.5", range: "4.2-5.4", unit: "M/uL", status: "Normal" },
        "Hemoglobin": { value: "14.2", range: "12.0-16.0", unit: "g/dL", status: "Normal" },
        "Hematocrit": { value: "42.1", range: "36.0-46.0", unit: "%", status: "Normal" }
      }
    },
    {
      test: "Basic Metabolic Panel",
      date: "2024-01-18",
      status: "Completed",
      results: {
        "Glucose": { value: "125", range: "70-100", unit: "mg/dL", status: "High" },
        "Sodium": { value: "140", range: "136-145", unit: "mEq/L", status: "Normal" },
        "Potassium": { value: "4.1", range: "3.5-5.1", unit: "mEq/L", status: "Normal" },
        "Creatinine": { value: "1.0", range: "0.7-1.3", unit: "mg/dL", status: "Normal" }
      }
    }
  ];

  const imagingStudies = [
    {
      study: "Chest X-Ray",
      date: "2024-01-17",
      status: "Completed",
      findings: "Clear lung fields. No acute cardiopulmonary abnormalities.",
      radiologist: "Dr. Patricia Adams"
    },
    {
      study: "ECG - 12 Lead",
      date: "2024-01-15",
      status: "Completed",
      findings: "Normal sinus rhythm. No ST changes. Normal axis.",
      cardiologist: "Dr. Robert Chen"
    }
  ];

  const availableTests = [
    { category: "Blood Tests", tests: ["CBC", "BMP", "Lipid Panel", "HbA1c", "Thyroid Function"] },
    { category: "Imaging", tests: ["Chest X-Ray", "CT Scan", "MRI", "Ultrasound", "ECG"] },
    { category: "Specialized", tests: ["Stress Test", "Echo", "Pulmonary Function", "Endoscopy"] }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal": return "bg-green-100 text-green-800";
      case "High": return "bg-red-100 text-red-800";
      case "Low": return "bg-blue-100 text-blue-800";
      case "Critical": return "bg-red-600 text-white";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="results" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results">Lab Results</TabsTrigger>
          <TabsTrigger value="imaging">Imaging Studies</TabsTrigger>
          <TabsTrigger value="order">Order Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <div className="space-y-4">
            {labResults.map((lab, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{lab.test}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">{lab.status}</Badge>
                      <span className="text-sm text-gray-500">{lab.date}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(lab.results).map(([test, result]) => (
                      <div key={test} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{test}</span>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{result.value} {result.unit}</span>
                          <span className="ml-2">Range: {result.range} {result.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="imaging">
          <div className="space-y-4">
            {imagingStudies.map((study, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <FileImage className="h-5 w-5 text-medical-500" />
                      {study.study}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">{study.status}</Badge>
                      <span className="text-sm text-gray-500">{study.date}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-1">Findings:</h4>
                      <p className="text-gray-700">{study.findings}</p>
                    </div>
                    <div>
                      <span className="font-medium">Reviewed by: </span>
                      <span className="text-gray-600">
                        {study.radiologist || study.cardiologist}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileImage className="h-4 w-4 mr-2" />
                        View Images
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="order">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-medical-500" />
                  Order New Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableTests.map((category, index) => (
                    <div key={index}>
                      <h4 className="font-semibold mb-2">{category.category}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {category.tests.map((test) => (
                          <Button
                            key={test}
                            variant={selectedTest === test ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTest(selectedTest === test ? "" : test)}
                            className={selectedTest === test ? "bg-medical-500" : ""}
                          >
                            {test}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedTest && (
                  <div className="mt-6 p-4 border rounded-lg bg-medical-50">
                    <h4 className="font-medium mb-2">Selected Test: {selectedTest}</h4>
                    <div className="flex gap-2">
                      <Button className="bg-medical-500 hover:bg-medical-600">
                        Order Test
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedTest("")}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiagnosticTools;
