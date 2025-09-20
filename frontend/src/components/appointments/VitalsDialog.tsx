import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  type: string;
  duration: string;
  status: string;
  notes?: string;
  patientVisibleId?: string;
}

interface VitalsDialogProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onVitalsSaved?: () => void;
}

interface VitalsData {
  bloodPressureSys: string;
  bloodPressureDia: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  recordedBy: string;
  notes: string;
}

const VitalsDialog = ({ appointment, isOpen, onClose, onVitalsSaved }: VitalsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vitalsData, setVitalsData] = useState<VitalsData>({
    bloodPressureSys: "",
    bloodPressureDia: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
    recordedBy: "Nurse",
    notes: ""
  });

  // Load existing vitals if any
  useEffect(() => {
    if (isOpen && appointment) {
      loadExistingVitals();
    }
  }, [isOpen, appointment]);

  const loadExistingVitals = async () => {
    try {
      const response = await api.get(`/vitals/patient/${appointment.patientId}/appointment/${appointment.id}`);
      if (response.data) {
        const vitals = response.data;
        setVitalsData({
          bloodPressureSys: vitals.bloodPressureSys?.toString() || "",
          bloodPressureDia: vitals.bloodPressureDia?.toString() || "",
          heartRate: vitals.heartRate?.toString() || "",
          temperature: vitals.temperature?.toString() || "",
          respiratoryRate: vitals.respiratoryRate?.toString() || "",
          oxygenSaturation: vitals.oxygenSaturation?.toString() || "",
          weight: vitals.weight?.toString() || "",
          height: vitals.height?.toString() || "",
          recordedBy: vitals.recordedBy || "Nurse",
          notes: vitals.notes || ""
        });
      }
    } catch (error) {
      // No existing vitals found, keep empty form
      console.log("No existing vitals found");
    }
  };

  const handleInputChange = (field: keyof VitalsData, value: string) => {
    setVitalsData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const payload = {
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        ...vitalsData
      };

      await api.post("/vitals", payload);

      toast({
        title: "Vitals Recorded",
        description: `Vitals have been successfully recorded for ${appointment.patientName}`,
      });

      onVitalsSaved?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving vitals:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save vitals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVitalsData({
      bloodPressureSys: "",
      bloodPressureDia: "",
      heartRate: "",
      temperature: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      weight: "",
      height: "",
      recordedBy: "Nurse",
      notes: ""
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Record Vitals - {appointment.patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Patient:</span> {appointment.patientName}
              </div>
              <div>
                <span className="font-medium">ID:</span> {appointment.patientVisibleId}
              </div>
              <div>
                <span className="font-medium">Appointment:</span> {new Date(appointment.date).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Time:</span> {appointment.time}
              </div>
            </div>
          </div>

          {/* Vitals Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blood Pressure */}
            <div className="space-y-2">
              <Label>Blood Pressure (mmHg)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Systolic"
                  value={vitalsData.bloodPressureSys}
                  onChange={(e) => handleInputChange("bloodPressureSys", e.target.value)}
                  type="number"
                />
                <span className="self-center">/</span>
                <Input
                  placeholder="Diastolic"
                  value={vitalsData.bloodPressureDia}
                  onChange={(e) => handleInputChange("bloodPressureDia", e.target.value)}
                  type="number"
                />
              </div>
            </div>

            {/* Heart Rate */}
            <div className="space-y-2">
              <Label>Heart Rate (bpm)</Label>
              <Input
                placeholder="e.g., 72"
                value={vitalsData.heartRate}
                onChange={(e) => handleInputChange("heartRate", e.target.value)}
                type="number"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label>Temperature (°F)</Label>
              <Input
                placeholder="e.g., 98.6"
                value={vitalsData.temperature}
                onChange={(e) => handleInputChange("temperature", e.target.value)}
                type="number"
                step="0.1"
              />
            </div>

            {/* Respiratory Rate */}
            <div className="space-y-2">
              <Label>Respiratory Rate (per min)</Label>
              <Input
                placeholder="e.g., 16"
                value={vitalsData.respiratoryRate}
                onChange={(e) => handleInputChange("respiratoryRate", e.target.value)}
                type="number"
              />
            </div>

            {/* Oxygen Saturation */}
            <div className="space-y-2">
              <Label>Oxygen Saturation (%)</Label>
              <Input
                placeholder="e.g., 98"
                value={vitalsData.oxygenSaturation}
                onChange={(e) => handleInputChange("oxygenSaturation", e.target.value)}
                type="number"
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label>Weight (lbs)</Label>
              <Input
                placeholder="e.g., 150"
                value={vitalsData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                type="number"
                step="0.1"
              />
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label>Height (inches)</Label>
              <Input
                placeholder="e.g., 68"
                value={vitalsData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                type="number"
                step="0.1"
              />
            </div>

            {/* Recorded By */}
            <div className="space-y-2">
              <Label>Recorded By</Label>
              <Input
                placeholder="e.g., Nurse, Doctor"
                value={vitalsData.recordedBy}
                onChange={(e) => handleInputChange("recordedBy", e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional notes about the vitals..."
              value={vitalsData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Vitals"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VitalsDialog;