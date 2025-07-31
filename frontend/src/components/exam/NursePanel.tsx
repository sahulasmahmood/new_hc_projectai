
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Clock, FileText, AlertCircle, Pill, ThermometerSun } from "lucide-react";

interface NursePanelProps {
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    roomNumber: string;
    condition: string;
  };
}

const NursePanel = ({ patient }: NursePanelProps) => {
  const [vitals, setVitals] = useState({
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: ""
  });

  const [careNotes, setCareNotes] = useState("");
  const [medicationTime, setMedicationTime] = useState("");

  const nursingTasks = [
    { task: "Morning vitals", time: "08:00", status: "completed", priority: "high" },
    { task: "Medication administration", time: "09:00", status: "pending", priority: "high" },
    { task: "Wound care assessment", time: "10:30", status: "pending", priority: "medium" },
    { task: "Patient education", time: "14:00", status: "scheduled", priority: "low" },
    { task: "Evening vitals", time: "18:00", status: "scheduled", priority: "high" }
  ];

  const medicationSchedule = [
    { medication: "Lisinopril 10mg", time: "08:00", status: "given", nurse: "Jane Doe" },
    { medication: "Metformin 500mg", time: "08:00", status: "given", nurse: "Jane Doe" },
    { medication: "Lisinopril 10mg", time: "20:00", status: "due", nurse: "" },
    { medication: "Metformin 500mg", time: "20:00", status: "due", nurse: "" }
  ];

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-medical-500" />
            Patient Overview - Room {patient.roomNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold">{patient.name}</h3>
              <p className="text-gray-600">{patient.age} years old • {patient.gender}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Primary Condition</p>
              <Badge className="bg-medical-100 text-medical-800">{patient.condition}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Current Time</p>
              <p className="text-gray-600">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Care Tasks</TabsTrigger>
          <TabsTrigger value="vitals">Record Vitals</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="notes">Care Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-medical-500" />
                Today's Care Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nursingTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                      <div>
                        <p className="font-medium">{task.task}</p>
                        <p className="text-sm text-gray-600">Scheduled: {task.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTaskStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      {task.status === "pending" && (
                        <Button size="sm" className="bg-medical-500 hover:bg-medical-600">
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThermometerSun className="h-5 w-5 text-medical-500" />
                Record Patient Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperature (°F)</label>
                  <Input
                    placeholder="98.6"
                    value={vitals.temperature}
                    onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Blood Pressure</label>
                  <Input
                    placeholder="120/80"
                    value={vitals.bloodPressure}
                    onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Heart Rate (bpm)</label>
                  <Input
                    placeholder="72"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals({...vitals, heartRate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Respiratory Rate</label>
                  <Input
                    placeholder="16"
                    value={vitals.respiratoryRate}
                    onChange={(e) => setVitals({...vitals, respiratoryRate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Oxygen Saturation (%)</label>
                  <Input
                    placeholder="98"
                    value={vitals.oxygenSaturation}
                    onChange={(e) => setVitals({...vitals, oxygenSaturation: e.target.value})}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button className="w-full bg-medical-500 hover:bg-medical-600">
                    Record Vitals
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-medical-500" />
                Medication Administration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medicationSchedule.map((med, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{med.medication}</h4>
                      <p className="text-sm text-gray-600">Due: {med.time}</p>
                      {med.nurse && (
                        <p className="text-sm text-gray-500">Given by: {med.nurse}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTaskStatusColor(med.status === "given" ? "completed" : "pending")}>
                        {med.status}
                      </Badge>
                      {med.status === "due" && (
                        <Button size="sm" className="bg-medical-500 hover:bg-medical-600">
                          Mark Given
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-medical-500" />
                Nursing Care Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Document patient care activities, observations, and any concerns..."
                  value={careNotes}
                  onChange={(e) => setCareNotes(e.target.value)}
                  className="min-h-32"
                />
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Nurse: Current User • {new Date().toLocaleString()}
                  </div>
                  <Button className="bg-medical-500 hover:bg-medical-600">
                    Save Notes
                  </Button>
                </div>
              </div>

              {/* Previous Notes */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3">Previous Care Notes</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">Mary Johnson, RN</span>
                      <span className="text-sm text-gray-500">2024-01-20 14:30</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Patient ambulating well. No complaints of pain. Vital signs stable. 
                      Patient education provided regarding medication compliance.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">Sarah Wilson, RN</span>
                      <span className="text-sm text-gray-500">2024-01-20 08:15</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Morning assessment completed. Patient alert and oriented. 
                      Blood pressure elevated, notified physician. Medications given as scheduled.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NursePanel;
