import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Clock, Calendar, Settings, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface TimeSlot {
  id: string;
  time: string;
  isActive: boolean;
}

interface Duration {
  value: string;
  label: string;
  isActive: boolean;
}

interface AppointmentSettings {
  timeSlots: TimeSlot[];
  durations: Duration[];
  workingHours: {
    start: string;
    end: string;
  };
  breakTime: {
    start: string;
    end: string;
  };
  appointmentTypes: string[];
  maxAppointmentsPerDay: number;
  allowOverlapping: boolean;
  bufferTime: number;
  advanceBookingDays: number;
  autoGenerateSlots: boolean;
  defaultDuration: string;
}

const AppointmentSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppointmentSettings>({
    timeSlots: [],
    durations: [
      { value: "15", label: "15 minutes", isActive: true },
      { value: "30", label: "30 minutes", isActive: true },
      { value: "45", label: "45 minutes", isActive: true },
      { value: "60", label: "1 hour", isActive: true },
      { value: "90", label: "1.5 hours", isActive: false },
      { value: "120", label: "2 hours", isActive: false },
    ],
    workingHours: {
      start: "08:00",
      end: "18:00"
    },
    breakTime: {
      start: "12:00",
      end: "13:00"
    },
    appointmentTypes: [
      "Consultation",
      "Follow-up", 
      "Emergency",
      "Routine Checkup",
      "Specialist Visit",
      "Lab Test",
      "Vaccination"
    ],
    maxAppointmentsPerDay: 50,
    allowOverlapping: false,
    bufferTime: 15,
    advanceBookingDays: 30,
    autoGenerateSlots: true,
    defaultDuration: "30"
  });

  const [isLoading, setIsLoading] = useState(false);
  const [newAppointmentType, setNewAppointmentType] = useState("");
  const [newDurationValue, setNewDurationValue] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-generate time slots based on working hours and duration
  const generateTimeSlots = (startTime: string, endTime: string, durationMinutes: number, breakStart: string, breakEnd: string) => {
    const slots: TimeSlot[] = [];
    const currentTime = new Date(`2000-01-01 ${startTime}`);
    const endDateTime = new Date(`2000-01-01 ${endTime}`);
    const breakStartTime = new Date(`2000-01-01 ${breakStart}`);
    const breakEndTime = new Date(`2000-01-01 ${breakEnd}`);

    while (currentTime < endDateTime) {
      const timeString = currentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      // Skip break time
      if (currentTime >= breakStartTime && currentTime < breakEndTime) {
        currentTime.setMinutes(currentTime.getMinutes() + durationMinutes);
        continue;
      }

      slots.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        time: timeString,
        isActive: true
      });

      currentTime.setMinutes(currentTime.getMinutes() + durationMinutes);
    }

    return slots;
  };

  // Update time slots when working hours or default duration changes
  useEffect(() => {
    if (settings.autoGenerateSlots && settings.workingHours.start && settings.workingHours.end && settings.defaultDuration) {
      const newSlots = generateTimeSlots(
        settings.workingHours.start,
        settings.workingHours.end,
        parseInt(settings.defaultDuration),
        settings.breakTime.start,
        settings.breakTime.end
      );
      setSettings(prev => ({ ...prev, timeSlots: newSlots }));
    }
  }, [settings.workingHours, settings.breakTime, settings.defaultDuration, settings.autoGenerateSlots]);

  const loadSettings = async () => {
    try {
      const response = await api.get("/settings/appointment-settings");
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.log("Using default settings");
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      await api.post("/settings/appointment-settings", settings);
      toast({
        title: "Settings Saved",
        description: "Appointment settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateTimeSlots = () => {
    if (settings.autoGenerateSlots) {
      const newSlots = generateTimeSlots(
        settings.workingHours.start,
        settings.workingHours.end,
        parseInt(settings.defaultDuration),
        settings.breakTime.start,
        settings.breakTime.end
      );
      setSettings(prev => ({ ...prev, timeSlots: newSlots }));
      toast({
        title: "Time Slots Regenerated",
        description: "Time slots have been updated based on your settings.",
      });
    }
  };

  const toggleTimeSlot = (id: string) => {
    setSettings({
      ...settings,
      timeSlots: settings.timeSlots.map(slot => 
        slot.id === id ? { ...slot, isActive: !slot.isActive } : slot
      )
    });
  };

  const addDuration = () => {
    if (
      newDurationValue.trim() &&
      !settings.durations.some((d) => d.value === newDurationValue)
    ) {
      const valueNum = parseInt(newDurationValue, 10);
      let label = "";
      if (valueNum < 60) {
        label = `${valueNum} minute${valueNum === 1 ? "" : "s"}`;
      } else if (valueNum % 60 === 0) {
        label = `${valueNum / 60} hour${valueNum === 60 ? "" : "s"}`;
      } else {
        label = `${(valueNum / 60).toFixed(1)} hours`;
      }
      const newDur: Duration = {
        value: newDurationValue,
        label,
        isActive: true,
      };
      setSettings({
        ...settings,
        durations: [...settings.durations, newDur],
      });
      setNewDurationValue("");
    }
  };

  const removeDuration = (value: string) => {
    setSettings({
      ...settings,
      durations: settings.durations.filter(dur => dur.value !== value)
    });
  };

  const toggleDuration = (value: string) => {
    setSettings({
      ...settings,
      durations: settings.durations.map(dur => 
        dur.value === value ? { ...dur, isActive: !dur.isActive } : dur
      )
    });
  };

  const addAppointmentType = () => {
    if (newAppointmentType.trim() && !settings.appointmentTypes.includes(newAppointmentType)) {
      setSettings({
        ...settings,
        appointmentTypes: [...settings.appointmentTypes, newAppointmentType]
      });
      setNewAppointmentType("");
    }
  };

  const removeAppointmentType = (type: string) => {
    setSettings({
      ...settings,
      appointmentTypes: settings.appointmentTypes.filter(t => t !== type)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center mb-2">
          <Calendar className="h-5 w-5 mr-2" />
          Appointment Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-10">
        {/* Working Hours */}
        <div className="space-y-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <h3 className="text-lg font-semibold">Working Hours</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={settings.workingHours.start}
                onChange={(e) => setSettings({
                  ...settings,
                  workingHours: { ...settings.workingHours, start: e.target.value }
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={settings.workingHours.end}
                onChange={(e) => setSettings({
                  ...settings,
                  workingHours: { ...settings.workingHours, end: e.target.value }
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Break Start Time</Label>
              <Input
                type="time"
                value={settings.breakTime.start}
                onChange={(e) => setSettings({
                  ...settings,
                  breakTime: { ...settings.breakTime, start: e.target.value }
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Break End Time</Label>
              <Input
                type="time"
                value={settings.breakTime.end}
                onChange={(e) => setSettings({
                  ...settings,
                  breakTime: { ...settings.breakTime, end: e.target.value }
                })}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        <hr className="my-6 border-gray-200" />
        {/* Time Slot Generation */}
        <div className="space-y-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <h3 className="text-lg font-semibold">Time Slot Generation</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Generate Time Slots</Label>
              <p className="text-sm text-gray-500">Automatically generate time slots based on working hours and duration</p>
            </div>
            <Switch
              checked={settings.autoGenerateSlots}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                autoGenerateSlots: checked
              })}
            />
          </div>
          {settings.autoGenerateSlots && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 mt-0.5">💡</div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How Auto-Generation Works:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Time slots are created every <strong>{settings.defaultDuration} minutes</strong></li>
                      <li>• Working hours: <strong>{settings.workingHours.start} - {settings.workingHours.end}</strong></li>
                      <li>• Break time: <strong>{settings.breakTime.start} - {settings.breakTime.end}</strong> (automatically skipped)</li>
                      <li>• Example: With 30min duration, you'll get slots like 8:00 AM, 8:30 AM, 9:00 AM...</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <div className="text-green-600 mt-0.5">👁️</div>
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-2">Live Preview - Generated Slots:</p>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                      {generateTimeSlots(
                        settings.workingHours.start,
                        settings.workingHours.end,
                        parseInt(settings.defaultDuration),
                        settings.breakTime.start,
                        settings.breakTime.end
                      ).slice(0, 12).map((slot, index) => (
                        <span key={index} className="bg-white px-2 py-1 rounded border text-center">
                          {slot.time}
                        </span>
                      ))}
                      {generateTimeSlots(
                        settings.workingHours.start,
                        settings.workingHours.end,
                        parseInt(settings.defaultDuration),
                        settings.breakTime.start,
                        settings.breakTime.end
                      ).length > 12 && (
                        <span className="bg-white px-2 py-1 rounded border text-center text-gray-500">
                          +{generateTimeSlots(
                            settings.workingHours.start,
                            settings.workingHours.end,
                            parseInt(settings.defaultDuration),
                            settings.breakTime.start,
                            settings.breakTime.end
                          ).length - 12} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Default Duration for Slot Generation</Label>
                  <Select 
                    value={settings.defaultDuration} 
                    onValueChange={(value) => setSettings({
                      ...settings,
                      defaultDuration: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.durations.filter(d => d.isActive).map((duration) => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={regenerateTimeSlots} variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Slots
                  </Button>
                </div>
              </div>
            </>
          )}
          <div className="space-y-2 mt-4">
            <Label>Available Time Slots ({settings.timeSlots.filter(s => s.isActive).length} active)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-60 overflow-y-auto border rounded-md p-4 bg-gray-50">
              {settings.timeSlots.length > 0 ? (
                settings.timeSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-1">
                    <Badge 
                      variant={slot.isActive ? "default" : "secondary"}
                      className="flex-1 cursor-pointer text-xs"
                      onClick={() => toggleTimeSlot(slot.id)}
                    >
                      {slot.time}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2" />
                  <p>No time slots generated yet</p>
                  <p className="text-sm">Adjust working hours and duration to generate slots</p>
                </div>
              )}
            </div>
            {settings.timeSlots.length > 0 && (
              <div className="text-xs text-gray-500 mt-2">
                💡 Click on any time slot to toggle it on/off. Inactive slots won't be available for booking.
              </div>
            )}
          </div>
        </div>
        <hr className="my-6 border-gray-200" />
        {/* Durations */}
        <div className="space-y-6 pb-2">
          <h3 className="text-lg font-semibold mb-2">Appointment Durations</h3>
          <div className="text-sm text-gray-500 mb-2">
            Enter duration in <b>minutes</b> (e.g., <b>15</b> for 15 minutes, <b>60</b> for 1 hour).<br />
            <span className="text-xs text-gray-400">Do not enter '1' for 1 hour; use '60' instead.</span>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Value (min)"
              value={newDurationValue}
              onChange={(e) => setNewDurationValue(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-32"
              type="number"
              min="1"
            />
            <Button onClick={addDuration} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Duration
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {settings.durations.map((duration) => (
              <div key={duration.value} className="flex items-center gap-2">
                <Badge
                  variant={duration.isActive ? "default" : "secondary"}
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleDuration(duration.value)}
                >
                  {duration.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDuration(duration.value)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <hr className="my-6 border-gray-200" />
        {/* Appointment Types */}
        <div className="space-y-6 pb-2">
          <h3 className="text-lg font-semibold mb-2">Appointment Types</h3>
          <div className="flex gap-3">
            <Input
              placeholder="Enter appointment type"
              value={newAppointmentType}
              onChange={(e) => setNewAppointmentType(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addAppointmentType} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {settings.appointmentTypes.map((type) => (
              <Badge key={type} variant="outline" className="flex items-center gap-2">
                {type}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAppointmentType(type)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
        <hr className="my-6 border-gray-200" />
        {/* Scheduling Rules */}
        <div className="space-y-6 pb-2">
          <h3 className="text-lg font-semibold mb-2">Scheduling Rules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Maximum Appointments Per Day</Label>
              <Input
                type="number"
                value={settings.maxAppointmentsPerDay}
                onChange={(e) => setSettings({
                  ...settings,
                  maxAppointmentsPerDay: parseInt(e.target.value)
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Buffer Time Between Appointments (minutes)</Label>
              <Input
                type="number"
                value={settings.bufferTime}
                onChange={(e) => setSettings({
                  ...settings,
                  bufferTime: parseInt(e.target.value)
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Advance Booking Days</Label>
              <Input
                type="number"
                value={settings.advanceBookingDays}
                onChange={(e) => setSettings({
                  ...settings,
                  advanceBookingDays: parseInt(e.target.value)
                })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="space-y-0.5">
              <Label>Allow Overlapping Appointments</Label>
              <p className="text-sm text-gray-500">Enable multiple appointments at the same time</p>
            </div>
            <Switch
              checked={settings.allowOverlapping}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                allowOverlapping: checked
              })}
            />
          </div>
        </div>
        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button onClick={saveSettings} disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentSettings; 