import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAppointmentSettings } from "@/hooks/settings_hook/use-appointment-settings";
import api from "@/lib/api";

interface Appointment {
  id: number;
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

interface RescheduleDialogProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (appointmentId: number, newDate: string, newTime: string) => Promise<void>;
}

const RescheduleDialog = ({ appointment, isOpen, onClose, onReschedule }: RescheduleDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(appointment.date));
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const { toast } = useToast();

  // Use appointment settings hook
  const {
    settings,
    getActiveTimeSlots,
    getAvailableTimeSlots,
    isWithinAdvanceBookingWindow,
    checkAppointmentConflict
  } = useAppointmentSettings();

  // Get dynamic time slots
  const allTimeSlots = getActiveTimeSlots().map(slot => slot.time);
  const slotDuration = parseInt(settings.defaultDuration);

  // Load existing appointments for the selected date
  useEffect(() => {
    if (selectedDate) {
      const loadExistingAppointments = async () => {
        try {
          setSettingsLoading(true);
          // Fix timezone issue by creating date string manually
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          const response = await api.get(`/appointments?date=${dateString}`);
          setExistingAppointments(response.data || []);
        } catch (error) {
          console.log("Failed to load existing appointments");
          setExistingAppointments([]);
        } finally {
          setSettingsLoading(false);
        }
      };
      loadExistingAppointments();
    }
  }, [selectedDate]);

  // Get available time slots for the selected date
  const getAvailableSlots = (): string[] => {
    if (!selectedDate) return allTimeSlots;
    
    // Filter out the current appointment's time slot from existing appointments
    const otherAppointments = existingAppointments.filter(
      app => app.id !== appointment.id
    );
    
    let availableSlots = getAvailableTimeSlots(selectedDate, otherAppointments).map(slot => slot.time);

    // If the selected date is today, allow slot if its END time is in the future
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const isToday = today.getFullYear() === selectedDateOnly.getFullYear() &&
                   today.getMonth() === selectedDateOnly.getMonth() &&
                   today.getDate() === selectedDateOnly.getDate();
    
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

  // Check if appointment can be rescheduled
  const canReschedule = (): boolean => {
    // Can only reschedule if status is not "In Progress", "Completed", or "Cancelled"
    const blockedStatuses = ["In Progress", "Completed", "Cancelled"];
    return !blockedStatuses.includes(appointment.status);
  };

  // Check if selected time slot is available
  const isTimeSlotAvailable = (time: string): boolean => {
    if (!selectedDate) return true;
    const availableSlots = getAvailableSlots();
    return availableSlots.includes(time);
  };

  // Check if date is within booking window
  const isDateValid = (date: Date): boolean => {
    return isWithinAdvanceBookingWindow(date);
  };

  const handleReschedule = async () => {
    if (!selectedTime) {
      toast({
        title: "Time Slot Required",
        description: "Please select a new time slot for the appointment.",
        variant: "destructive"
      });
      return;
    }

    if (!isTimeSlotAvailable(selectedTime)) {
      toast({
        title: "Time Slot Unavailable",
        description: "The selected time slot is not available. Please choose a different time.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      // Fix timezone issue by creating date string manually
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const newDate = `${year}-${month}-${day}`;
      await onReschedule(appointment.id, newDate, selectedTime);
      
      toast({
        title: "Appointment Rescheduled",
        description: `Appointment for ${appointment.patientName} has been rescheduled to ${format(selectedDate, 'PPP')} at ${selectedTime}.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Reschedule Failed",
        description: "Failed to reschedule the appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = getAvailableSlots();

  if (!canReschedule()) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cannot Reschedule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                This appointment cannot be rescheduled because it has already started or been completed.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{appointment.patientName}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(appointment.date), 'PPP')} at {appointment.time}
                </p>
                <p className="text-sm text-gray-500">Status: {appointment.status}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-medical-500" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Appointment Info - now two columns */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Current Appointment</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <p><span className="font-medium">Patient:</span> {appointment.patientName}</p>
              <p><span className="font-medium">Date:</span> {format(new Date(appointment.date), 'PPP')}</p>
              <p><span className="font-medium">Time:</span> {appointment.time}</p>
              <p><span className="font-medium">Type:</span> {appointment.type}</p>
              <p><span className="font-medium">Status:</span> {appointment.status}</p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select New Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => !isDateValid(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Select New Time</Label>
            <Select 
              value={selectedTime}
              onValueChange={setSelectedTime}
              disabled={settingsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={settingsLoading ? "Loading..." : "Select time"} />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center gap-2">
                      {time}
                      {time === appointment.time && (
                        <span className="text-xs text-blue-600">(Current)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {availableSlots.length === 0 && !settingsLoading && (
              <p className="text-sm text-red-600">
                No available time slots for the selected date.
              </p>
            )}
          </div>

          {/* Available Slots Preview */}
          {selectedDate && availableSlots.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Available Time Slots ({availableSlots.length})
              </Label>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {availableSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                    className="text-xs whitespace-nowrap"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Validation Messages */}
          {selectedTime && !isTimeSlotAvailable(selectedTime) && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-600">
                ⚠️ This time slot is not available. Please select a different time.
              </p>
            </div>
          )}

          {selectedTime && isTimeSlotAvailable(selectedTime) && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Time slot is available for rescheduling.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={!selectedTime || !isTimeSlotAvailable(selectedTime) || loading}
            className="bg-medical-500 hover:bg-medical-600"
          >
            {loading ? "Rescheduling..." : "Reschedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog; 