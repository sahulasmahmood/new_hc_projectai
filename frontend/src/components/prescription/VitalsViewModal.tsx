import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, X, Activity, Thermometer, Droplets, Clock, Info } from "lucide-react";
import api from "@/lib/api";
import { useVitalsSettings } from "@/hooks/useVitalsSettings";

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
  const { getBloodPressureStatus, getStatus, getNormalRangeText, getBloodPressureRangeText } = useVitalsSettings();

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

  const getVitalStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return "text-green-600";
      case 'low':
        return "text-blue-600";
      case 'high':
        return "text-red-600";
      case 'critical':
        return "text-red-800";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBadgeWithRange = (vitalType: string, value?: number, sys?: number, dia?: number) => {
    if (!value && !sys) return null;
    
    let status: string;
    let rangeText: string;
    
    if (vitalType === 'bloodPressure' && sys && dia) {
      status = getBloodPressureStatus(sys, dia);
      rangeText = getBloodPressureRangeText();
    } else if (value) {
      status = getStatus(value, vitalType as any);
      rangeText = getNormalRangeText(vitalType as any);
    } else {
      return null;
    }
    
    const badgeStyles = {
      normal: "bg-green-100 text-green-800 border-green-200",
      low: "bg-blue-100 text-blue-800 border-blue-200",
      high: "bg-red-100 text-red-800 border-red-200",
      critical: "bg-red-600 text-white border-red-600",
      unknown: "bg-gray-100 text-gray-800 border-gray-200"
    };
    
    const statusLabels = {
      normal: "Normal",
      low: "Low",
      high: "High", 
      critical: "Critical",
      unknown: "Unknown"
    };
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`text-xs ml-2 border ${badgeStyles[status as keyof typeof badgeStyles]} cursor-help`}>
              {statusLabels[status as keyof typeof statusLabels]}
              <Info className="h-3 w-3 ml-1" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">Normal Range</p>
              <p className="text-sm">{rangeText}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Patient Vitals - {patientName}
          </DialogTitle>
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
                        {getStatusBadgeWithRange("bloodPressure", undefined, vital.bloodPressureSys, vital.bloodPressureDia)}
                      </div>
                      <div className={`text-lg font-semibold ${vital.bloodPressureSys && vital.bloodPressureDia ? getVitalStatusColor(getBloodPressureStatus(vital.bloodPressureSys, vital.bloodPressureDia)) : 'text-gray-500'}`}>
                        {formatBloodPressure(vital.bloodPressureSys, vital.bloodPressureDia)}
                      </div>
                    </div>

                    {/* Heart Rate */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <span className="text-sm font-medium text-gray-700">Heart Rate</span>
                        {getStatusBadgeWithRange("heartRate", vital.heartRate)}
                      </div>
                      <div className={`text-lg font-semibold ${vital.heartRate ? getVitalStatusColor(getStatus(vital.heartRate, 'heartRate')) : 'text-gray-500'}`}>
                        {formatVitalValue(vital.heartRate, " bpm")}
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Temperature</span>
                        {getStatusBadgeWithRange("temperature", vital.temperature)}
                      </div>
                      <div className={`text-lg font-semibold ${vital.temperature ? getVitalStatusColor(getStatus(vital.temperature, 'temperature')) : 'text-gray-500'}`}>
                        {formatVitalValue(vital.temperature, "°F")}
                      </div>
                    </div>

                    {/* Oxygen Saturation */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">O2 Saturation</span>
                        {getStatusBadgeWithRange("oxygenSaturation", vital.oxygenSaturation)}
                      </div>
                      <div className={`text-lg font-semibold ${vital.oxygenSaturation ? getVitalStatusColor(getStatus(vital.oxygenSaturation, 'oxygenSaturation')) : 'text-gray-500'}`}>
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