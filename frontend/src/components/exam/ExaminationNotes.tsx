import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, Eye, Ear, Heart, Wind } from "lucide-react";

interface ExaminationNotesProps {
  patientId: string;
}

const ExaminationNotes = ({ patientId }: ExaminationNotesProps) => {
  const { toast } = useToast();
  const [activeSystem, setActiveSystem] = useState("general");
  const [examData, setExamData] = useState({
    general: "",
    cardiovascular: "",
    respiratory: "",
    neurological: "",
    gastrointestinal: "",
    musculoskeletal: "",
    dermatological: ""
  });
  const [saving, setSaving] = useState(false);

  const systemsExam = [
    { id: "general", name: "General Appearance", icon: Eye, color: "text-blue-500" },
    { id: "cardiovascular", name: "Cardiovascular", icon: Heart, color: "text-red-500" },
    { id: "respiratory", name: "Respiratory", icon: Wind, color: "text-green-500" },
    { id: "neurological", name: "Neurological", icon: FileText, color: "text-purple-500" },
    { id: "gastrointestinal", name: "Gastrointestinal", icon: FileText, color: "text-yellow-500" },
    { id: "musculoskeletal", name: "Musculoskeletal", icon: FileText, color: "text-orange-500" },
    { id: "dermatological", name: "Dermatological", icon: FileText, color: "text-pink-500" }
  ];

  const previousExams = [
    {
      date: "2024-01-15",
      doctor: "Dr. Sarah Wilson",
      findings: "Patient appears well. No acute distress. Vital signs stable.",
      system: "General"
    },
    {
      date: "2024-01-10",
      doctor: "Dr. Michael Chen",
      findings: "Heart rate regular, no murmurs. BP slightly elevated.",
      system: "Cardiovascular"
    }
  ];

  const handleSystemChange = (systemId: string) => {
    setActiveSystem(systemId);
  };

  const handleNotesChange = (value: string) => {
    setExamData({
      ...examData,
      [activeSystem]: value
    });
  };

  const handleSaveFindings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Findings Saved",
        description: `${systemsExam.find(s => s.id === activeSystem)?.name} examination findings have been saved successfully.`,
      });
      
      console.log(`Saved findings for ${activeSystem}:`, examData[activeSystem as keyof typeof examData]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save findings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getSystemStatus = (systemId: string) => {
    return examData[systemId as keyof typeof examData] ? "completed" : "pending";
  };

  return (
    <div className="space-y-6">
      {/* System Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-medical-500" />
            Physical Examination by Systems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {systemsExam.map((system) => {
              const Icon = system.icon;
              const status = getSystemStatus(system.id);
              return (
                <Button
                  key={system.id}
                  variant={activeSystem === system.id ? "default" : "outline"}
                  className={`p-4 h-auto flex flex-col items-center gap-2 ${
                    activeSystem === system.id ? "bg-medical-500" : ""
                  }`}
                  onClick={() => handleSystemChange(system.id)}
                >
                  <Icon className={`h-5 w-5 ${activeSystem === system.id ? "text-white" : system.color}`} />
                  <span className="text-xs text-center">{system.name}</span>
                  <Badge 
                    className={`text-xs ${
                      status === "completed" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {status}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active System Examination */}
      <Card>
        <CardHeader>
          <CardTitle>
            {systemsExam.find(s => s.id === activeSystem)?.name} Examination
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveFindings(); }}>
            <Textarea
              placeholder={`Enter ${systemsExam.find(s => s.id === activeSystem)?.name.toLowerCase()} examination findings...`}
              value={examData[activeSystem as keyof typeof examData]}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="min-h-32"
              required
            />
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleString()}
              </div>
              <Button 
                type="submit"
                className="bg-medical-500 hover:bg-medical-600"
                disabled={saving || !examData[activeSystem as keyof typeof examData].trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Findings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Previous Examinations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-medical-500" />
            Previous Examination Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {previousExams.map((exam, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Badge className="bg-medical-100 text-medical-800 mb-2">
                      {exam.system}
                    </Badge>
                    <p className="font-medium">{exam.doctor}</p>
                    <p className="text-sm text-gray-500">{exam.date}</p>
                  </div>
                </div>
                <p className="text-gray-700">{exam.findings}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExaminationNotes;
