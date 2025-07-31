import { useState, useEffect } from 'react';
import api from '@/lib/api';

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

const defaultSettings: AppointmentSettings = {
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
};

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

export interface Appointment {
  id: number | string;
  patientName: string;
  patientPhone: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // e.g. '09:00 AM'
  type: string;
  duration: string; // in minutes, as string
  notes?: string;
  status: string;
}

export const useAppointmentSettings = () => {
  const [settings, setSettings] = useState<AppointmentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-generate time slots if enabled and no slots exist
  useEffect(() => {
    if (settings.autoGenerateSlots && settings.timeSlots.length === 0 && settings.workingHours.start && settings.workingHours.end && settings.defaultDuration) {
      const newSlots = generateTimeSlots(
        settings.workingHours.start,
        settings.workingHours.end,
        parseInt(settings.defaultDuration),
        settings.breakTime.start,
        settings.breakTime.end
      );
      setSettings(prev => ({ ...prev, timeSlots: newSlots }));
    }
  }, [settings.autoGenerateSlots, settings.timeSlots.length, settings.workingHours, settings.breakTime, settings.defaultDuration]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/settings/appointment-settings");
      if (response.data) {
        setSettings(response.data);
      } else {
        // Show default settings for user guidance, but do NOT save to DB
        setSettings(defaultSettings);
      }
    } catch (error) {
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppointmentSettings) => {
    try {
      setLoading(true);
      await api.post("/settings/appointment-settings", newSettings);
      setSettings(newSettings);
      return { success: true };
    } catch (error) {
      setError("Failed to save settings");
      return { success: false, error: "Failed to save settings" };
    } finally {
      setLoading(false);
    }
  };

  const getActiveTimeSlots = () => {
    return settings.timeSlots.filter(slot => slot.isActive);
  };

  const getActiveDurations = () => {
    return settings.durations.filter(duration => duration.isActive);
  };

  const getAvailableTimeSlots = (date: Date, existingAppointments: Appointment[] = []) => {
    const activeSlots = getActiveTimeSlots();
    
    // Filter appointments to only those for the selected date
    const dateString = date.toISOString().split('T')[0];
    const appointmentsForDate = existingAppointments.filter(app => {
      // app.date is always a string (YYYY-MM-DD or ISO string)
      const appDate = app.date.split('T')[0];
      return appDate === dateString;
    });

    // Filter out break time
    const breakStart = settings.breakTime.start;
    const breakEnd = settings.breakTime.end;

    return activeSlots.filter(slot => {
      const slotTime = slot.time;
      const slotHour = parseInt(slotTime.split(':')[0]);
      const slotMinute = parseInt(slotTime.split(':')[1].split(' ')[0]);
      const isPM = slotTime.includes('PM');
      
      let slot24Hour = slotHour;
      if (isPM && slotHour !== 12) slot24Hour += 12;
      if (!isPM && slotHour === 12) slot24Hour = 0;
      
      const slotTimeString = `${slot24Hour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
      
      // Check if slot is during break time
      if (slotTimeString >= breakStart && slotTimeString < breakEnd) {
        return false;
      }

      // Check if slot is within working hours
      if (slotTimeString < settings.workingHours.start || slotTimeString >= settings.workingHours.end) {
        return false;
      }

      // Check for existing appointments if overlapping is not allowed
      if (!settings.allowOverlapping) {
        const hasConflict = appointmentsForDate.some(appointment => {
          const appointmentTime = appointment.time;
          return appointmentTime === slotTime;
        });
        return !hasConflict;
      }

      return true;
    });
  };

  const isWithinAdvanceBookingWindow = (date: Date) => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + settings.advanceBookingDays);
    
    return date >= today && date <= maxDate;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [time, period] = startTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let totalMinutes = hours * 60 + minutes;
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes = minutes;
    
    totalMinutes += durationMinutes;
    
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    
    let newPeriod = 'AM';
    let displayHours = newHours;
    
    if (newHours >= 12) {
      newPeriod = 'PM';
      if (newHours > 12) displayHours = newHours - 12;
    }
    if (displayHours === 0) displayHours = 12;
    
    return `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
  };

  const checkAppointmentConflict = (date: Date, startTime: string, durationMinutes: number, existingAppointments: Appointment[] = []) => {
    if (settings.allowOverlapping) {
      return false;
    }

    const endTime = calculateEndTime(startTime, durationMinutes);
    
    return existingAppointments.some(appointment => {
      if (appointment.date !== date.toISOString().split('T')[0]) {
        return false;
      }
      
      const appointmentEndTime = calculateEndTime(appointment.time, parseInt(appointment.duration));
      
      // Check for overlap
      return (
        (startTime >= appointment.time && startTime < appointmentEndTime) ||
        (endTime > appointment.time && endTime <= appointmentEndTime) ||
        (startTime <= appointment.time && endTime >= appointmentEndTime)
      );
    });
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
    }
  };

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    getActiveTimeSlots,
    getActiveDurations,
    getAvailableTimeSlots,
    isWithinAdvanceBookingWindow,
    calculateEndTime,
    checkAppointmentConflict,
    regenerateTimeSlots
  };
};