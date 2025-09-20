import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Activity, Thermometer, Droplets, Clock } from "lucide-react";
import api from "@/lib/api";

interface VitalRecord {
  id: number;
  patientId: number;
  appointmentId?: number;
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  recordedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface VitalsViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  appointmentId?: string;
}

const VitalsViewModal = ({ isOpen, onClose, patientId, patientName, appointmentId }: VitalsViewModalProps) => {
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVitals();
    }
  }, [isOpen, patientId]);

  const fetchVitals = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vitals/patient/${patientId}?limit=10`);
      setVitals(response.data || []);
    } catch (error) {
      console.error("Error fetching vitals:", error);
      setVitals([]);
    } finally {
      setLoading(false);
    }
  };

  const formatVitalValue = (value: number | undefined, unit: string) => {
    return value ? `${value}${unit}` : "N/A";
  };

  const formatBloodPressure = (sys?: number, dia?: number) => {
    if (sys && dia) return `${sys}/${dia} mmHg`;
    if (sys) return `${sys}/- mmHg`;
    return "N/A";
  };

  const getVitalStatus = (vital: string, value?: number) => {
    if (!value) return "text-gray-500";
    
    switch (vital) {
      case "heartRate":
        if (value < 60 || value > 100) return "text-red-600";
        return "text-green-600";
      case "temperature":
        if (value < 97 || value > 99.5) return "text-red-600";
        return "text-green-600";
      case "oxygenSaturation":
        if (value < 95) return "text-red-600";
        return "text-green-600";
      case "bloodPressure":
        if (value > 140 || value < 90) return "text-red-600";
        return "text-green-600";
      default:
        return "text-gray-700";
    }
  };

  const getStatusBadge = (vital: string, value?: number) => {
    if (!value) return null;
    
    const isAbnormal = getVitalStatus(vital, value) === "text-red-600";
    if (isAbnormal) {
      return <Badge variant="destructive" className="text-xs ml-2">Abnormal</Badge>;
    }
    return <Badge variant="secondary" className="text-xs ml-2 bg-green-100 text-green-800">Normal</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Patient Vitals - {patientName}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3">Loading vitals...</span>
            </div>
          ) : vitals.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Vitals Recorded</h3>
              <p className="text-gray-500">No vital signs have been recorded for this patient yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vitals.map((vital, index) => (
                <div key={vital.id} className={`p-4 rounded-lg border ${index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                        {index === 0 ? "Latest" : `${index + 1} previous`}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(vital.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">Recorded by: {vital.recordedBy || 'Unknown'}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Blood Pressure */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-gray-700">Blood Pressure</span>
                        {getStatusBadge("bloodPressure", vital.bloodPressureSys)}
                      </div>
                      <div className={`text-lg font-semibold ${getVitalStatus("bloodPressure", vital.bloodPressureSys)}`}>
                        {formatBloodPressure(vital.bloodPressureSys, vital.bloodPressureDia)}
                      </div>
                    </div>

                    {/* Heart Rate */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <span className="text-sm font-medium text-gray-700">Heart Rate</span>
                        {getStatusBadge("heartRate", vital.heartRate)}
                      </div>
                      <div className={`text-lg font-semibold ${getVitalStatus("heartRate", vital.heartRate)}`}>
                        {formatVitalValue(vital.heartRate, " bpm")}
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Temperature</span>
                        {getStatusBadge("temperature", vital.temperature)}
                      </div>
                      <div className={`text-lg font-semibold ${getVitalStatus("temperature", vital.temperature)}`}>
                        {formatVitalValue(vital.temperature, "°F")}
                      </div>
                    </div>

                    {/* Oxygen Saturation */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">O2 Saturation</span>
                        {getStatusBadge("oxygenSaturation", vital.oxygenSaturation)}
                      </div>
                      <div className={`text-lg font-semibold ${getVitalStatus("oxygenSaturation", vital.oxygenSaturation)}`}>
                        {formatVitalValue(vital.oxygenSaturation, "%")}
                      </div>
                    </div>
                  </div>

                  {/* Additional Vitals */}
                  {(vital.respiratoryRate || vital.weight || vital.height) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                      {vital.respiratoryRate && (
                        <div>
                          <span className="text-sm text-gray-600">Respiratory Rate</span>
                          <div className="text-base font-medium">{vital.respiratoryRate} /min</div>
                        </div>
                      )}
                      {vital.weight && (
                        <div>
                          <span className="text-sm text-gray-600">Weight</span>
                          <div className="text-base font-medium">{vital.weight} lbs</div>
                        </div>
                      )}
                      {vital.height && (
                        <div>
                          <span className="text-sm text-gray-600">Height</span>
                          <div className="text-base font-medium">{vital.height} inches</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Notes */}
                  {vital.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Notes:</span>
                      <p className="text-sm text-gray-600 mt-1">{vital.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VitalsViewModal;