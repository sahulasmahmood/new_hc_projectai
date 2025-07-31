import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, User, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAppointmentSettings } from "@/hooks/settings_hook/use-appointment-settings";
import PatientFormDialog from "@/components/patients/PatientFormDialog";

// Types from hooks/use-appointment-settings.ts
interface TimeSlot {
  id: string;
  time: string;
  isActive: boolean;
}

interface AppointmentSettings {
  timeSlots: TimeSlot[];
  durations: { value: string; label: string; isActive: boolean }[];
  workingHours: { start: string; end: string };
  breakTime: { start: string; end: string };
  appointmentTypes: string[];
  maxAppointmentsPerDay: number;
  allowOverlapping: boolean;
  bufferTime: number;
  advanceBookingDays: number;
  autoGenerateSlots: boolean;
  defaultDuration: string;
}

// Types from pages/Appointments.tsx
export interface Appointment {
  id: number | string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  type: string;
  duration: string;
  notes?: string;
  status: string;
  patientId?: string | number; // Added patientId for unique identification
}

interface Patient {
  id: string | number;
  name: string;
  phone: string;
  visibleId?: string;
  age?: number;
  gender?: string;
}

interface AppointmentDialogProps {
  appointment?: Appointment;
  mode: 'create' | 'edit';
  onSave: (appointmentData: Appointment) => Promise<boolean | void> | void;
  onClose?: () => void;
  selectedDate?: string | Date;
  selectedTime?: string;
}

interface AppointmentFormData {
  patientName: string;
  patientPhone: string;
  date: Date;
  time: string;
  type: string;
  notes: string;
}

const AppointmentDialog = ({ appointment, mode, onSave, onClose, selectedDate, selectedTime }: AppointmentDialogProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const initialFormData = useMemo<AppointmentFormData>(() => ({
    patientName: "",
    patientPhone: "",
    date: selectedDate ? (typeof selectedDate === 'string' ? new Date(selectedDate) : selectedDate) : new Date(),
    time: selectedTime || "",
    type: "Consultation",
    notes: ""
  }), [selectedDate, selectedTime]);
  const [formData, setFormData] = useState<AppointmentFormData>(initialFormData);
  const { toast } = useToast();
  const [patientFound, setPatientFound] = useState<boolean | null>(null);
  const [showCreatePatient, setShowCreatePatient] = useState<boolean>(false);
  const [matchingPatients, setMatchingPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);

  // Use appointment settings hook
  const {
    settings,
    loading: settingsLoading,
    getActiveTimeSlots,
    getActiveDurations,
    getAvailableTimeSlots,
    isWithinAdvanceBookingWindow,
    checkAppointmentConflict
  } = useAppointmentSettings();

  // Get dynamic time slots
  const timeSlots: string[] = getActiveTimeSlots().map((slot: TimeSlot) => slot.time);
  const slotDuration: number = parseInt(settings.defaultDuration);
  const appointmentTypes: string[] = settings.appointmentTypes;

  // Load existing appointments for the selected date
  useEffect(() => {
    if (formData.date) {
      loadExistingAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date]);

  const loadExistingAppointments = async () => {
    try {
      // Fix timezone issue by creating date string manually
      const year = formData.date.getFullYear();
      const month = String(formData.date.getMonth() + 1).padStart(2, '0');
      const day = String(formData.date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const response = await api.get(`/appointments?date=${dateString}`);
      setExistingAppointments(response.data || []);
    } catch (error) {
      console.log("Failed to load existing appointments");
      setExistingAppointments([]);
    }
  };

  // Get available time slots for the selected date
  const getAvailableSlots = (): string[] => {
    if (!formData.date) return timeSlots;
    let availableSlots = getAvailableTimeSlots(formData.date, existingAppointments).map((slot: TimeSlot) => slot.time);

    // If the selected date is today, allow slot if its END time is in the future
    const today = new Date();
    const selectedDate = new Date(formData.date.getFullYear(), formData.date.getMonth(), formData.date.getDate());
    const isToday = today.getFullYear() === selectedDate.getFullYear() &&
                   today.getMonth() === selectedDate.getMonth() &&
                   today.getDate() === selectedDate.getDate();
    if (isToday) {
      const now = today;
      availableSlots = availableSlots.filter(time => {
        // Parse time string (e.g., '10:30 AM') to a Date object on today
        const [timePart, period] = time.split(' ');
        const [hoursRaw, minutes] = timePart.split(':').map(Number);
        let hours = hoursRaw;
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        const slotStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
        return slotEnd > now;
      });
    }
    return availableSlots;
  };

  // Check if selected time slot is available
  const isTimeSlotAvailable = (time: string): boolean => {
    if (!formData.date) return true;
    const availableSlots = getAvailableSlots();
    return availableSlots.includes(time);
  };

  // Check if date is within booking window
  const isDateValid = (date: Date): boolean => {
    return isWithinAdvanceBookingWindow(date);
  };

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setFormData({ ...formData, patientPhone: phone });
    setSelectedPatientId(null);
    setMatchingPatients([]);

    if (phone.length >= 8) {
      try {
        const res = await api.get(`/patients/search/by-phone?phone=${phone}`);
        if (Array.isArray(res.data) && res.data.length > 1) {
          setMatchingPatients(res.data);
          setPatientFound(true);
          setShowCreatePatient(false);
          setFormData(prev => ({ ...prev, patientName: "" }));
        } else if (Array.isArray(res.data) && res.data.length === 1) {
          setMatchingPatients([]);
          setFormData(prev => ({ ...prev, patientName: res.data[0].name }));
          setSelectedPatientId(String(res.data[0].id));
          setPatientFound(true);
          setShowCreatePatient(false);
        } else {
          setPatientFound(false);
          setShowCreatePatient(true);
          setFormData(prev => ({ ...prev, patientName: "" }));
        }
      } catch {
        setPatientFound(false);
        setShowCreatePatient(true);
        setFormData(prev => ({ ...prev, patientName: "" }));
      }
    } else {
      setPatientFound(null);
      setShowCreatePatient(false);
      setFormData(prev => ({ ...prev, patientName: "" }));
      setMatchingPatients([]);
      setSelectedPatientId(null);
    }
  };

  const handleSave = async () => {
    // Prevent scheduling without a time slot
    if (!formData.time) {
      toast({
        title: "Time Slot Required",
        description: "Please select a time slot before scheduling the appointment.",
        variant: "destructive"
      });
      return;
    }
    // Check for appointment conflicts
    if (formData.date && formData.time) {
      const hasConflict = checkAppointmentConflict(
        formData.date,
        formData.time,
        slotDuration,
        existingAppointments
      );
      if (hasConflict) {
        toast({
          title: "Appointment Conflict",
          description: "This time slot conflicts with an existing appointment. Please choose a different time.",
          variant: "destructive"
        });
        return;
      }
    }

    // Check maximum appointments per day limit
    const formattedDate = formData.date instanceof Date
      ? (() => {
          const year = formData.date.getFullYear();
          const month = String(formData.date.getMonth() + 1).padStart(2, '0');
          const day = String(formData.date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })()
      : formData.date;
    
    const appointmentsForDate = existingAppointments.filter(app => {
      const appDate = app.date.split('T')[0];
      return appDate === formattedDate;
    });

    if (appointmentsForDate.length >= settings.maxAppointmentsPerDay) {
      toast({
        title: "Daily Limit Reached",
        description: `Maximum appointments per day (${settings.maxAppointmentsPerDay}) has been reached for ${format(formData.date, 'PPP')}. Please select a different date.`,
        variant: "destructive"
      });
      return;
    }

    const appointmentData: Appointment = {
      ...formData,
      duration: String(slotDuration),
      date: formattedDate,
      id: appointment?.id || Date.now(),
      status: appointment?.status || "Confirmed",
      // Add selectedPatientId to appointment data
      patientId: selectedPatientId || undefined
    };
    // Await onSave in case it's async
    const result = await onSave(appointmentData);
    // Only close if save was successful
    if (result !== false) {
      setOpen(false);
      if (onClose) onClose();
      // Reload appointments for the selected date to update available slots
      await loadExistingAppointments();
    }
  };

  // Reset form data to initial state when dialog is opened for 'create' mode
  useEffect(() => {
    if (open && mode === 'create') {
      setFormData(initialFormData);
      setPatientFound(null);
      setShowCreatePatient(false);
      setMatchingPatients([]);
      setSelectedPatientId(null);
    }
  }, [open, mode, initialFormData]);

  // Reset form when selectedDate or selectedTime changes (e.g., user changes date)
  useEffect(() => {
    setFormData({
      patientName: "",
      patientPhone: "",
      date: selectedDate ? (typeof selectedDate === 'string' ? new Date(selectedDate) : selectedDate) : new Date(),
      time: selectedTime || "",
      type: "Consultation",
      notes: ""
    });
    setPatientFound(null);
    setShowCreatePatient(false);
    setMatchingPatients([]);
    setSelectedPatientId(null);
  }, [selectedDate, selectedTime]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button className="bg-medical-500 hover:bg-medical-600">
            <Plus className="h-4 w-4 mr-2" /> New Appointment
          </Button>
        ) : (
          <Button className="bg-medical-500 hover:bg-medical-600">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Schedule New Appointment' : 'Edit Appointment'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="patientPhone">Patient Phone</Label>
            <Input
              id="patientPhone"
              value={formData.patientPhone}
              onChange={handlePhoneChange}
              placeholder="Enter phone number"
              required
            />
            {patientFound === false && (
              <div className="text-red-600 text-xs mt-1 flex items-center gap-2">
                Patient not found.
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name</Label>
            {matchingPatients.length > 1 ? (
              <Select
                value={selectedPatientId || ""}
                onValueChange={(id) => {
                  setSelectedPatientId(id);
                  const patient = matchingPatients.find(p => String(p.id) === id);
                  if (patient) setFormData(prev => ({ ...prev, patientName: patient.name }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {matchingPatients.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} {p.visibleId ? `(${p.visibleId})` : ""} {p.age ? `- ${p.age}y` : ""} {p.gender ? `/ ${p.gender}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="patientName"
                value={formData.patientName}
                readOnly
                placeholder="Autofilled from patient record"
                disabled
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date && isDateValid(date)) {
                        setFormData({...formData, date, time: ""});
                      } else if (date) {
                        toast({
                          title: "Invalid Date",
                          description: `Appointments can only be booked up to ${settings.advanceBookingDays} days in advance.`,
                          variant: "destructive"
                        });
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => !isDateValid(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              {selectedTime ? (
                <div className="px-3 py-2 border rounded bg-gray-50 text-gray-800 font-semibold">{selectedTime}</div>
              ) : (
                <Select 
                  value={formData.time} 
                  onValueChange={(time) => setFormData({...formData, time})}
                  disabled={settingsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={settingsLoading ? "Loading..." : "Select time"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSlots().map((time) => (
                      <SelectItem 
                        key={time} 
                        value={time}
                        className={!isTimeSlotAvailable(time) ? "text-gray-400" : ""}
                      >
                        {time} {!isTimeSlotAvailable(time) && "(Unavailable)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(type) => setFormData({...formData, type})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes or special instructions"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-medical-500 hover:bg-medical-600"
            disabled={!patientFound || !formData.time}
            onClick={async () => {
              if (!formData.time) {
                toast({
                  title: "Time Slot Required",
                  description: "Please select a time slot before scheduling.",
                  variant: "destructive"
                });
                return;
              }
              await handleSave();
            }}
          >
            {mode === 'create' ? 'Schedule' : 'Update'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
