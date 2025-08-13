import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Thermometer,
  Activity,
  Droplets,
  Plus,
  Clock,
  Info,
  Edit2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface VitalsPanelProps {
  patientId: string;
  appointmentId?: string;
}

interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

interface VitalsApiResponse {
  data: VitalRecord;
  message?: string;
}

const VitalsPanel = ({ patientId, appointmentId }: VitalsPanelProps) => {
  const { toast } = useToast();
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: "", diastolic: "" },
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
  });
  const [vitalHistory, setVitalHistory] = useState<VitalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [existingVitals, setExistingVitals] = useState<VitalRecord | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VitalRecord | null>(null);

  // Fetch vitals history and check for existing vitals for this appointment
  useEffect(() => {
    const fetchVitals = async () => {
      try {
        setLoading(true);

        // Fetch vitals history
        const historyResponse: ApiResponse<VitalRecord[]> = await api.get(
          `/vitals/patient/${patientId}`
        );
        setVitalHistory(historyResponse.data);

        // If we have an appointmentId, check if vitals already exist for this appointment
        if (appointmentId) {
          try {
            const existingResponse: ApiResponse<VitalRecord> = await api.get(
              `/vitals/patient/${patientId}/appointment/${appointmentId}`
            );
            const existing = existingResponse.data;
            setExistingVitals(existing);
            setIsUpdating(true);

            // Pre-fill the form with existing data
            setVitals({
              bloodPressure: {
                systolic: existing.bloodPressureSys?.toString() || "",
                diastolic: existing.bloodPressureDia?.toString() || "",
              },
              heartRate: existing.heartRate?.toString() || "",
              temperature: existing.temperature?.toString() || "",
              respiratoryRate: existing.respiratoryRate?.toString() || "",
              oxygenSaturation: existing.oxygenSaturation?.toString() || "",
              weight: existing.weight?.toString() || "",
              height: existing.height?.toString() || "",
            });
          } catch (error) {
            // No existing vitals found for this appointment - that's fine
            setExistingVitals(null);
            setIsUpdating(false);
          }
        }
      } catch (error) {
        console.error("Error fetching vitals:", error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchVitals();
    }
  }, [patientId, appointmentId]);

  const getVitalStatus = (
    type: string,
    value: string | number | { sys: number; dia: number } | null | undefined
  ) => {
    switch (type) {
      case "bp": {
        if (
          !value ||
          typeof value !== "object" ||
          !("sys" in value) ||
          !("dia" in value)
        )
          return "unknown";
        const sys = parseInt(String(value.sys));
        const dia = parseInt(String(value.dia));
        if (isNaN(sys) || isNaN(dia)) return "unknown";
        if (sys >= 140 || dia >= 90) return "high";
        if (sys >= 120 || dia >= 80) return "elevated";
        return "normal";
      }

      case "hr": {
        if (value === null || value === undefined) return "unknown";
        const hr = parseInt(String(value));
        if (isNaN(hr)) return "unknown";
        if (hr < 60 || hr > 100) return "elevated";
        return "normal";
      }

      case "temp": {
        if (value === null || value === undefined) return "unknown";
        const temp = parseFloat(String(value));
        if (isNaN(temp)) return "unknown";
        if (temp >= 100.4) return "high";
        if (temp >= 99.1) return "elevated";
        return "normal";
      }

      case "spo2": {
        if (value === null || value === undefined) return "unknown";
        const spo2 = parseInt(String(value));
        if (isNaN(spo2)) return "unknown";
        if (spo2 < 95) return "low";
        return "normal";
      }

      case "rr": {
        if (value === null || value === undefined) return "unknown";
        const rr = parseInt(String(value));
        if (isNaN(rr)) return "unknown";
        if (rr < 12 || rr > 20) return "elevated";
        return "normal";
      }

      default:
        return "normal";
    }
  };

  const handleSaveVitals = async () => {
    // Check if at least one vital is filled
    const hasData =
      vitals.bloodPressure.systolic ||
      vitals.bloodPressure.diastolic ||
      vitals.heartRate ||
      vitals.temperature ||
      vitals.respiratoryRate ||
      vitals.oxygenSaturation ||
      vitals.weight ||
      vitals.height;

    if (!hasData) {
      toast({
        title: "No Data",
        description: "Please enter at least one vital sign measurement",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const vitalsData = {
        patientId: parseInt(patientId),
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        bloodPressureSys: vitals.bloodPressure.systolic || null,
        bloodPressureDia: vitals.bloodPressure.diastolic || null,
        heartRate: vitals.heartRate || null,
        temperature: vitals.temperature || null,
        respiratoryRate: vitals.respiratoryRate || null,
        oxygenSaturation: vitals.oxygenSaturation || null,
        weight: vitals.weight || null,
        height: vitals.height || null,
        recordedBy: "Doctor", // This should come from auth context
      };

      let response: VitalsApiResponse;
      let wasUpdated = false;

      if (editingRecord) {
        // Update existing record using PUT
        response = await api.put(`/vitals/${editingRecord.id}`, vitalsData);
        wasUpdated = true;
      } else {
        // Create new or upsert for appointment
        response = await api.post("/vitals", vitalsData);
        wasUpdated = response.message?.includes("updated") || false;
      }

      toast({
        title: wasUpdated ? "Vitals Updated" : "Vitals Recorded",
        description: wasUpdated
          ? "Patient vitals have been updated successfully"
          : "Patient vitals have been saved successfully",
      });

      // Clear form after successful save unless we're updating appointment vitals
      if (editingRecord || !appointmentId) {
        clearForm();
      } else {
        // Update the existing vitals reference for appointment
        setExistingVitals(response.data);
      }

      // Refresh vitals history
      const historyResponse: ApiResponse<VitalRecord[]> = await api.get(
        `/vitals/patient/${patientId}`
      );
      setVitalHistory(historyResponse.data);
    } catch (error) {
      console.error("Error saving vitals:", error);
      toast({
        title: "Error",
        description: "Failed to save vitals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-800";
      case "elevated":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const clearForm = () => {
    setVitals({
      bloodPressure: { systolic: "", diastolic: "" },
      heartRate: "",
      temperature: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      weight: "",
      height: "",
    });
    setExistingVitals(null);
    setIsUpdating(false);
    setEditingRecord(null);
  };

  const handleEditVitals = (record: VitalRecord) => {
    setEditingRecord(record);
    setVitals({
      bloodPressure: {
        systolic: record.bloodPressureSys?.toString() || "",
        diastolic: record.bloodPressureDia?.toString() || "",
      },
      heartRate: record.heartRate?.toString() || "",
      temperature: record.temperature?.toString() || "",
      respiratoryRate: record.respiratoryRate?.toString() || "",
      oxygenSaturation: record.oxygenSaturation?.toString() || "",
      weight: record.weight?.toString() || "",
      height: record.height?.toString() || "",
    });
    setIsUpdating(true);
  };

  const handleDeleteVitals = async (recordId: number) => {
    if (!confirm("Are you sure you want to delete this vitals record?")) {
      return;
    }

    try {
      setDeleting(recordId);
      await api.delete(`/vitals/${recordId}`);

      toast({
        title: "Vitals Deleted",
        description: "Vitals record has been deleted successfully",
      });

      // Refresh vitals history
      const historyResponse: ApiResponse<VitalRecord[]> = await api.get(
        `/vitals/patient/${patientId}`
      );
      setVitalHistory(historyResponse.data);

      // If we deleted the current appointment's vitals, reset the form
      if (existingVitals && existingVitals.id === recordId) {
        clearForm();
      }
    } catch (error) {
      console.error("Error deleting vitals:", error);
      toast({
        title: "Error",
        description: "Failed to delete vitals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatVitalValue = (vital: VitalRecord) => {
    const bp =
      vital.bloodPressureSys && vital.bloodPressureDia
        ? `${vital.bloodPressureSys}/${vital.bloodPressureDia}`
        : null;
    const hr = vital.heartRate ? `${vital.heartRate}` : null;
    const temp = vital.temperature ? `${vital.temperature}°F` : null;
    const rr = vital.respiratoryRate ? `${vital.respiratoryRate}` : null;
    const spo2 = vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : null;

    return { bp, hr, temp, rr, spo2 };
  };

  return (
    <div className="space-y-6">
      {/* Current Vitals Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-medical-500" />
            {editingRecord
              ? "Edit Vitals Record"
              : isUpdating
              ? "Update Vitals"
              : "Record New Vitals"}
            {(isUpdating || editingRecord) && (
              <Badge className="bg-blue-100 text-blue-800 ml-2">
                {editingRecord ? "Editing" : "Updating Existing"}
              </Badge>
            )}
          </CardTitle>
          {editingRecord && (
            <p className="text-sm text-gray-600">
              Editing vitals record from{" "}
              {new Date(editingRecord.createdAt).toLocaleDateString()}.
              <br />
              <span className="text-xs text-gray-500">
                Last updated:{" "}
                {new Date(editingRecord.updatedAt).toLocaleString()}
              </span>
            </p>
          )}
          {isUpdating && existingVitals && !editingRecord && (
            <p className="text-sm text-gray-600">
              Vitals already exist for this appointment. You can update them
              below.
              <br />
              <span className="text-xs text-gray-500">
                Last updated:{" "}
                {new Date(existingVitals.updatedAt).toLocaleString()}
              </span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  Blood Pressure (mmHg)
                </label>
                <div className="group relative">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    <div className="text-center">
                      <div>Systolic (120) = heart contracts</div>
                      <div>Diastolic (80) = heart relaxes</div>
                      <div className="font-semibold">Normal: 120/80</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 items-center">
                <Input
                  placeholder="120"
                  value={vitals.bloodPressure.systolic}
                  onChange={(e) =>
                    setVitals({
                      ...vitals,
                      bloodPressure: {
                        ...vitals.bloodPressure,
                        systolic: e.target.value,
                      },
                    })
                  }
                  className="text-center"
                />
                <span className="text-gray-500 font-medium">/</span>
                <Input
                  placeholder="80"
                  value={vitals.bloodPressure.diastolic}
                  onChange={(e) =>
                    setVitals({
                      ...vitals,
                      bloodPressure: {
                        ...vitals.bloodPressure,
                        diastolic: e.target.value,
                      },
                    })
                  }
                  className="text-center"
                />
              </div>
              <div className="text-xs text-gray-500 text-center">
                Systolic / Diastolic
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Heart Rate (bpm)</label>
              <Input
                placeholder="72"
                value={vitals.heartRate}
                onChange={(e) =>
                  setVitals({ ...vitals, heartRate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature (°F)</label>
              <Input
                placeholder="98.6"
                value={vitals.temperature}
                onChange={(e) =>
                  setVitals({ ...vitals, temperature: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Respiratory Rate</label>
              <Input
                placeholder="16"
                value={vitals.respiratoryRate}
                onChange={(e) =>
                  setVitals({ ...vitals, respiratoryRate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Oxygen Saturation (%)
              </label>
              <Input
                placeholder="98"
                value={vitals.oxygenSaturation}
                onChange={(e) =>
                  setVitals({ ...vitals, oxygenSaturation: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Weight (lbs)</label>
              <Input
                placeholder="170"
                value={vitals.weight}
                onChange={(e) =>
                  setVitals({ ...vitals, weight: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Height (in)</label>
              <Input
                placeholder="70"
                value={vitals.height}
                onChange={(e) =>
                  setVitals({ ...vitals, height: e.target.value })
                }
              />
            </div>

            <div className="flex items-end space-x-2">
              <Button
                className="flex-1 bg-medical-500 hover:bg-medical-600"
                onClick={handleSaveVitals}
                disabled={saving}
              >
                <Plus className="h-4 w-4 mr-2" />
                {saving
                  ? editingRecord
                    ? "Saving..."
                    : isUpdating
                    ? "Updating..."
                    : "Recording..."
                  : editingRecord
                  ? "Save Changes"
                  : isUpdating
                  ? "Update"
                  : "Record"}
              </Button>
              {editingRecord && (
                <Button variant="outline" onClick={clearForm} disabled={saving}>
                  Cancel
                </Button>
              )}
              {!editingRecord &&
                (isUpdating ||
                  vitals.bloodPressure.systolic ||
                  vitals.heartRate ||
                  vitals.temperature) && (
                  <Button
                    variant="outline"
                    onClick={clearForm}
                    disabled={saving}
                    className="px-3"
                  >
                    Clear
                  </Button>
                )}
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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading vitals history...</p>
            </div>
          ) : vitalHistory.length > 0 ? (
            <div className="space-y-4">
              {vitalHistory.map((record) => {
                const formatted = formatVitalValue(record);
                const isCurrentAppointment =
                  appointmentId &&
                  record.appointmentId === parseInt(appointmentId);
                return (
                  <div
                    key={record.id}
                    className={`relative grid grid-cols-2 md:grid-cols-6 gap-4 p-4 border rounded-lg ${
                      isCurrentAppointment
                        ? "border-medical-500 bg-medical-50"
                        : ""
                    }`}
                  >
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditVitals(record)}
                        disabled={saving || deleting === record.id}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                      >
                        <Edit2 className="h-3 w-3 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteVitals(record.id)}
                        disabled={saving || deleting === record.id}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                      >
                        {deleting === record.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-red-600 border-t-transparent" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-red-600" />
                        )}
                      </Button>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">
                        {new Date(record.createdAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </div>
                      <div className="text-gray-500">
                        {new Date(record.createdAt).toLocaleTimeString(
                          "en-GB",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {record.recordedBy}
                      </div>
                      {isCurrentAppointment && (
                        <Badge className="bg-medical-500 text-white text-xs mt-1">
                          Current Visit
                        </Badge>
                      )}
                    </div>

                    {formatted.bp && (
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="text-sm font-medium">
                            {formatted.bp}
                          </div>
                          {(() => {
                            const bpStatus = getVitalStatus("bp", {
                              sys: record.bloodPressureSys,
                              dia: record.bloodPressureDia,
                            });
                            return (
                              <Badge className={getStatusColor(bpStatus)}>
                                {bpStatus}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {formatted.hr && (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium">
                            {formatted.hr} bpm
                          </div>
                          {(() => {
                            const hrStatus = getVitalStatus(
                              "hr",
                              record.heartRate
                            );
                            return (
                              <Badge className={getStatusColor(hrStatus)}>
                                {hrStatus}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {formatted.temp && (
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="text-sm font-medium">
                            {formatted.temp}
                          </div>
                          {(() => {
                            const tempStatus = getVitalStatus(
                              "temp",
                              record.temperature
                            );
                            return (
                              <Badge className={getStatusColor(tempStatus)}>
                                {tempStatus}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {formatted.spo2 && (
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-sm font-medium">
                            {formatted.spo2}
                          </div>
                          {(() => {
                            const spo2Status = getVitalStatus(
                              "spo2",
                              record.oxygenSaturation
                            );
                            return (
                              <Badge className={getStatusColor(spo2Status)}>
                                {spo2Status}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {formatted.rr && (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="text-sm font-medium">
                            {formatted.rr} /min
                          </div>
                          {(() => {
                            const rrStatus = getVitalStatus(
                              "rr",
                              record.respiratoryRate
                            );
                            return (
                              <Badge className={getStatusColor(rrStatus)}>
                                {rrStatus}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {(record.weight || record.height) && (
                      <div className="text-sm">
                        {record.weight && (
                          <div className="font-medium">
                            Weight: {record.weight} lbs
                          </div>
                        )}
                        {record.height && (
                          <div className="font-medium">
                            Height: {record.height} in
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Vitals Recorded
              </h3>
              <p className="text-gray-600">
                Record the first set of vitals for this patient.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VitalsPanel;
