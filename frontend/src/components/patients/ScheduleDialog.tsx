import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAppointmentSettings } from "@/hooks/settings_hook/use-appointment-settings";
import api from "@/lib/api";

interface Patient {
  id: string | number;
  name: string;
  phone: string;
  visibleId?: string;
  age?: number;
  gender?: string;
}

interface Appointment {
  id: string | number;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  type: string;
  duration: string;
  notes?: string;
  status: string;
  patientVisibleId?: string;
}

interface ScheduleDialogProps {
  patient: Patient;
  trigger: React.ReactNode;
}

const ScheduleDialog = ({ patient, trigger }: ScheduleDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    type: "",
    doctor: "",
    notes: ""
  });

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

  // Get dynamic time slots and durations
  const timeSlots = getActiveTimeSlots().map(slot => slot.time);
  const durations = getActiveDurations();
  const appointmentTypes = settings.appointmentTypes;
  const slotDuration = settings.defaultDuration; // Use defaultDuration from settings

  useEffect(() => {
    if (formData.date) {
      const loadExistingAppointments = async () => {
        try {
          const response = await api.get(`/appointments?date=${formData.date}`);
          setExistingAppointments(response.data || []);
        } catch (error) {
          console.log("Failed to load existing appointments");
          setExistingAppointments([]);
        }
      };
      loadExistingAppointments();
    }
  }, [formData.date]);

  // Get available time slots for the selected date
  const getAvailableSlots = () => {
    if (!formData.date) return timeSlots;
    const dateObj = new Date(formData.date);
    let availableSlots = getAvailableTimeSlots(dateObj, existingAppointments).map(slot => slot.time);

    // If the selected date is today, allow slot if its END time is in the future
    const today = new Date();
    const selectedDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const slotDurationMinutes = parseInt(slotDuration) || 30;
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
        const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60000);
        return slotEnd > now;
      });
    }
    return availableSlots;
  };

  // Check if date is within booking window
  const isDateValid = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + settings.advanceBookingDays);
    maxDate.setHours(0, 0, 0, 0);
    // Allow today and future dates up to maxDate
    return d >= today && d <= maxDate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Check for appointment conflicts
      if (formData.date && formData.time) {
        const dateObj = new Date(formData.date);
        const hasConflict = checkAppointmentConflict(
          dateObj, 
          formData.time, 
          30, // default duration
          existingAppointments
        );
        
        if (hasConflict) {
          toast({
            title: "Appointment Conflict",
            description: "This time slot conflicts with an existing appointment. Please choose a different time.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      // Format date as YYYY-MM-DD string (timezone-safe)
      const dateObj = new Date(formData.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Check maximum appointments per day limit
      const appointmentsForDate = existingAppointments.filter(app => {
        const appDate = app.date.split('T')[0];
        return appDate === formattedDate;
      });

      if (appointmentsForDate.length >= settings.maxAppointmentsPerDay) {
        toast({
          title: "Daily Limit Reached",
          description: `Maximum appointments per day (${settings.maxAppointmentsPerDay}) has been reached for ${format(dateObj, 'PPP')}. Please select a different date.`,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      const appointmentData = {
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        date: formattedDate,
        time: formData.time,
        type: formData.type,
        duration: String(slotDuration), // Set duration automatically
        notes: formData.notes,
        status: "Confirmed"
      };
      
      await api.post("/appointments", appointmentData);
      toast({
        title: "Appointment Scheduled",
        description: `Appointment for ${patient.name} has been scheduled for ${formData.date} at ${formData.time}.`,
      });
      setIsLoading(false);
      setIsOpen(false);
      setFormData({ date: "", time: "", type: "", doctor: "", notes: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Patient</Label>
            <Input value={patient.name} disabled />
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
                    {formData.date ? format(new Date(formData.date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(
                      Number(formData.date.split('-')[0]),
                      Number(formData.date.split('-')[1]) - 1,
                      Number(formData.date.split('-')[2])
                    ) : undefined}
                    onSelect={(date) => {
                      if (date && isDateValid(date)) {
                        // Store as local date string
                        const year = date.getFullYear();
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        setFormData({...formData, date: `${year}-${month}-${day}`, time: ""});
                      } else if (date) {
                        toast({
                          title: "Invalid Date",
                          description: `Appointments can only be booked up to ${settings.advanceBookingDays} days in advance.`,
                          variant: "destructive"
                        });
                      }
                    }}
                    initialFocus
                    disabled={(date) => !isDateValid(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Time</Label>
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
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.date || !formData.time}>
              {isLoading ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;
