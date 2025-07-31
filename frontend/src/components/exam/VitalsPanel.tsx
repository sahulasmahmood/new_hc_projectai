
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, Thermometer, Activity, Droplets, Plus, Clock } from "lucide-react";

interface VitalsPanelProps {
  patientId: string;
}

const VitalsPanel = ({ patientId }: VitalsPanelProps) => {
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: "", diastolic: "" },
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: ""
  });

  const vitalHistory = [
    {
      time: "14:30",
      date: "2024-01-20",
      bp: "120/80",
      hr: "72",
      temp: "98.6°F",
      rr: "16",
      spo2: "98%"
    },
    {
      time: "10:15",
      date: "2024-01-20", 
      bp: "118/78",
      hr: "70",
      temp: "98.4°F",
      rr: "14",
      spo2: "99%"
    }
  ];

  const getVitalStatus = (type: string, value: string) => {
    // Simple logic for demonstration
    if (type === "bp" && value === "120/80") return "normal";
    if (type === "hr" && parseInt(value) >= 60 && parseInt(value) <= 80) return "normal";
    return "normal";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "bg-green-100 text-green-800";
      case "high": return "bg-red-100 text-red-800";
      case "low": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Vitals Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-medical-500" />
            Record New Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Pressure</label>
              <div className="flex gap-1">
                <Input
                  placeholder="Sys"
                  value={vitals.bloodPressure.systolic}
                  onChange={(e) => setVitals({
                    ...vitals,
                    bloodPressure: { ...vitals.bloodPressure, systolic: e.target.value }
                  })}
                />
                <Input
                  placeholder="Dia"
                  value={vitals.bloodPressure.diastolic}
                  onChange={(e) => setVitals({
                    ...vitals,
                    bloodPressure: { ...vitals.bloodPressure, diastolic: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Heart Rate (bpm)</label>
              <Input
                placeholder="72"
                value={vitals.heartRate}
                onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature (°F)</label>
              <Input
                placeholder="98.6"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Respiratory Rate</label>
              <Input
                placeholder="16"
                value={vitals.respiratoryRate}
                onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Oxygen Saturation (%)</label>
              <Input
                placeholder="98"
                value={vitals.oxygenSaturation}
                onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Weight (lbs)</label>
              <Input
                placeholder="170"
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Height (in)</label>
              <Input
                placeholder="70"
                value={vitals.height}
                onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button className="w-full bg-medical-500 hover:bg-medical-600">
                <Plus className="h-4 w-4 mr-2" />
                Record
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-medical-500" />
            Vital Signs History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vitalHistory.map((record, index) => (
              <div key={index} className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                <div className="text-sm">
                  <div className="font-medium">{record.date}</div>
                  <div className="text-gray-500">{record.time}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="text-sm font-medium">{record.bp}</div>
                    <Badge className={getStatusColor(getVitalStatus("bp", record.bp))}>
                      Normal
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium">{record.hr} bpm</div>
                    <Badge className={getStatusColor(getVitalStatus("hr", record.hr))}>
                      Normal
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-sm font-medium">{record.temp}</div>
                    <Badge className={getStatusColor("normal")}>
                      Normal
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-sm font-medium">{record.spo2}</div>
                    <Badge className={getStatusColor("normal")}>
                      Normal
                    </Badge>
                  </div>
                </div>

                <div className="text-sm">
                  <div className="font-medium">RR: {record.rr}</div>
                  <div className="text-gray-500">Normal</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VitalsPanel;
