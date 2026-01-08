const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const { PrismaClient } = require("../generated/prisma");
// Removed complex memory system - now using simple Redis sessions

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const prisma = new PrismaClient();

// Sleep function for delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Conversation states for appointment booking
const CONVERSATION_STATES = {
  GREETING: "greeting",
  ASKING_DATE: "asking_date",
  SHOWING_SLOTS: "showing_slots",
  ASKING_TIME: "asking_time",
  ASKING_DOCTOR: "asking_doctor",
  ASKING_APPOINTMENT_TYPE: "asking_appointment_type",
  COLLECTING_PATIENT_INFO: "collecting_patient_info",
  CONFIRMING_BOOKING: "confirming_booking",
  COMPLETED: "completed",
};

// Get available doctors from staff
const getAvailableDoctors = async () => {
  try {
    const doctors = await prisma.staff.findMany({
      where: {
        OR: [
          { role: { contains: "Doctor", mode: "insensitive" } },
          { role: { contains: "Physician", mode: "insensitive" } },
          { role: { contains: "MD", mode: "insensitive" } },
        ],
        status: "On Duty",
      },
      select: {
        id: true,
        name: true,
        qualification: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });
    return doctors;
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return [];
  }
};

// Enhanced AI parsing for intent-based appointment booking
const parseUserInput = async (message, currentState) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an advanced intent classifier and entity extractor for appointment booking.

Current conversation state: ${currentState}
Today's date: ${todayStr}
Tomorrow's date: ${tomorrowStr}

INTENTS:
- book_appointment: User wants to book an appointment (complete or partial request)
- provide_time: User is providing a specific time (like "7:30 PM")
- provide_date: User is providing a date
- provide_patient_info: User is providing personal information
- check_availability: User wants to check available slots
- general: General questions or unclear intent

Respond with ONLY a JSON object:
{
  "intent": "intent_name",
  "isCompleteRequest": true/false,
  "extractedDate": "YYYY-MM-DD format or null",
  "extractedTime": "HH:MM AM/PM format or null",
  "datePreference": "today|tomorrow|next_week|specific_date|null",
  "timePreference": "morning|afternoon|evening|specific_time|null",
  "patientName": "extracted name or null",
  "patientPhone": "extracted phone or null",
  "patientEmail": "extracted email or null",
  "patientAge": "extracted age as number or null",
  "doctorPreference": "doctor name or null",
  "appointmentType": "consultation|checkup|followup|etc or null",
  "isEmergency": true/false
}

EXAMPLES:

Complete booking requests:
"Book me tomorrow at 7:30 PM" → {"intent": "book_appointment", "isCompleteRequest": true, "extractedDate": "${tomorrowStr}", "extractedTime": "7:30 PM", ...}
"I need an appointment with Dr. Smith on Monday at 3 PM" → {"intent": "book_appointment", "isCompleteRequest": true, "extractedTime": "3:00 PM", "doctorPreference": "Dr. Smith", ...}
"Schedule me for a checkup tomorrow morning" → {"intent": "book_appointment", "isCompleteRequest": true, "extractedDate": "${tomorrowStr}", "timePreference": "morning", "appointmentType": "checkup", ...}

Time-only responses:
"7:30 PM" → {"intent": "provide_time", "isCompleteRequest": false, "extractedTime": "7:30 PM", ...}
"4:45 PM" → {"intent": "provide_time", "isCompleteRequest": false, "extractedTime": "4:45 PM", ...}
"2:30 PM" → {"intent": "provide_time", "isCompleteRequest": false, "extractedTime": "2:30 PM", ...}

Partial requests:
"I want to book appointment" → {"intent": "book_appointment", "isCompleteRequest": false, ...}
"Tomorrow morning" → {"intent": "provide_date", "isCompleteRequest": false, "extractedDate": "${tomorrowStr}", "timePreference": "morning", ...}

Personal info:
"My name is John Smith, phone 9876543210" → {"intent": "provide_patient_info", "isCompleteRequest": false, "patientName": "John Smith", "patientPhone": "9876543210", ...}
"John Smith" → {"intent": "provide_patient_info", "isCompleteRequest": false, "patientName": "John Smith", ...}
"Gokulammal" → {"intent": "provide_patient_info", "isCompleteRequest": false, "patientName": "Gokulammal", ...}

Emergency vs Normal:
"I need an emergency appointment" → {"intent": "book_appointment", "isEmergency": true, ...}
"Book appointment today" → {"intent": "book_appointment", "isEmergency": false, "datePreference": "today", ...}
"Urgent appointment needed" → {"intent": "book_appointment", "isEmergency": true, ...}
"I want to book for today" → {"intent": "book_appointment", "isEmergency": false, "datePreference": "today", ...}

CRITICAL: 
- Set isCompleteRequest=true ONLY if the message contains both date/time information AND booking intent
- For time-only messages like "7:30 PM", always use intent="provide_time"
- Extract times in exact HH:MM AM/PM format (e.g., "7:30 PM", not "19:30")
- Set isEmergency=true ONLY for explicit emergency keywords like "emergency", "urgent", "ASAP", "right now", "immediately"
- Normal booking requests like "book appointment today" should have isEmergency=false`,
        },
        {
          role: "user",
          content: `Parse this message: "${message}"`,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    const parsed = JSON.parse(response);

    // Enhanced time parsing for better accuracy
    if (parsed.extractedTime) {
      parsed.extractedTime = normalizeTimeFormat(parsed.extractedTime);
    }

    return parsed;
  } catch (error) {
    console.error("Input parsing failed:", error);
    return {
      intent: "general",
      isCompleteRequest: false,
      extractedDate: null,
      extractedTime: null,
      datePreference: null,
      timePreference: null,
      patientName: null,
      patientPhone: null,
      patientEmail: null,
      patientAge: null,
      doctorPreference: null,
      appointmentType: null,
      isEmergency: false,
    };
  }
};

// Normalize time format to ensure consistency with database format
const normalizeTimeFormat = (timeStr) => {
  if (!timeStr) return null;

  // Handle various time formats and normalize to match database format
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(AM|PM)/i, // 7:30 PM or 07:30 PM
    /(\d{1,2}):(\d{2})(AM|PM)/i, // 7:30PM
    /(\d{1,2})\s*(AM|PM)/i, // 7 PM
    /(\d{1,2})\.(\d{2})\s*(AM|PM)/i, // 7.30 PM
  ];

  for (const pattern of timePatterns) {
    const match = timeStr.match(pattern);
    if (match) {
      const hour = parseInt(match[1]);
      const minute = match[2] ? parseInt(match[2]) : 0;
      const period = match[3] ? match[3].toUpperCase() : "AM";

      // Format to match database format (HH:MM AM/PM with zero-padded hour for consistency)
      const formattedHour = hour.toString().padStart(2, "0");
      return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
    }
  }

  return timeStr;
};

// Get available appointment slots using the same logic as appointments page
const getAvailableSlots = async (targetDate = null, timePreference = null, doctorId = null) => {
  try {
    const settings = await prisma.appointmentSettings.findFirst();
    if (!settings) {
      throw new Error("Appointment settings not configured");
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    let startDate;
    if (targetDate) {
      startDate = new Date(targetDate);
      // Only block dates that are actually in the past (before today)
      // Create today's date in the same format as startDate for proper comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startDateOnly = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );

      if (startDateOnly < today) {
        return []; // Return empty for past dates only
      }
    } else {
      startDate = new Date(); // Today
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (targetDate ? 0 : 7)); // Single day if specific date, 7 days if general

    // Get existing appointments - now including doctorId for per-doctor availability
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: "Cancelled" },
      },
      select: { date: true, time: true, duration: true, doctorId: true },
    });

    const availableSlots = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const isToday = currentDate.toDateString() === now.toDateString();
      const daySlots = generateDaySlots(
        currentDate,
        existingAppointments,
        settings,
        isToday,
        currentTime,
        timePreference,
        doctorId // Pass doctorId for per-doctor filtering
      );
      availableSlots.push(...daySlots);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availableSlots;
  } catch (error) {
    console.error("Error getting available slots:", error);
    return [];
  }
};

// Get available slots for a specific doctor
const getAvailableSlotsForDoctor = async (targetDate = null, timePreference = null, doctorId = null) => {
  try {
    const settings = await prisma.appointmentSettings.findFirst();
    if (!settings) {
      throw new Error("Appointment settings not configured");
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let startDate;
    if (targetDate) {
      startDate = new Date(targetDate);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      if (startDateOnly < today) {
        return [];
      }
    } else {
      startDate = new Date();
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (targetDate ? 0 : 7));

    // Get doctor's shift information if doctorId is provided
    let doctorShift = null;
    if (doctorId) {
      const doctor = await prisma.staff.findUnique({
        where: { id: doctorId },
        include: { shiftTime: true }
      });
      if (doctor && doctor.shiftTime) {
        doctorShift = doctor.shiftTime;
      }
    }

    // Get existing appointments for this specific doctor
    const whereClause = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: { not: "Cancelled" },
    };
    
    // If doctorId is provided, only get that doctor's appointments
    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: whereClause,
      select: { date: true, time: true, duration: true, doctorId: true },
    });

    const availableSlots = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const isToday = currentDate.toDateString() === now.toDateString();
      const daySlots = generateDaySlotsForDoctor(
        currentDate,
        existingAppointments,
        settings,
        isToday,
        currentTime,
        timePreference,
        doctorId,
        doctorShift
      );
      availableSlots.push(...daySlots);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availableSlots;
  } catch (error) {
    console.error("Error getting available slots for doctor:", error);
    return [];
  }
};

// Generate time slots for a specific doctor on a specific day
const generateDaySlotsForDoctor = (
  date,
  existingAppointments,
  settings,
  isToday = false,
  currentTime = 0,
  timePreference = null,
  doctorId = null,
  doctorShift = null
) => {
  const slots = [];

  if (!settings || !settings.timeSlots) {
    console.error("No appointment settings or time slots found");
    return slots;
  }

  let timeSlots = settings.timeSlots;
  if (typeof timeSlots === "string") {
    try {
      timeSlots = JSON.parse(timeSlots);
    } catch (error) {
      console.error("Error parsing time slots:", error);
      return slots;
    }
  }

  const activeTimeSlots = timeSlots.filter((slot) => slot.isActive);

  // Parse working hours - use doctor's shift if available, otherwise use global settings
  let workingStart = settings.workingHoursStart || "08:00";
  let workingEnd = settings.workingHoursEnd || "18:00";
  
  if (doctorShift) {
    workingStart = doctorShift.startTime || workingStart;
    workingEnd = doctorShift.endTime || workingEnd;
  }

  const breakStart = settings.breakStart || "12:00";
  const breakEnd = settings.breakEnd || "13:00";

  activeTimeSlots.forEach((slot) => {
    const slotTime = slot.time;

    const [timePart, period] = slotTime.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const slotTimeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    const slotTimeMinutes = hours * 60 + minutes;

    // Skip if outside working hours
    if (slotTimeString < workingStart || slotTimeString >= workingEnd) {
      return;
    }

    // Skip if during break time
    if (slotTimeString >= breakStart && slotTimeString < breakEnd) {
      return;
    }

    // Skip past times if it's today
    if (isToday && slotTimeMinutes <= currentTime) {
      return;
    }

    // Check if slot matches time preference
    if (timePreference) {
      const matchesPreference = checkTimePreference(hours, timePreference);
      if (!matchesPreference) return;
    }

    // Check if slot is available for this specific doctor
    const isBooked = existingAppointments.some((apt) => {
      const aptDate = new Date(apt.date);
      const sameDate = aptDate.toDateString() === date.toDateString();
      const sameTime = apt.time === slotTime;
      
      // If checking for specific doctor, only that doctor's appointments matter
      if (doctorId) {
        return sameDate && sameTime && apt.doctorId === doctorId;
      }
      // If no specific doctor (any available), slot is booked only if ALL doctors are booked
      // This is handled differently - we'll check this in the calling function
      return sameDate && sameTime;
    });

    if (!isBooked) {
      slots.push({
        date: date.toISOString().split("T")[0],
        time: slotTime,
        displayDate: date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        timeCategory: getTimeCategory(hours),
        doctorId: doctorId,
      });
    }
  });

  return slots;
};

// Get doctors available at a specific time slot
const getDoctorsAvailableAtSlot = async (date, time) => {
  try {
    // Get all on-duty doctors
    const allDoctors = await getAvailableDoctors();
    
    if (allDoctors.length === 0) {
      return [];
    }

    // Get appointments at this specific date and time
    const appointmentDate = new Date(date);
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: appointmentDate,
        time: time,
        status: { not: "Cancelled" },
      },
      select: { doctorId: true },
    });

    const bookedDoctorIds = existingAppointments
      .filter(apt => apt.doctorId !== null)
      .map(apt => apt.doctorId);

    // Filter out doctors who are already booked at this time
    const availableDoctors = allDoctors.filter(
      doctor => !bookedDoctorIds.includes(doctor.id)
    );

    // Also check if doctors are within their shift hours
    const settings = await prisma.appointmentSettings.findFirst();
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    const slotTimeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    const doctorsInShift = [];
    for (const doctor of availableDoctors) {
      // Get doctor's shift
      const doctorWithShift = await prisma.staff.findUnique({
        where: { id: doctor.id },
        include: { shiftTime: true }
      });

      if (doctorWithShift && doctorWithShift.shiftTime) {
        const shiftStart = doctorWithShift.shiftTime.startTime;
        const shiftEnd = doctorWithShift.shiftTime.endTime;
        
        // Check if slot is within doctor's shift
        if (slotTimeString >= shiftStart && slotTimeString < shiftEnd) {
          doctorsInShift.push(doctor);
        }
      } else {
        // If no shift defined, use global working hours
        const workingStart = settings?.workingHoursStart || "08:00";
        const workingEnd = settings?.workingHoursEnd || "18:00";
        
        if (slotTimeString >= workingStart && slotTimeString < workingEnd) {
          doctorsInShift.push(doctor);
        }
      }
    }

    return doctorsInShift;
  } catch (error) {
    console.error("Error getting doctors available at slot:", error);
    return [];
  }
};

// Generate time slots for a specific day using appointment settings (same as appointments page)
const generateDaySlots = (
  date,
  existingAppointments,
  settings,
  isToday = false,
  currentTime = 0,
  timePreference = null,
  doctorId = null
) => {
  const slots = [];

  if (!settings || !settings.timeSlots) {
    console.error("No appointment settings or time slots found");
    return slots;
  }

  // Parse time slots from settings (same as appointments page)
  let timeSlots = settings.timeSlots;
  if (typeof timeSlots === "string") {
    try {
      timeSlots = JSON.parse(timeSlots);
    } catch (error) {
      console.error("Error parsing time slots:", error);
      return slots;
    }
  }

  // Filter active time slots (same as appointments page)
  const activeTimeSlots = timeSlots.filter((slot) => slot.isActive);

  console.log(
    `🕐 Active time slots from database:`,
    activeTimeSlots.map((s) => s.time)
  );

  // Parse working hours and break time
  const workingStart = settings.workingHoursStart || "08:00";
  const workingEnd = settings.workingHoursEnd || "18:00";
  const breakStart = settings.breakStart || "12:00";
  const breakEnd = settings.breakEnd || "13:00";

  activeTimeSlots.forEach((slot) => {
    const slotTime = slot.time;

    // Parse slot time to check if it's within working hours and not during break
    const [timePart, period] = slotTime.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const slotTimeString = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
    const slotTimeMinutes = hours * 60 + minutes;

    // Skip if outside working hours
    if (slotTimeString < workingStart || slotTimeString >= workingEnd) {
      return;
    }

    // Skip if during break time
    if (slotTimeString >= breakStart && slotTimeString < breakEnd) {
      return;
    }

    // Skip past times if it's today (only skip if time has already passed)
    if (isToday && slotTimeMinutes <= currentTime) {
      return;
    }

    // Check if slot matches time preference
    if (timePreference) {
      const matchesPreference = checkTimePreference(hours, timePreference);
      if (!matchesPreference) return;
    }

    // Check if slot is available (considering doctor-specific booking)
    const isBooked = existingAppointments.some((apt) => {
      const aptDate = new Date(apt.date);
      const sameDate = aptDate.toDateString() === date.toDateString();
      const sameTime = apt.time === slotTime;
      
      if (!sameDate || !sameTime) return false;
      
      // If checking for specific doctor, only that doctor's appointments matter
      if (doctorId) {
        return apt.doctorId === doctorId;
      }
      
      // If no specific doctor, consider slot booked only if it has no doctor assigned
      // (legacy appointments without doctor) - slots with doctors are still available for other doctors
      return apt.doctorId === null;
    });

    if (!isBooked) {
      slots.push({
        date: date.toISOString().split("T")[0],
        time: slotTime,
        displayDate: date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        timeCategory: getTimeCategory(hours),
        doctorId: doctorId || null,
      });
    }
  });

  console.log(
    `🕐 Generated available slots for ${date.toDateString()}:`,
    slots.map((s) => s.time)
  );

  return slots;
};

// Check if time matches preference
const checkTimePreference = (hour, preference) => {
  switch (preference) {
    case "morning":
      return hour >= 9 && hour < 12;
    case "afternoon":
      return hour >= 12 && hour < 17;
    case "evening":
      return hour >= 17 && hour < 20;
    default:
      return true;
  }
};

// Get time category for display
const getTimeCategory = (hour) => {
  if (hour >= 9 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  return "Evening";
};

// Format time to 12-hour format
const formatTime12Hour = (hour, minute) => {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
};

// Find patient by phone or name
const findPatient = async (phone = null, name = null) => {
  try {
    let patient = null;

    if (phone) {
      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, "");
      patient = await prisma.patient.findFirst({
        where: {
          phone: {
            contains: cleanPhone,
          },
        },
      });
    }

    if (!patient && name) {
      patient = await prisma.patient.findFirst({
        where: {
          name: {
            contains: name,
            mode: "insensitive",
          },
        },
      });
    }

    return patient;
  } catch (error) {
    console.error("Error finding patient:", error);
    return null;
  }
};

// Handle complete booking requests (skip guided flow)
const handleCompleteBookingRequest = async (parsed, context) => {
  console.log(`🎯 Processing complete booking request:`, parsed);
  console.log(`🎯 Current context booking data:`, context.bookingData);

  // Extract all available information (preserve existing appointment type if already selected)
  const bookingData = {
    ...context.bookingData,
    selectedDate: parsed.extractedDate,
    selectedTime: parsed.extractedTime,
    doctorPreference: parsed.doctorPreference,
    appointmentType:
      context.bookingData?.appointmentType ||
      parsed.appointmentType ||
      "General Consultation",
    patientName: parsed.patientName || context.bookingData?.patientName,
    patientPhone: parsed.patientPhone || context.bookingData?.patientPhone,
    patientEmail: parsed.patientEmail || context.bookingData?.patientEmail,
    patientAge: parsed.patientAge || context.bookingData?.patientAge,
  };

  console.log(`🎯 Merged booking data:`, bookingData);

  // If we have date but no specific time, handle time preference
  if (!bookingData.selectedTime && parsed.timePreference) {
    const availableSlots = await getAvailableSlots(
      bookingData.selectedDate,
      parsed.timePreference
    );

    if (availableSlots.length > 0) {
      // Auto-select first available slot for the preferred time
      const preferredSlot = availableSlots[0];
      bookingData.selectedDate = preferredSlot.date;
      bookingData.selectedTime = preferredSlot.time;

      return {
        message: `Perfect! I found a ${parsed.timePreference} slot for you: ${preferredSlot.time} on ${preferredSlot.displayDate}.\n\nI just need a few details to complete your booking. What's your name?`,
        state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
        conversationContext: {
          ...context,
          state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
          bookingData,
        },
      };
    }
  }

  // Check if we have date and time
  if (bookingData.selectedDate && bookingData.selectedTime) {
    // Verify slot availability
    const availableSlots = await getAvailableSlots(bookingData.selectedDate);
    const requestedSlot = availableSlots.find(
      (slot) => slot.time === bookingData.selectedTime
    );

    if (!requestedSlot) {
      // Time not available, show alternatives
      const alternatives = availableSlots.slice(0, 3);
      return {
        message: `I'm sorry, ${bookingData.selectedTime} on ${formatDate(
          bookingData.selectedDate
        )} is not available.\n\nHere are some alternatives:\n\n${alternatives
          .map((slot) => `• ${slot.time}`)
          .join("\n")}\n\nWhich time would you prefer?`,
        state: CONVERSATION_STATES.SHOWING_SLOTS,
        availableSlots: alternatives,
        conversationContext: {
          ...context,
          state: CONVERSATION_STATES.SHOWING_SLOTS,
          bookingData,
          availableSlots: alternatives,
        },
      };
    }

    // Slot is available, check what patient info we need
    const missingInfo = [];
    if (!bookingData.patientName) missingInfo.push("name");
    if (!bookingData.patientPhone) missingInfo.push("phone number");

    if (missingInfo.length === 0) {
      // DOUBLE CHECK: Ensure we actually have the required information
      if (!bookingData.patientName || !bookingData.patientPhone) {
        return {
          message:
            "I need your name and phone number to complete the booking. Please provide both.",
          state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
          conversationContext: {
            ...context,
            state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
            bookingData,
          },
        };
      }

      // We have everything, proceed to confirmation
      const doctorDisplay = bookingData.doctorName || bookingData.doctorPreference || "Any Available Doctor";
      return {
        message: `Perfect! Let me confirm your appointment details:\n\n📅 Date & Time: ${formatDate(
          bookingData.selectedDate
        )} at ${bookingData.selectedTime}\n👤 Patient: ${
          bookingData.patientName
        }\n📞 Phone: ${bookingData.patientPhone}\n👨‍⚕️ Doctor: ${doctorDisplay}\n🏥 Type: ${
          bookingData.appointmentType || "General Consultation"
        }\n\nShall I confirm this appointment booking?`,
        state: CONVERSATION_STATES.CONFIRMING_BOOKING,
        readyToBook: false, // Don't set readyToBook here, only after final confirmation
        bookingData,
        conversationContext: {
          ...context,
          state: CONVERSATION_STATES.CONFIRMING_BOOKING,
          bookingData,
        },
      };
    }

    // Ask for missing patient information (simplified approach)
    const appointmentDetails = `${bookingData.selectedTime} on ${formatDate(
      bookingData.selectedDate
    )}`;

    let question;
    if (missingInfo.includes("name") && missingInfo.includes("phone number")) {
      question = `Great! I can book you for ${appointmentDetails}.\n\n👤 Please provide your full name and phone number to complete the booking.\n\nExample: "John Smith, 9876543210"`;
    } else if (missingInfo.includes("name")) {
      question = `Perfect! Your ${appointmentDetails} slot is available.\n\n👤 What name should I put the appointment under?`;
    } else if (missingInfo.includes("phone number")) {
      question = `Excellent! I have your appointment for ${appointmentDetails}.\n\n📞 What's your phone number?`;
    } else {
      question = `Your ${appointmentDetails} slot is available! I just need a few more details.`;
    }

    console.log(`🎯 Asking for patient info - Missing:`, missingInfo);

    return {
      message: question,
      state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
      conversationContext: {
        ...context,
        state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
        bookingData,
      },
    };
  }

  // Incomplete request, fall back to guided flow
  return null;
};

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// Main conversational appointment chat processing
const processAppointmentChat = async (
  message,
  conversationContext = {},
  userId = null
) => {
  try {
    console.log(
      `🤖 Processing: "${message}" | State: ${
        conversationContext.state || "new"
      }`
    );

    // Parse user input
    const parsed = await parseUserInput(message, conversationContext.state);
    parsed.originalMessage = message; // Add original message for confirmation logic
    console.log(`🎯 Parsed:`, parsed);

    // Initialize conversation context if new
    if (!conversationContext.state) {
      conversationContext = {
        state: CONVERSATION_STATES.GREETING,
        bookingData: {},
        availableSlots: [],
      };
    }

    let response = {};

    // INTENT-BASED ROUTING: Handle complete requests first
    if (parsed.intent === "book_appointment" && parsed.isCompleteRequest) {
      console.log(`🎯 Detected complete booking request, skipping guided flow`);
      response = await handleCompleteBookingRequest(
        parsed,
        conversationContext
      );

      // If complete request handling returns null, fall back to guided flow
      if (response) {
        console.log(`✅ Complete request processed successfully`);
        return response;
      }
    }

    // GUIDED FLOW: Handle based on current conversation state
    switch (conversationContext.state) {
      case CONVERSATION_STATES.GREETING:
        response = await handleGreeting(parsed, conversationContext);
        break;

      case CONVERSATION_STATES.ASKING_DATE:
        response = await handleDateSelection(parsed, conversationContext);
        break;

      case CONVERSATION_STATES.SHOWING_SLOTS:
        response = await handleSlotSelection(parsed, conversationContext);
        break;

      case CONVERSATION_STATES.ASKING_TIME:
        response = await handleTimeSelection(parsed, conversationContext);
        break;

      case CONVERSATION_STATES.ASKING_DOCTOR:
        response = await handleDoctorSelection(parsed, conversationContext);
        break;

      case CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE:
        response = await handleAppointmentTypeSelection(
          parsed,
          conversationContext
        );
        break;

      case CONVERSATION_STATES.COLLECTING_PATIENT_INFO:
        response = await handlePatientInfo(parsed, conversationContext);
        break;

      case CONVERSATION_STATES.CONFIRMING_BOOKING:
        response = await handleBookingConfirmation(parsed, conversationContext);
        break;

      default:
        response = await handleGreeting(parsed, conversationContext);
    }

    console.log(
      `✅ Response generated for state: ${conversationContext.state}`
    );
    return response;
  } catch (error) {
    console.error("Error processing appointment chat:", error);
    return {
      message:
        "I apologize, but I'm having trouble right now. Please try again or contact our staff directly.",
      state: CONVERSATION_STATES.GREETING,
      availableSlots: [],
      suggestedActions: ["contact_staff"],
      conversationContext: {
        state: CONVERSATION_STATES.GREETING,
        bookingData: {},
      },
    };
  }
};

// Enhanced greeting handler with intent detection
const handleGreeting = async (parsed, context) => {
  // Handle emergency requests
  if (parsed.isEmergency) {
    return {
      message:
        "🚨 I understand this is urgent. For emergency situations, please call our emergency line immediately or visit the nearest emergency room.\n\nIf this is not a life-threatening emergency, I can help you book an urgent appointment. Would you like me to check for the earliest available slot?",
      state: CONVERSATION_STATES.ASKING_DOCTOR,
      urgency: "emergency",
      suggestedActions: ["emergency_booking", "contact_emergency"],
      conversationContext: {
        ...context,
        state: CONVERSATION_STATES.ASKING_DOCTOR,
        bookingData: { isEmergency: true },
      },
    };
  }

  // Handle booking requests (complete requests are handled earlier in the flow)
  if (parsed.intent === "book_appointment") {
    // If we have some information, use it
    const bookingData = {
      ...context.bookingData,
      selectedDate: parsed.extractedDate,
      selectedTime: parsed.extractedTime,
      doctorPreference: parsed.doctorPreference,
      appointmentType: parsed.appointmentType,
      patientName: parsed.patientName,
      patientPhone: parsed.patientPhone,
    };

    // NEW FLOW: Ask for doctor first before showing slots
    context.state = CONVERSATION_STATES.ASKING_DOCTOR;
    
    // Load available doctors
    const availableDoctors = await getAvailableDoctors();
    
    if (availableDoctors.length === 0) {
      // No doctors available, skip to date selection with "Any Available" preset
      context.bookingData = { ...bookingData, doctorPreference: "Any Available" };
      context.state = CONVERSATION_STATES.ASKING_DATE;
      
      return {
        message:
          'Hello! I\'d be happy to help you book an appointment. 😊\n\nWhen would you like to schedule your appointment?\n\n📅 You can say:\n• "Today" (if available)\n• "Tomorrow"\n• "Next week"\n• Or a specific date like "January 31st"',
        state: CONVERSATION_STATES.ASKING_DATE,
        suggestedActions: ["Today", "Tomorrow", "Next Week"],
        conversationContext: {
          ...context,
          state: CONVERSATION_STATES.ASKING_DATE,
          bookingData: context.bookingData,
        },
      };
    }

    // Show available doctors first
    let doctorMessage = `Hello! I'd be happy to help you book an appointment. 😊\n\n👨‍⚕️ Which doctor would you like to see?\n\n`;
    
    availableDoctors.forEach((doctor, index) => {
      const qualification = doctor.qualification ? ` (${doctor.qualification})` : '';
      doctorMessage += `• ${doctor.name}${qualification}\n`;
    });
    
    doctorMessage += `• Any Available Doctor\n`;
    doctorMessage += `\n💡 Tip: Just type the doctor's name or "any" for the first available`;

    context.availableDoctors = availableDoctors;
    context.bookingData = bookingData;

    return {
      message: doctorMessage,
      state: CONVERSATION_STATES.ASKING_DOCTOR,
      availableDoctors: availableDoctors,
      suggestedActions: [...availableDoctors.map(d => d.name), "Any Available Doctor"],
      conversationContext: {
        ...context,
        state: CONVERSATION_STATES.ASKING_DOCTOR,
        bookingData,
        availableDoctors,
      },
    };
  }

  // Default greeting - also ask for doctor first
  const availableDoctors = await getAvailableDoctors();
  
  if (availableDoctors.length === 0) {
    return {
      message:
        'Hello! I\'m your AI appointment assistant. 👋\n\nI can help you:\n📅 Book new appointments\n🔄 Reschedule existing appointments\n❌ Cancel appointments\n📋 Check available slots\n\nWhat would you like to do today?\n\n💡 Tip: You can say something like "Book me tomorrow at 7:30 PM" for faster booking!',
      state: CONVERSATION_STATES.GREETING,
      suggestedActions: [
        "book_appointment",
        "check_availability",
        "reschedule",
        "cancel",
      ],
      conversationContext: context,
    };
  }

  return {
    message:
      'Hello! I\'m your AI appointment assistant. 👋\n\nI can help you:\n📅 Book new appointments\n🔄 Reschedule existing appointments\n❌ Cancel appointments\n📋 Check available slots\n\nWhat would you like to do today?\n\n💡 Tip: You can say something like "Book appointment with Dr. Smith tomorrow at 7:30 PM" for faster booking!',
    state: CONVERSATION_STATES.GREETING,
    suggestedActions: [
      "book_appointment",
      "check_availability",
      "reschedule",
      "cancel",
    ],
    conversationContext: context,
  };
};

// Handle date selection
const handleDateSelection = async (parsed, context) => {
  let targetDate = null;
  let dateMessage = "";

  if (parsed.extractedDate) {
    targetDate = parsed.extractedDate;
    const date = new Date(targetDate);
    dateMessage = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } else if (parsed.datePreference) {
    const today = new Date();
    switch (parsed.datePreference) {
      case "today":
        targetDate = today.toISOString().split("T")[0];
        dateMessage = "today";
        break;
      case "tomorrow":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDate = tomorrow.toISOString().split("T")[0];
        dateMessage = "tomorrow";
        break;
      case "next_week":
        // Show next 7 days
        targetDate = null;
        dateMessage = "next week";
        break;
    }
  }

  if (!targetDate && parsed.datePreference !== "next_week") {
    return {
      message:
        'I didn\'t catch the date you\'d prefer. Could you please specify when you\'d like your appointment?\n\n📅 You can say:\n• "Today"\n• "Tomorrow"\n• "Next Monday"\n• Or a specific date',
      state: CONVERSATION_STATES.ASKING_DATE,
      suggestedActions: ["Today", "Tomorrow", "Next Week"],
      conversationContext: context,
    };
  }

  // Get available slots - use doctor-specific availability if doctor is selected
  const doctorId = context.bookingData?.doctorId;
  const doctorName = context.bookingData?.doctorName || context.bookingData?.doctorPreference;
  
  let availableSlots;
  if (doctorId) {
    // Get slots for specific doctor
    availableSlots = await getAvailableSlotsForDoctor(
      targetDate,
      parsed.timePreference,
      doctorId
    );
  } else {
    // Get general slots (will show slots where at least one doctor is available)
    availableSlots = await getAvailableSlots(
      targetDate,
      parsed.timePreference,
      null
    );
  }

  const doctorDisplay = doctorName || "Any Available Doctor";

  if (availableSlots.length === 0) {
    if (targetDate) {
      const date = new Date(targetDate);
      const now = new Date();
      // Create date-only comparison to avoid timezone issues
      const dateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const todayOnly = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const isPast = dateOnly < todayOnly;

      if (isPast) {
        return {
          message:
            "I can't book appointments for past dates. 📅\n\nLet me show you available slots for today and upcoming days. When would you prefer your appointment?",
          state: CONVERSATION_STATES.ASKING_DATE,
          suggestedActions: ["Today", "Tomorrow", "Next Week"],
          conversationContext: context,
        };
      }
    }

    const noSlotsMessage = doctorId 
      ? `Unfortunately, ${doctorDisplay} has no available slots for ${dateMessage}. 😔\n\nWould you like to:\n• Try a different date\n• Choose a different doctor`
      : `Unfortunately, there are no available slots for ${dateMessage}. 😔\n\nWould you like me to check other dates?`;

    return {
      message: noSlotsMessage,
      state: CONVERSATION_STATES.ASKING_DATE,
      suggestedActions: doctorId ? ["Tomorrow", "Next Week", "Change Doctor"] : ["Tomorrow", "Next Week"],
      conversationContext: context,
    };
  }

  // Group slots by time category
  const morningSlots = availableSlots.filter(
    (slot) => slot.timeCategory === "Morning"
  );
  const afternoonSlots = availableSlots.filter(
    (slot) => slot.timeCategory === "Afternoon"
  );
  const eveningSlots = availableSlots.filter(
    (slot) => slot.timeCategory === "Evening"
  );

  let slotsMessage = doctorId 
    ? `Great! I found ${availableSlots.length} available slots for ${doctorDisplay} on ${dateMessage}:\n\n`
    : `Great! I found ${availableSlots.length} available slots for ${dateMessage}:\n\n`;

  // Smart display logic - show more slots in a compact format
  const totalSlots = availableSlots.length;

  if (totalSlots <= 6) {
    // Show all slots if 6 or fewer
    availableSlots.forEach((slot) => {
      slotsMessage += `• ${slot.time}\n`;
    });
  } else {
    // Show slots by category with pagination-like display
    if (morningSlots.length > 0) {
      slotsMessage += `🌅 Morning: `;
      slotsMessage += morningSlots
        .slice(0, 4)
        .map((slot) => slot.time)
        .join(", ");
      if (morningSlots.length > 4)
        slotsMessage += ` (+${morningSlots.length - 4} more)`;
      slotsMessage += `\n\n`;
    }

    if (afternoonSlots.length > 0) {
      slotsMessage += `☀️ Afternoon: `;
      slotsMessage += afternoonSlots
        .slice(0, 4)
        .map((slot) => slot.time)
        .join(", ");
      if (afternoonSlots.length > 4)
        slotsMessage += ` (+${afternoonSlots.length - 4} more)`;
      slotsMessage += `\n\n`;
    }

    if (eveningSlots.length > 0) {
      slotsMessage += `🌙 Evening: `;
      slotsMessage += eveningSlots
        .slice(0, 4)
        .map((slot) => slot.time)
        .join(", ");
      if (eveningSlots.length > 4)
        slotsMessage += ` (+${eveningSlots.length - 4} more)`;
      slotsMessage += `\n\n`;
    }
  }

  slotsMessage +=
    'Which time works best for you? You can tell me the exact time or say "morning", "afternoon", or "evening".';

  context.state = CONVERSATION_STATES.SHOWING_SLOTS;
  context.availableSlots = availableSlots; // Pass ALL available slots, not just first 6
  context.bookingData = { ...context.bookingData, targetDate, dateMessage };

  return {
    message: slotsMessage,
    state: CONVERSATION_STATES.SHOWING_SLOTS,
    availableSlots: availableSlots, // Pass ALL available slots to frontend too
    suggestedActions: ["Change Date", "Morning", "Afternoon", "Evening"],
    conversationContext: context,
  };
};

// Simplified slot/time selection with real-time availability check
const handleSlotSelection = async (parsed, context) => {
  const userMessage = parsed.originalMessage.trim();
  console.log(`🕐 Handling slot selection - User message: "${userMessage}"`);
  console.log(`🕐 Parsed extractedTime: "${parsed.extractedTime}"`);
  console.log(
    `🕐 Available slots:`,
    context.availableSlots.map((s) => s.time)
  );

  // First, check if the selected slot is still available
  const selectedSlot = context.availableSlots?.find(
    slot => slot.time === parsed.extractedTime || 
           slot.time === normalizeTimeFormat(parsed.extractedTime)
  );

  if (selectedSlot) {
    console.log(`🔍 Checking real-time availability for ${selectedSlot.time} on ${selectedSlot.date}`);
    
    // Check if the slot is still available for the selected doctor
    const doctorId = context.bookingData?.doctorId;
    const whereClause = {
      date: {
        equals: new Date(selectedSlot.date)
      },
      time: {
        equals: selectedSlot.time
      },
      status: {
        notIn: ["Cancelled", "Completed"]
      }
    };
    
    // If specific doctor is selected, check only that doctor's appointments
    if (doctorId) {
      whereClause.doctorId = doctorId;
    }
    
    const existingAppointment = await prisma.appointment.findFirst({
      where: whereClause
    });

    if (existingAppointment) {
      const doctorName = context.bookingData?.doctorName || "the doctor";
      console.log(`❌ Slot ${selectedSlot.time} was just taken for ${doctorName}`);
      
      // Get next available slots for this doctor
      const nextSlots = doctorId 
        ? await getAvailableSlotsForDoctor(selectedSlot.date, null, doctorId)
        : await getAvailableSlots(selectedSlot.date);
      
      const availableSlots = nextSlots.filter(slot => 
        !context.availableSlots.some(s => s.time === slot.time && s.date === slot.date)
      );

      const message = doctorId
        ? `I apologize, but that time slot was just taken for ${doctorName}. Here are some other available times:\n\n${
            availableSlots.slice(0, 3).map(slot => `• ${slot.time} on ${slot.displayDate}`).join('\n')
          }\n\nWould you like any of these times instead?`
        : `I apologize, but that time slot was just taken. Here are some other available times:\n\n${
            availableSlots.slice(0, 3).map(slot => `• ${slot.time} on ${slot.displayDate}`).join('\n')
          }\n\nWould you like any of these times instead?`;

      return {
        message: message,
        conversationContext: {
          ...context,
          state: CONVERSATION_STATES.SHOWING_SLOTS,
          availableSlots
        }
      };
    }
  }

  // PRIORITY CHECK: Detect if user wants to change date instead of selecting time
  if (parsed.extractedDate || parsed.datePreference) {
    console.log(`🔄 User wants to change date - redirecting to date selection`);
    console.log(
      `🔄 Extracted date: ${parsed.extractedDate}, Date preference: ${parsed.datePreference}`
    );

    // User wants to change the date, redirect to date selection handler
    return await handleDateSelection(parsed, {
      ...context,
      state: CONVERSATION_STATES.ASKING_DATE,
      bookingData: { ...context.bookingData }, // Keep existing booking data
    });
  }

  // PRIORITY CHECK: Detect "Change Date" button click or date change phrases
  if (userMessage.toLowerCase() === "change date") {
    console.log(`🔄 User clicked "Change Date" button`);
    return {
      message:
        'When would you like to schedule your appointment?\n\n📅 You can say:\n• "Today" (if available)\n• "Tomorrow"\n• "Next week"\n• Or a specific date like "August 7th"',
      state: CONVERSATION_STATES.ASKING_DATE,
      suggestedActions: ["Today", "Tomorrow", "Next Week"],
      conversationContext: {
        ...context,
        state: CONVERSATION_STATES.ASKING_DATE,
        bookingData: { ...context.bookingData }, // Keep existing booking data but allow date change
      },
    };
  }

  // PRIORITY CHECK: Detect common date change phrases
  const dateChangePatterns = [
    /sorry.*want.*book.*(?:in|on|for)\s*(.*)/i, // "sorry, I want to book in aug 7"
    /actually.*want.*(?:in|on|for)\s*(.*)/i, // "actually I want it on tomorrow"
    /change.*date.*(?:to|in|on)\s*(.*)/i, // "change date to aug 7"
    /different.*date.*(?:in|on)\s*(.*)/i, // "different date in august"
    /not.*today.*want.*(?:in|on)\s*(.*)/i, // "not today, want it on aug 7"
  ];

  for (const pattern of dateChangePatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      console.log(`🔄 Detected date change request: "${userMessage}"`);

      // Try to parse the new date from the message
      const newDateParsed = await parseUserInput(
        userMessage,
        CONVERSATION_STATES.ASKING_DATE
      );
      if (newDateParsed.extractedDate || newDateParsed.datePreference) {
        console.log(
          `🔄 Redirecting to new date: ${
            newDateParsed.extractedDate || newDateParsed.datePreference
          }`
        );
        return await handleDateSelection(newDateParsed, {
          ...context,
          state: CONVERSATION_STATES.ASKING_DATE,
          bookingData: { ...context.bookingData },
        });
      }
    }
  }

  let matchingSlot = null;

  // Priority 1: Use AI-parsed extracted time (most reliable)
  if (parsed.extractedTime) {
    const normalizedTime = normalizeTimeFormat(parsed.extractedTime);

    // Try both normalized format and original format
    matchingSlot = context.availableSlots.find(
      (slot) =>
        slot.time === normalizedTime ||
        slot.time === parsed.extractedTime ||
        // Also try without zero-padding for hour (7:00 PM vs 07:00 PM)
        slot.time === normalizedTime.replace(/^0/, "") ||
        slot.time.replace(/^0/, "") === normalizedTime.replace(/^0/, "")
    );

    if (matchingSlot) {
      console.log(
        `✅ Found match with AI-parsed time: ${normalizedTime} -> ${matchingSlot.time}`
      );
    }
  }

  // Priority 2: Direct exact match
  if (!matchingSlot) {
    matchingSlot = context.availableSlots.find(
      (slot) => slot.time === userMessage
    );

    if (matchingSlot) {
      console.log(`✅ Found exact match: ${userMessage}`);
    }
  }

  // Priority 3: Simple pattern matching for common formats
  if (!matchingSlot) {
    const timeMatch = userMessage.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      const formattedTime = `${hour}:${minute
        .toString()
        .padStart(2, "0")} ${period}`;

      matchingSlot = context.availableSlots.find(
        (slot) => slot.time === formattedTime
      );

      if (matchingSlot) {
        console.log(`✅ Found match with pattern: ${formattedTime}`);
      }
    }
  }

  // Priority 4: Flexible matching (contains check)
  if (!matchingSlot) {
    matchingSlot = context.availableSlots.find((slot) => {
      const slotParts = slot.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (slotParts) {
        const slotHour = slotParts[1];
        const slotMinute = slotParts[2];
        const slotPeriod = slotParts[3];

        return (
          userMessage.includes(slotHour) &&
          userMessage.includes(slotMinute) &&
          userMessage.toUpperCase().includes(slotPeriod.toUpperCase())
        );
      }
      return false;
    });

    if (matchingSlot) {
      console.log(
        `✅ Found match with flexible matching: ${matchingSlot.time}`
      );
    }
  }

  // If we found a matching slot, proceed with booking
  if (matchingSlot) {
    console.log(
      `✅ Selected slot: ${matchingSlot.time} on ${matchingSlot.displayDate}`
    );

    // Update booking data with selected slot
    context.bookingData = {
      ...context.bookingData,
      selectedSlot: matchingSlot,
      selectedDate: matchingSlot.date,
      selectedTime: matchingSlot.time,
    };

    // Check if we already have patient info
    const hasPatientInfo =
      context.bookingData.patientName && context.bookingData.patientPhone;

    // NEW FLOW: Doctor is already selected before date/time
    // After slot selection, go to appointment type
    const hasDoctor = context.bookingData?.doctorId !== undefined || 
                      context.bookingData?.doctorName || 
                      context.bookingData?.doctorPreference;
    
    const doctorDisplay = context.bookingData?.doctorName || context.bookingData?.doctorPreference || "Any Available Doctor";

    if (hasPatientInfo) {
      // We have patient info, check if we have appointment type
      const hasAppointmentType = context.bookingData?.appointmentType && 
                                  context.bookingData.appointmentType !== "null";
      
      if (hasAppointmentType) {
        // We have everything, go to confirmation
        context.state = CONVERSATION_STATES.CONFIRMING_BOOKING;
        
        return {
          message: `Perfect! Let me confirm your appointment details:\n\n📅 Date & Time: ${matchingSlot.displayDate} at ${matchingSlot.time}\n👤 Patient: ${context.bookingData.patientName}\n📞 Phone: ${context.bookingData.patientPhone}\n👨‍⚕️ Doctor: ${doctorDisplay}\n🏥 Type: ${context.bookingData.appointmentType}\n\nShall I confirm this appointment booking?`,
          state: CONVERSATION_STATES.CONFIRMING_BOOKING,
          suggestedActions: ["Yes", "No"],
          conversationContext: context,
        };
      }
      
      // Ask for appointment type
      context.state = CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE;
      
      // Load appointment types from database
      let availableTypes = [];
      try {
        const settings = await prisma.appointmentSettings.findFirst();
        if (settings && settings.appointmentTypes && Array.isArray(settings.appointmentTypes)) {
          availableTypes = settings.appointmentTypes;
        }
      } catch (error) {
        console.error("Error loading appointment types:", error);
      }

      let typesMessage = `Perfect! I'll book you for ${matchingSlot.time} on ${matchingSlot.displayDate} with ${doctorDisplay}. ✅\n\n🏥 What type of appointment would you like?\n\n`;
      availableTypes.forEach((type) => {
        typesMessage += `• ${type}\n`;
      });
      typesMessage += `\n💡 Tip: Just type the name (e.g., "consultation")`;

      return {
        message: typesMessage,
        state: CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE,
        selectedSlot: matchingSlot,
        availableTypes: availableTypes,
        suggestedActions: availableTypes,
        conversationContext: context,
      };
    } else {
      // We need patient info first
      context.state = CONVERSATION_STATES.COLLECTING_PATIENT_INFO;
      return {
        message: `Perfect! I'll book you for ${matchingSlot.time} on ${matchingSlot.displayDate} with ${doctorDisplay}. ✅\n\n👤 I need your name and phone number to complete the booking.\n\nPlease provide both (e.g., "John Smith, 9876543210")`,
        state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
        selectedSlot: matchingSlot,
        conversationContext: context,
      };
    }
  }

  // No match found - show available options
  console.log(`❌ No matching slot found for: "${userMessage}"`);
  console.log(`❌ Parsed extractedTime: "${parsed.extractedTime}"`);
  console.log(
    `❌ Available slot times:`,
    context.availableSlots.map((s) => s.time)
  );

  // If we have extracted time but no matching slot, show error with alternatives
  if (parsed.extractedTime) {
    return {
      message: `I'm sorry, ${
        parsed.extractedTime
      } is not available. Here are all the available times:\n\n${context.availableSlots
        .map((slot) => `• ${slot.time}`)
        .join("\n")}\n\nWhich of these works for you?`,
      state: CONVERSATION_STATES.SHOWING_SLOTS,
      availableSlots: context.availableSlots, // Show ALL available slots
      conversationContext: context,
    };
  }

  if (parsed.timePreference) {
    // User specified time preference (morning/afternoon)
    const filteredSlots = context.availableSlots.filter((slot) => {
      const hour = parseInt(slot.time.split(":")[0]);
      const isPM = slot.time.includes("PM");
      const hour24 =
        isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour;

      switch (parsed.timePreference) {
        case "morning":
          return hour24 >= 9 && hour24 < 12;
        case "afternoon":
          return hour24 >= 12 && hour24 < 17;
        case "evening":
          return hour24 >= 17;
        default:
          return true;
      }
    });

    if (filteredSlots.length === 0) {
      return {
        message: `I don't have any ${
          parsed.timePreference
        } slots available. Here are all available times:\n\n${context.availableSlots
          .map((slot) => `• ${slot.time}`)
          .join("\n")}\n\nWould any of these work for you?`,
        state: CONVERSATION_STATES.SHOWING_SLOTS,
        availableSlots: context.availableSlots, // Show ALL available slots
        conversationContext: context,
      };
    }

    return {
      message: `Here are the available ${
        parsed.timePreference
      } slots:\n\n${filteredSlots
        .map((slot) => `• ${slot.time}`)
        .join("\n")}\n\nWhich specific time would you prefer?`,
      state: CONVERSATION_STATES.SHOWING_SLOTS,
      availableSlots: filteredSlots, // Show ALL filtered slots
      conversationContext: context,
    };
  }

  // If we reach here, no slot was selected and no time preference was given
  // This is likely the issue - the user clicked a time slot but we didn't recognize it
  console.log(`⚠️ Reached fallback message - this might be the issue!`);
  console.log(`⚠️ User message: "${userMessage}"`);
  console.log(
    `⚠️ Available slots: ${context.availableSlots
      .map((s) => s.time)
      .join(", ")}`
  );

  return {
    message: `I didn't catch which time you selected. Please let me know which time you'd prefer:\n\n${context.availableSlots
      .map((slot) => `• ${slot.time}`)
      .join(
        "\n"
      )}\n\n⏰ Click on a time above or type the exact time (e.g., "7:00 PM")`,
    state: CONVERSATION_STATES.SHOWING_SLOTS,
    availableSlots: context.availableSlots, // Show ALL available slots
    conversationContext: context,
  };
};

// Handle time selection (if needed)
const handleTimeSelection = async (parsed, context) => {
  // This is handled in handleSlotSelection
  return handleSlotSelection(parsed, context);
};

// Handle doctor selection
const handleDoctorSelection = async (parsed, context) => {
  console.log(`👨‍⚕️ Handling doctor selection - User message: "${parsed.originalMessage}"`);
  
  const userMessage = parsed.originalMessage.trim().toLowerCase();
  const availableDoctors = context.availableDoctors || await getAvailableDoctors();
  
  let selectedDoctor = null;
  
  // Check for "any" or "any available" selection
  if (userMessage.includes("any") || userMessage.includes("no preference")) {
    console.log(`✅ User selected "Any Available Doctor"`);
    context.bookingData = context.bookingData || {};
    context.bookingData.doctorId = null;
    context.bookingData.doctorName = null;
    context.bookingData.doctorPreference = "Any Available";
  } else {
    // Try to match with available doctors
    for (const doctor of availableDoctors) {
      const doctorNameLower = doctor.name.toLowerCase();
      if (
        userMessage === doctorNameLower ||
        userMessage.includes(doctorNameLower) ||
        doctorNameLower.includes(userMessage) ||
        // Also check for partial matches (first name or last name)
        doctorNameLower.split(' ').some(part => userMessage.includes(part) && part.length > 2)
      ) {
        selectedDoctor = doctor;
        break;
      }
    }
    
    // Also try number selection
    if (!selectedDoctor) {
      const numberMatch = userMessage.match(/^(\d+)$/);
      if (numberMatch) {
        const index = parseInt(numberMatch[1]) - 1;
        if (index >= 0 && index < availableDoctors.length) {
          selectedDoctor = availableDoctors[index];
        }
      }
    }
    
    if (selectedDoctor) {
      console.log(`✅ Selected doctor: ${selectedDoctor.name} (ID: ${selectedDoctor.id})`);
      context.bookingData = context.bookingData || {};
      context.bookingData.doctorId = selectedDoctor.id;
      context.bookingData.doctorName = selectedDoctor.name;
      context.bookingData.doctorPreference = selectedDoctor.name;
    } else {
      // No match found, show options again
      let doctorMessage = `I couldn't find that doctor. Please select from the available doctors:\n\n`;
      
      availableDoctors.forEach((doctor, index) => {
        const qualification = doctor.qualification ? ` (${doctor.qualification})` : '';
        doctorMessage += `• ${doctor.name}${qualification}\n`;
      });
      
      doctorMessage += `• Any Available Doctor\n`;
      doctorMessage += `\n💡 Tip: Just type the doctor's name or "any"`;

      return {
        message: doctorMessage,
        state: CONVERSATION_STATES.ASKING_DOCTOR,
        availableDoctors: availableDoctors,
        suggestedActions: [...availableDoctors.map(d => d.name), "Any Available Doctor"],
        conversationContext: context,
      };
    }
  }
  
  const doctorDisplay = selectedDoctor ? selectedDoctor.name : "Any Available Doctor";
  
  // NEW FLOW: After doctor selection, ask for date
  // Check if we already have date and time from initial request
  if (context.bookingData.selectedDate && context.bookingData.selectedTime) {
    // We have date and time, verify slot is available for this doctor
    const doctorId = context.bookingData.doctorId;
    const availableSlots = await getAvailableSlotsForDoctor(
      context.bookingData.selectedDate,
      null,
      doctorId
    );
    
    const requestedSlot = availableSlots.find(
      slot => slot.time === context.bookingData.selectedTime
    );
    
    if (requestedSlot) {
      // Slot is available, proceed to appointment type
      context.state = CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE;
      
      let availableTypes = [];
      try {
        const settings = await prisma.appointmentSettings.findFirst();
        if (settings && settings.appointmentTypes && Array.isArray(settings.appointmentTypes)) {
          availableTypes = settings.appointmentTypes;
        }
      } catch (error) {
        console.error("Error loading appointment types:", error);
      }

      let typesMessage = `Great! I'll book your appointment with ${doctorDisplay} for ${context.bookingData.selectedTime} on ${formatDate(context.bookingData.selectedDate)}. ✅\n\n🏥 What type of appointment would you like?\n\n`;
      
      availableTypes.forEach((type) => {
        typesMessage += `• ${type}\n`;
      });
      
      typesMessage += `\n💡 Tip: Just type the name (e.g., "consultation")`;

      return {
        message: typesMessage,
        state: CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE,
        availableTypes: availableTypes,
        suggestedActions: availableTypes,
        conversationContext: context,
      };
    } else {
      // Requested slot not available for this doctor, show available slots
      context.state = CONVERSATION_STATES.SHOWING_SLOTS;
      context.availableSlots = availableSlots;
      
      if (availableSlots.length === 0) {
        return {
          message: `I'm sorry, ${doctorDisplay} has no available slots on ${formatDate(context.bookingData.selectedDate)}.\n\nWould you like to:\n• Try a different date\n• Choose a different doctor`,
          state: CONVERSATION_STATES.ASKING_DATE,
          suggestedActions: ["Today", "Tomorrow", "Next Week", "Change Doctor"],
          conversationContext: {
            ...context,
            state: CONVERSATION_STATES.ASKING_DATE,
          },
        };
      }
      
      return {
        message: `The ${context.bookingData.selectedTime} slot is not available for ${doctorDisplay}.\n\nHere are the available slots:\n\n${availableSlots.map(slot => `• ${slot.time}`).join('\n')}\n\nWhich time works for you?`,
        state: CONVERSATION_STATES.SHOWING_SLOTS,
        availableSlots: availableSlots,
        suggestedActions: availableSlots.slice(0, 5).map(s => s.time),
        conversationContext: context,
      };
    }
  }
  
  // No date selected yet, ask for date
  context.state = CONVERSATION_STATES.ASKING_DATE;
  
  return {
    message: `Great choice! I'll book your appointment with ${doctorDisplay}. ✅\n\n📅 When would you like to schedule your appointment?\n\nYou can say:\n• "Today" (if available)\n• "Tomorrow"\n• "Next week"\n• Or a specific date like "January 15th"`,
    state: CONVERSATION_STATES.ASKING_DATE,
    suggestedActions: ["Today", "Tomorrow", "Next Week"],
    conversationContext: context,
  };
};

// Handle appointment type selection with modern UX
const handleAppointmentTypeSelection = async (parsed, context) => {
  try {
    // Get appointment settings to fetch available appointment types
    const settings = await prisma.appointmentSettings.findFirst();
    let availableTypes = [];

    console.log("🔍 Appointment settings found:", settings ? "Yes" : "No");
    /*     if (settings) {
      console.log('🔍 Available fields in settings:', Object.keys(settings));
      console.log('🔍 appointmentTypes field:', settings.appointmentTypes);
      console.log('🔍 types field:', settings.types);
    }

    // Try to get appointment types from settings - check multiple possible field names
    if (settings) {
      // Check for appointmentTypes field (could be JSON string or array)
      if (settings.appointmentTypes) {
        if (typeof settings.appointmentTypes === 'string') {
          try {
            availableTypes = JSON.parse(settings.appointmentTypes);
            console.log('✅ Loaded appointment types from appointmentTypes (string):', availableTypes);
          } catch (e) {
            console.log('❌ Failed to parse appointmentTypes from settings:', e.message);
          }
        } else if (Array.isArray(settings.appointmentTypes)) { */
    if (
      settings &&
      settings.appointmentTypes &&
      Array.isArray(settings.appointmentTypes)
    ) {
      availableTypes = settings.appointmentTypes;
      /*     console.log('✅ Loaded appointment types from appointmentTypes (array):', availableTypes);
        }
      }
      
      // Check for types field as alternative
      if ((!availableTypes || availableTypes.length === 0) && settings.types) {
        if (typeof settings.types === 'string') {
          try {
            availableTypes = JSON.parse(settings.types);
            console.log('✅ Loaded appointment types from types (string):', availableTypes);
          } catch (e) {
            console.log('❌ Failed to parse types from settings:', e.message);
          }
        } else if (Array.isArray(settings.types)) {
          availableTypes = settings.types;
          console.log('✅ Loaded appointment types from types (array):', availableTypes);
        }
      }

      // Check for other possible field names
      const possibleFields = ['appointmentType', 'appointmentTypeOptions', 'typeOptions', 'availableTypes'];
      for (const field of possibleFields) {
        if ((!availableTypes || availableTypes.length === 0) && settings[field]) {
          if (typeof settings[field] === 'string') {
            try {
              availableTypes = JSON.parse(settings[field]);
              console.log(`✅ Loaded appointment types from ${field} (string):`, availableTypes);
              break;
            } catch (e) {
              console.log(`❌ Failed to parse ${field} from settings:`, e.message);
            }
          } else if (Array.isArray(settings[field])) {
            availableTypes = settings[field];
            console.log(`✅ Loaded appointment types from ${field} (array):`, availableTypes);
            break;
          }
        }
      }
    }

    // Fallback to comprehensive default types if no settings found or empty
    if (!availableTypes || availableTypes.length === 0) {
      availableTypes = [
        "General Consultation",
        "Follow-up Visit", 
        "Routine Checkup",
        "Specialist Consultation",
        "Emergency Visit",
        "Urgent Care",
        "Lab Test",
        "Blood Test",
        "Urine Test",
        "X-Ray",
        "Ultrasound",
        "CT Scan",
        "MRI",
        "ECG",
        "Echo",
        "Vaccination",
        "Immunization",
        "Physical Exam",
        "Annual Physical",
        "Health Screening",
        "Preventive Care",
        "Dental Checkup",
        "Dental Cleaning",
        "Eye Examination",
        "Vision Test",
        "Cardiology Consultation",
        "Dermatology Consultation",
        "Orthopedic Consultation",
        "Gynecology Consultation",
        "Pediatric Consultation",
        "Mental Health Consultation",
        "Therapy Session",
        "Counseling",
        "Nutrition Consultation",
        "Diabetes Management",
        "Hypertension Management",
        "Chronic Disease Management",
        "Pre-operative Assessment",
        "Post-operative Follow-up",
        "Wound Care",
        "Injection",
        "Minor Procedure",
        "Biopsy",
        "Endoscopy",
        "Colonoscopy"
      ];
      console.log(`⚠️ Using comprehensive default appointment types as fallback (${availableTypes.length} types)`);
      console.log('⚠️ Please configure appointment types in your settings for customized options'); */
      console.log("✅ Loaded appointment types from database:", availableTypes);
      console.log(
        `📋 Total appointment types available: ${availableTypes.length}`
      );
    } else {
      console.error("❌ No appointment types found in database settings!");
      console.error(
        "❌ Please configure appointment types in your appointment settings"
      );

      // Return error instead of fallback
      return {
        message:
          "❌ Configuration Error\n\nAppointment types are not configured in the system settings. Please contact the administrator to configure appointment types before booking appointments.",
        state: CONVERSATION_STATES.GREETING,
        conversationContext: {
          ...context,
          state: CONVERSATION_STATES.GREETING,
          bookingData: {},
        },
      };
    }

    console.log("Available appointment types:", availableTypes);
    const userMessage = parsed.originalMessage.toLowerCase();

    // Try to match user input with available appointment types (flexible matching)
    let selectedType = null;

    // First, try exact matches and partial matches
    for (const type of availableTypes) {
      const typeLower = type.toLowerCase();
      if (
        userMessage === typeLower ||
        userMessage.includes(typeLower) ||
        typeLower.includes(userMessage.trim()) ||
        userMessage === (availableTypes.indexOf(type) + 1).toString() // number selection
      ) {
        selectedType = type;
        break;
      }
    }

    // Enhanced smart matching for common variations
    if (!selectedType) {
      const smartMatches = {
        // Common variations
        consultation: ["consultation", "consult", "general consultation"],
        checkup: ["checkup", "check up", "routine checkup", "routine"],
        followup: ["follow-up", "followup", "follow up"],
        emergency: ["emergency", "urgent", "urgent care"],
        specialist: ["specialist", "specialist visit"],
        lab: ["lab test", "lab", "test", "blood test"],
        vaccination: ["vaccination", "vaccine", "shot", "immunization"],
        physical: ["physical exam", "physical", "annual physical"],
        dental: ["dental", "teeth", "tooth"],
        eye: ["eye exam", "vision", "eye test"],
      };

      for (const type of availableTypes) {
        const typeLower = type.toLowerCase();

        // Check if any smart match keywords are in the user message
        for (const [keyword, variations] of Object.entries(smartMatches)) {
          if (
            variations.some(
              (variation) =>
                typeLower.includes(variation) || variation.includes(typeLower)
            )
          ) {
            if (
              variations.some((variation) => userMessage.includes(variation))
            ) {
              selectedType = type;
              break;
            }
          }
        }

        if (selectedType) break;
      }
    }

    if (selectedType) {
      // Valid appointment type selected
      context.bookingData.appointmentType = selectedType;

      console.log(`🎯 Appointment type selected: ${selectedType}`);
      console.log(`📋 Current booking data:`, context.bookingData);

      // SAFETY CHECK: Clean up any null values that might have been set
      if (
        context.bookingData.patientName === null ||
        context.bookingData.patientName === "null"
      ) {
        delete context.bookingData.patientName;
        console.log(`🧹 Cleaned up null patientName`);
      }
      if (
        context.bookingData.patientPhone === null ||
        context.bookingData.patientPhone === "null"
      ) {
        delete context.bookingData.patientPhone;
        console.log(`🧹 Cleaned up null patientPhone`);
      }

      // CRITICAL: Always check for patient info - NEVER skip this step
      // Check for null, undefined, empty string, or 'null' string
      const hasPatientName =
        context.bookingData.patientName &&
        context.bookingData.patientName !== null &&
        context.bookingData.patientName !== "null" &&
        context.bookingData.patientName.toString().trim() !== "";

      const hasPatientPhone =
        context.bookingData.patientPhone &&
        context.bookingData.patientPhone !== null &&
        context.bookingData.patientPhone !== "null" &&
        context.bookingData.patientPhone.toString().trim() !== "";

      console.log(
        `👤 Has patient name: ${hasPatientName} (value: "${
          context.bookingData.patientName
        }", type: ${typeof context.bookingData.patientName})`
      );
      console.log(
        `📞 Has patient phone: ${hasPatientPhone} (value: "${
          context.bookingData.patientPhone
        }", type: ${typeof context.bookingData.patientPhone})`
      );

      // ALWAYS collect patient info if ANY validation fails
      if (!hasPatientName || !hasPatientPhone) {
        // ALWAYS collect patient info if missing - NO EXCEPTIONS
        console.log(`❌ Missing patient info - redirecting to collection`);
        context.state = CONVERSATION_STATES.COLLECTING_PATIENT_INFO;

        return {
          message: `Perfect! I'll book this as a ${selectedType}.\n\n👤 Now I need your details to complete the booking:\n\n📝 Please provide your full name and phone number in one message\n💡 Example: "John Smith, 9876543210"\n\n⚠️ Both name and phone are required to proceed.`,
          state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
          conversationContext: context,
        };
      } else {
        // DOUBLE CHECK: Ensure we actually have valid patient info before confirmation
        if (
          !context.bookingData.patientName ||
          !context.bookingData.patientPhone ||
          context.bookingData.patientName === "null" ||
          context.bookingData.patientPhone === "null"
        ) {
          console.log(
            `❌ SAFETY CHECK FAILED - Patient info is null/invalid, forcing collection`
          );
          console.log(
            `❌ Name: "${context.bookingData.patientName}", Phone: "${context.bookingData.patientPhone}"`
          );

          context.state = CONVERSATION_STATES.COLLECTING_PATIENT_INFO;
          return {
            message: `Perfect! I'll book this as a ${selectedType}.\n\n👤 Now I need your details to complete the booking:\n\n📝 Please provide your full name and phone number in one message\n💡 Example: "John Smith, 9876543210"\n\n⚠️ Both name and phone are required to proceed.`,
            state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
            conversationContext: context,
          };
        }

        // Check if we have doctor selected
        const hasDoctor =
          context.bookingData.doctorId !== undefined ||
          context.bookingData.doctorName ||
          context.bookingData.doctorPreference;

        if (!hasDoctor) {
          console.log(`❌ Doctor not selected - redirecting to doctor selection`);
          context.state = CONVERSATION_STATES.ASKING_DOCTOR;

          // Load available doctors
          const availableDoctors = await getAvailableDoctors();
          
          if (availableDoctors.length === 0) {
            // No doctors available, skip to confirmation
            console.log("⚠️ No doctors available, skipping doctor selection");
            context.bookingData.doctorPreference = "Any Available";
          } else {
            // Show available doctors
            let doctorMessage = `Perfect! I'll book this as a ${selectedType}.\n\n👨‍⚕️ Which doctor would you like to see?\n\n`;
            
            availableDoctors.forEach((doctor, index) => {
              const qualification = doctor.qualification ? ` (${doctor.qualification})` : '';
              doctorMessage += `• ${doctor.name}${qualification}\n`;
            });
            
            doctorMessage += `• Any Available Doctor\n`;
            doctorMessage += `\n💡 Tip: Just type the doctor's name or "any"`;

            context.availableDoctors = availableDoctors;

            return {
              message: doctorMessage,
              state: CONVERSATION_STATES.ASKING_DOCTOR,
              availableDoctors: availableDoctors,
              suggestedActions: [...availableDoctors.map(d => d.name), "Any Available Doctor"],
              conversationContext: context,
            };
          }
        }

        // We have patient info, proceed to confirmation
        console.log(`✅ Patient info complete - proceeding to confirmation`);
        console.log(
          `✅ Name: "${context.bookingData.patientName}", Phone: "${context.bookingData.patientPhone}"`
        );
        context.state = CONVERSATION_STATES.CONFIRMING_BOOKING;

        const appointmentDate =
          context.bookingData.selectedSlot?.displayDate ||
          (context.bookingData.selectedDate
            ? formatDate(context.bookingData.selectedDate)
            : "Selected date");
        const appointmentTime =
          context.bookingData.selectedSlot?.time ||
          context.bookingData.selectedTime ||
          "Selected time";
        const doctorDisplay = context.bookingData.doctorName || context.bookingData.doctorPreference || "Any Available Doctor";

        return {
          message: `Perfect! Let me confirm your appointment details:\n\n📅 Date & Time: ${appointmentDate} at ${appointmentTime}\n👤 Patient: ${context.bookingData.patientName}\n📞 Phone: ${context.bookingData.patientPhone}\n👨‍⚕️ Doctor: ${doctorDisplay}\n🏥 Type: ${selectedType}\n\nShall I confirm this appointment booking?`,
          state: CONVERSATION_STATES.CONFIRMING_BOOKING,
          suggestedActions: ["Yes", "No"],
          conversationContext: context,
        };
      }
    } else {
      // Show ALL available appointment types from database (no limits)
      let typesMessage = `What type of appointment would you like?\n\n`;

      // Show all types with numbers for easy selection (like time slots)
      availableTypes.forEach((type, index) => {
        typesMessage += `• ${type}\n`;
      });

      typesMessage += `\n💡 Tip: Just type the name (e.g., "consultation") or number (e.g., "1" for first option)`;

      console.log(
        `📋 Displaying all ${availableTypes.length} appointment types from database`
      );

      return {
        message: typesMessage,
        state: CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE,
        availableTypes: availableTypes,
        suggestedActions: availableTypes, // Show ALL types as selectable (like time slots)
        conversationContext: context,
      };
    }
  } catch (error) {
    console.error("Error handling appointment type selection:", error);
    // Fallback to default type
    context.bookingData.appointmentType = "General Consultation";
    context.state = CONVERSATION_STATES.COLLECTING_PATIENT_INFO;

    return {
      message: `Perfect! I'll book this as a General Consultation.\n\nI just need your name and phone number to complete the booking.`,
      state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
      suggestedActions: ["provide_info"],
      conversationContext: context,
    };
  }
};

// Handle patient information collection - Modern efficient approach
const handlePatientInfo = async (parsed, context) => {
  console.log(`👤 Collecting patient info - Parsed:`, parsed);
  console.log(`👤 Current booking data:`, context.bookingData);

  if (!context.bookingData) context.bookingData = {};

  // Modern approach: Try to extract all fields from single message
  const message = parsed.originalMessage.trim();


  // Pattern 1: "Name, Phone, Email, Age" format (e.g., "John Smith, 9876543210, john@email.com, 30")
  const allFieldsPattern =
    /^([a-zA-Z\s]{2,50}),\s*(\d{10}),\s*([^\s@]+@[^\s@]+\.[^\s@]+),\s*(\d{1,3})$/;
  const allFieldsMatch = message.match(allFieldsPattern);

  if (allFieldsMatch) {
    const extractedName = allFieldsMatch[1].trim();
    const extractedPhone = allFieldsMatch[2];
    const extractedEmail = allFieldsMatch[3].trim();
    const extractedAge = parseInt(allFieldsMatch[4]);

    context.bookingData.patientName = extractedName;
    context.bookingData.patientPhone = extractedPhone;
    context.bookingData.patientEmail = extractedEmail;
    context.bookingData.patientAge = extractedAge;

    console.log(
      `✅ Extracted all fields from single message - Name: ${extractedName}, Phone: ${extractedPhone}, Email: ${extractedEmail}, Age: ${extractedAge}`
    );
  } else {
    // Pattern 2: "Name, Phone" format (e.g., "John Smith, 9876543210")
    const namePhonePattern = /^([a-zA-Z\s]{2,50}),\s*(\d{10})$/;
    const namePhoneMatch = message.match(namePhonePattern);

    if (namePhoneMatch) {
      const extractedName = namePhoneMatch[1].trim();
      const extractedPhone = namePhoneMatch[2];

      context.bookingData.patientName = extractedName;
      context.bookingData.patientPhone = extractedPhone;

      console.log(
        `✅ Extracted name and phone from single message - Name: ${extractedName}, Phone: ${extractedPhone}`
      );
    } else {
      // Fallback: Extract individually

      // Extract patient name
      if (parsed.patientName) {
        context.bookingData.patientName = parsed.patientName;
        console.log(`👤 Set patient name from parsed:`, parsed.patientName);
      } else if (!context.bookingData.patientName) {
        // Try to extract name using patterns
        const namePatterns = [
          /(?:my name is|i'm|i am)\s+([a-zA-Z\s]{2,50})/i, // "My name is John Smith"
          /^([a-zA-Z\s]{2,50})(?:\s+\d{10})?$/i, // "John Smith" or "John Smith 9876543210"
          /name:\s*([a-zA-Z\s]{2,50})/i, // "Name: John Smith"
        ];

        for (const pattern of namePatterns) {
          const nameMatch = message.match(pattern);
          if (nameMatch) {
            const extractedName = nameMatch[1].trim();
            if (/^[a-zA-Z\s]+$/.test(extractedName)) {
              context.bookingData.patientName = extractedName;
              console.log(`👤 Extracted name via regex: ${extractedName}`);
              break;
            }
          }
        }
      }

      // Extract patient phone
      if (parsed.patientPhone) {
        context.bookingData.patientPhone = parsed.patientPhone.replace(
          /\D/g,
          ""
        );
        console.log(
          `📞 Set patient phone from parsed:`,
          context.bookingData.patientPhone
        );
      } else if (!context.bookingData.patientPhone) {
        // Try to extract phone using patterns
        const phonePatterns = [
          /\b(\d{10})\b/, // 10 digit number
          /\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/, // Various formats
          /\b(\+91\s?\d{10})\b/, // Indian format
          /phone:\s*(\d{10})/i, // "Phone: 9876543210"
        ];

        for (const pattern of phonePatterns) {
          const phoneMatch = message.match(pattern);
          if (phoneMatch) {
            const extractedPhone = phoneMatch[1].replace(/\D/g, "");
            if (extractedPhone.length === 10) {
              context.bookingData.patientPhone = extractedPhone;
              console.log(`📞 Extracted phone via regex:`, extractedPhone);
              break;
            }
          }
        }
      }

      // Extract patient email
      if (parsed.patientEmail) {
        context.bookingData.patientEmail = parsed.patientEmail;
        console.log(`📧 Set patient email from parsed:`, parsed.patientEmail);
      } else if (!context.bookingData.patientEmail) {
        // Try to extract email using patterns
        const emailPatterns = [
          /\b([^\s@]+@[^\s@]+\.[^\s@]+)\b/i, // Standard email pattern
          /email:\s*([^\s@]+@[^\s@]+\.[^\s@]+)/i, // "Email: john@email.com"
        ];

        for (const pattern of emailPatterns) {
          const emailMatch = message.match(pattern);
          if (emailMatch) {
            const extractedEmail = emailMatch[1].trim();
            context.bookingData.patientEmail = extractedEmail;
            console.log(`📧 Extracted email via regex:`, extractedEmail);
            break;
          }
        }
      }
    }
  }

  if (parsed.patientAge) {
    context.bookingData.patientAge = parseInt(parsed.patientAge);
  }

  // Fallback: Extract age using regex if AI parsing failed
  if (!context.bookingData.patientAge && parsed.originalMessage) {
    // Try multiple age patterns
    const agePatterns = [
      /\b(?:age|years?|yrs?)\s*:?\s*(\d{1,3})\b/i, // "age 54", "years 54", "age: 54"
      /\b(\d{1,3})\s*(?:years?\s*old|yrs?\s*old|y\.?o\.?)\b/i, // "54 years old", "54 yrs old"
      /\bi'?m\s*(\d{1,3})\b/i, // "I'm 54", "im 54"
      /\b(\d{1,3})\s*(?:years?|yrs?)\b/i, // "54 years", "54 yrs"
      /^\s*(\d{1,3})\s*$/, // Just a number like "54"
    ];

    for (const pattern of agePatterns) {
      const ageMatch = parsed.originalMessage.match(pattern);
      if (ageMatch) {
        const extractedAge = parseInt(ageMatch[1]);
        if (extractedAge >= 1 && extractedAge <= 120) {
          context.bookingData.patientAge = extractedAge;
          console.log(`🎂 Extracted age via regex pattern: ${extractedAge}`);
          break;
        }
      }
    }
  }

  console.log(`📋 Current booking data after extraction:`, context.bookingData);

  // CRITICAL VALIDATION: Check if we have all required information (name, phone, email, age)
  const hasName =
    context.bookingData.patientName &&
    context.bookingData.patientName.trim() !== "";
  const hasPhone =
    context.bookingData.patientPhone &&
    context.bookingData.patientPhone.trim() !== "" &&
    context.bookingData.patientPhone.length === 10;
  const hasEmail =
    context.bookingData.patientEmail &&
    context.bookingData.patientEmail.trim() !== "";
  const hasAge =
    context.bookingData.patientAge && context.bookingData.patientAge > 0;

  console.log(
    `✅ Validation - Has name: ${hasName}, Has phone: ${hasPhone}, Has email: ${hasEmail}, Has age: ${hasAge}`
  );

  if (!hasName || !hasPhone || !hasEmail || !hasAge) {
    const missingItems = [];
    if (!hasName) missingItems.push("👤 Your full name");
    if (!hasPhone) missingItems.push("📞 Your 10-digit phone number");
    if (!hasEmail) missingItems.push("📧 Your email address");
    if (!hasAge) missingItems.push("🎂 Your age");

    return {
      message: `I still need:\n\n${missingItems.join(
        "\n"
      )}\n\n💡 Quick tip: You can provide all details like this:\n"John Smith, 9876543210, john@email.com, 30"\n\n⚠️ All fields are required to proceed with booking.`,
      state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
      conversationContext: context,
    };
  }

  console.log(
    `✅ Patient info validation passed - Name: ${context.bookingData.patientName}, Phone: ${context.bookingData.patientPhone}`
  );
  console.log(`🔍 Current state: ${context.state}`);
  console.log(`🔍 Full booking data:`, context.bookingData);

  // SAFETY CHECK: Clean up any null appointment type
  if (
    context.bookingData.appointmentType === null ||
    context.bookingData.appointmentType === "null"
  ) {
    delete context.bookingData.appointmentType;
    console.log(`🧹 Cleaned up null appointmentType`);
  }

  // Validate email format (REQUIRED)
  if (context.bookingData.patientEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(context.bookingData.patientEmail)) {
      return {
        message:
          "Please provide a valid email address (e.g., john@email.com). Email is required for appointment confirmations.",
        state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
        conversationContext: context,
      };
    }
  }

  // Validate age (REQUIRED)
  if (
    context.bookingData.patientAge &&
    (context.bookingData.patientAge < 1 || context.bookingData.patientAge > 120)
  ) {
    return {
      message: "Please provide a valid age between 1 and 120 years.",
      state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
      conversationContext: context,
    };
  }

  // PATIENT VALIDATION: Follow normal booking logic - only exact matches
  const cleanPhone = context.bookingData.patientPhone.replace(/\D/g, "");
  const phonePatient = await prisma.patient.findFirst({
    where: { phone: { contains: cleanPhone } },
  });

  let existingPatient = null;

  // Only consider it an existing patient if BOTH name and phone match exactly
  if (phonePatient) {
    const providedName = context.bookingData.patientName.trim().toLowerCase();
    const existingName = phonePatient.name.trim().toLowerCase();

    if (providedName === existingName) {
      // Exact match - use existing patient
      console.log(`✅ Exact patient match found - using existing data`);
      existingPatient = phonePatient;
      context.bookingData.existingPatient = existingPatient;
      context.bookingData.patientEmail = existingPatient.email;
      context.bookingData.patientAge = existingPatient.age;
    } else {
      // Phone exists but name differs - will create new patient (like normal booking)
      console.log(
        `ℹ️ Phone exists but name differs - will create new patient:`,
        {
          existingName: phonePatient.name,
          providedName: context.bookingData.patientName,
        }
      );
      existingPatient = null;
      context.bookingData.existingPatient = null;

      // For new patients, we need email and age
      const hasEmail =
        context.bookingData.patientEmail &&
        context.bookingData.patientEmail.trim() !== "";
      const hasAge =
        context.bookingData.patientAge && context.bookingData.patientAge > 0;

      if (!hasEmail || !hasAge) {
        const missingItems = [];
        if (!hasEmail) missingItems.push("📧 Your email address");
        if (!hasAge) missingItems.push("🎂 Your age");

        return {
          message: `I need additional information for the new patient record:\n\n${missingItems.join(
            "\n"
          )}\n\n💡 Quick tip: You can provide all details like this:\n"${
            context.bookingData.patientName
          }, ${
            context.bookingData.patientPhone
          }, john@email.com, 30"\n\n📝 Note: I found a different patient with this phone number, so I'll create a new record for you.\n\n⚠️ Email and age are required for new patients.`,
          state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
          conversationContext: context,
        };
      }
    }
  } else {
    // No patient with this phone - definitely new patient
    console.log(`ℹ️ No existing patient found - creating new patient record`);
    existingPatient = null;
    context.bookingData.existingPatient = null;

    // For new patients, we need email and age
    const hasEmail =
      context.bookingData.patientEmail &&
      context.bookingData.patientEmail.trim() !== "";
    const hasAge =
      context.bookingData.patientAge && context.bookingData.patientAge > 0;

    if (!hasEmail || !hasAge) {
      const missingItems = [];
      if (!hasEmail) missingItems.push("📧 Your email address");
      if (!hasAge) missingItems.push("🎂 Your age");

      return {
        message: `Since you're a new patient, I also need:\n\n${missingItems.join(
          "\n"
        )}\n\n💡 Quick tip: You can provide all details like this:\n"${
          context.bookingData.patientName
        }, ${
          context.bookingData.patientPhone
        }, john@email.com, 30"\n\n⚠️ Email and age are required for new patients.`,
        state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
        conversationContext: context,
      };
    }
  }

  // Check if we have doctor selected, if not ask for it
  const hasDoctor =
    context.bookingData.doctorId !== undefined ||
    context.bookingData.doctorName ||
    context.bookingData.doctorPreference;

  console.log(
    `👨‍⚕️ Has doctor: ${hasDoctor} (doctorId: "${context.bookingData.doctorId}", doctorName: "${context.bookingData.doctorName}")`
  );

  if (!hasDoctor) {
    console.log(`❌ Doctor not selected - redirecting to doctor selection`);
    context.state = CONVERSATION_STATES.ASKING_DOCTOR;

    // Load available doctors
    const availableDoctors = await getAvailableDoctors();
    
    if (availableDoctors.length === 0) {
      // No doctors available, skip to appointment type
      console.log("⚠️ No doctors available, skipping doctor selection");
    } else {
      // Show available doctors
      let doctorMessage = `Great! I have your details:\n👤 ${context.bookingData.patientName}\n📞 ${context.bookingData.patientPhone}\n\n👨‍⚕️ Which doctor would you like to see?\n\n`;
      
      availableDoctors.forEach((doctor, index) => {
        const qualification = doctor.qualification ? ` (${doctor.qualification})` : '';
        doctorMessage += `• ${doctor.name}${qualification}\n`;
      });
      
      doctorMessage += `• Any Available Doctor\n`;
      doctorMessage += `\n💡 Tip: Just type the doctor's name or "any"`;

      context.availableDoctors = availableDoctors;

      return {
        message: doctorMessage,
        state: CONVERSATION_STATES.ASKING_DOCTOR,
        availableDoctors: availableDoctors,
        suggestedActions: [...availableDoctors.map(d => d.name), "Any Available Doctor"],
        conversationContext: context,
      };
    }
  }

  // Check if we have appointment type, if not ask for it
  const hasAppointmentType =
    context.bookingData.appointmentType &&
    context.bookingData.appointmentType !== null &&
    context.bookingData.appointmentType !== "null" &&
    context.bookingData.appointmentType.trim() !== "";

  console.log(
    `🏥 Has appointment type: ${hasAppointmentType} (value: "${
      context.bookingData.appointmentType
    }", type: ${typeof context.bookingData.appointmentType})`
  );

  if (!hasAppointmentType) {
    console.log(`❌ Appointment type missing - redirecting to type selection`);
    context.state = CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE;

    // Load appointment types from database and show them immediately
    let availableTypes = [];
    try {
      const settings = await prisma.appointmentSettings.findFirst();
      if (
        settings &&
        settings.appointmentTypes &&
        Array.isArray(settings.appointmentTypes)
      ) {
        availableTypes = settings.appointmentTypes;
        console.log(
          "✅ Loaded appointment types from database:",
          availableTypes
        );
      } else {
        console.error(
          "❌ No appointment types configured in database settings"
        );
        return {
          message:
            "❌ Configuration Error\n\nAppointment types are not configured in the system settings. Please contact the administrator to configure appointment types before booking appointments.",
          state: CONVERSATION_STATES.GREETING,
          conversationContext: {
            ...context,
            state: CONVERSATION_STATES.GREETING,
            bookingData: {},
          },
        };
      }
    } catch (error) {
      console.error("Error loading appointment types:", error);
      return {
        message:
          "❌ System Error\n\nUnable to load appointment types from database. Please try again or contact support.",
        state: CONVERSATION_STATES.GREETING,
        conversationContext: {
          ...context,
          state: CONVERSATION_STATES.GREETING,
          bookingData: {},
        },
      };
    }

    const doctorDisplay = context.bookingData.doctorName || context.bookingData.doctorPreference || "Any Available Doctor";
    // Show appointment types immediately with the question
    let typesMessage = `Great! I have your details:\n👤 ${context.bookingData.patientName}\n📞 ${context.bookingData.patientPhone}\n👨‍⚕️ Doctor: ${doctorDisplay}\n\n🏥 What type of appointment would you like to book?\n\n`;

    // Show all types as selectable options
    availableTypes.forEach((type, index) => {
      typesMessage += `• ${type}\n`;
    });

    typesMessage += `\n💡 Tip: Just type the name (e.g., "consultation") or number (e.g., "1" for first option)`;

    return {
      message: typesMessage,
      state: CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE,
      availableTypes: availableTypes,
      suggestedActions: availableTypes,
      conversationContext: context,
    };
  }

  // We have everything, proceed to confirmation
  context.state = CONVERSATION_STATES.CONFIRMING_BOOKING;

  // Safely get date and time information
  const appointmentDate =
    context.bookingData.selectedSlot?.displayDate ||
    (context.bookingData.selectedDate
      ? formatDate(context.bookingData.selectedDate)
      : "Selected date");
  const appointmentTime =
    context.bookingData.selectedSlot?.time ||
    context.bookingData.selectedTime ||
    context.bookingData.time ||
    "Selected time";
  const doctorDisplay = context.bookingData.doctorName || context.bookingData.doctorPreference || "Any Available Doctor";

  const confirmationMessage = `Perfect! Let me confirm your appointment details:\n\n📅 Date & Time: ${appointmentDate} at ${appointmentTime}\n👤 Patient: ${
    context.bookingData.patientName
  }\n📞 Phone: ${context.bookingData.patientPhone}\n👨‍⚕️ Doctor: ${doctorDisplay}\n🏥 Type: ${
    context.bookingData.appointmentType
  }\n\n${
    existingPatient
      ? "✅ Found your existing patient record."
      : "📝 I'll create a new patient record for you."
  }\n\nShall I confirm this appointment booking?`;

  return {
    message: confirmationMessage,
    state: CONVERSATION_STATES.CONFIRMING_BOOKING,
    bookingData: context.bookingData,
    suggestedActions: ["Yes", "No"],
    conversationContext: context,
  };
};

// Handle booking confirmation
const handleBookingConfirmation = async (parsed, context) => {
  const message = parsed.originalMessage || "";
  console.log(`🔍 Checking confirmation for message: "${message}"`);
  const isConfirming = /yes|confirm|book|ok|sure|proceed/i.test(message);
  const isDenying = /no|cancel|stop|change/i.test(message);

  // If confirming, do one final availability check before proceeding
  if (isConfirming && context.bookingData?.selectedSlot) {
    const { date, time } = context.bookingData.selectedSlot;
    const doctorId = context.bookingData?.doctorId;
    const doctorName = context.bookingData?.doctorName;
    
    console.log(`🔒 Final availability check for ${time} on ${date} (Doctor: ${doctorName || 'Any'})`);
    
    const whereClause = {
      date: {
        equals: new Date(date)
      },
      time: {
        equals: time
      },
      status: {
        notIn: ["Cancelled", "Completed"]
      }
    };
    
    // If specific doctor is selected, check only that doctor's appointments
    if (doctorId) {
      whereClause.doctorId = doctorId;
    }
    
    const existingAppointment = await prisma.appointment.findFirst({
      where: whereClause
    });

    if (existingAppointment) {
      console.log(`❌ Slot was taken during confirmation for ${doctorName || 'this time'}`);
      
      // Get next available slots for this doctor
      const nextSlots = doctorId 
        ? await getAvailableSlotsForDoctor(date, null, doctorId)
        : await getAvailableSlots(date);
      
      const message = doctorId
        ? `I apologize, but someone just booked that time slot with ${doctorName} while we were talking. Here are the next available times:\n\n${
            nextSlots.slice(0, 3).map(slot => `• ${slot.time} on ${slot.displayDate}`).join('\n')
          }\n\nWould you like any of these times instead?`
        : `I apologize, but someone just booked that time slot while we were talking. Here are the next available times:\n\n${
            nextSlots.slice(0, 3).map(slot => `• ${slot.time} on ${slot.displayDate}`).join('\n')
          }\n\nWould you like any of these times instead?`;
      
      return {
        message: message,
        conversationContext: {
          ...context,
          state: CONVERSATION_STATES.SHOWING_SLOTS,
          availableSlots: nextSlots
        }
      };
    }
  }

  console.log(`✅ Is confirming: ${isConfirming}, Is denying: ${isDenying}`);

  if (isDenying) {
    context.state = CONVERSATION_STATES.ASKING_DOCTOR;
    return {
      message:
        "No problem! Let's start over. Which doctor would you like to see?",
      state: CONVERSATION_STATES.ASKING_DOCTOR,
      suggestedActions: ["Any Available Doctor"],
      conversationContext: {
        ...context,
        state: CONVERSATION_STATES.ASKING_DOCTOR,
        bookingData: {},
      },
    };
  }

  if (isConfirming) {
    // CRITICAL: Validate required patient information before booking
    const bookingData = context.bookingData || {};
    console.log(`🔍 Final validation before booking:`, bookingData);

    const missingInfo = [];

    // Strict validation - check for actual values, not just existence
    if (
      !bookingData.patientName ||
      bookingData.patientName.trim() === "" ||
      bookingData.patientName === "null"
    ) {
      missingInfo.push("patient name");
    }
    if (
      !bookingData.patientPhone ||
      bookingData.patientPhone.trim() === "" ||
      bookingData.patientPhone === "null"
    ) {
      missingInfo.push("phone number");
    }
    if (
      !bookingData.patientEmail ||
      bookingData.patientEmail.trim() === "" ||
      bookingData.patientEmail === "null"
    ) {
      missingInfo.push("email address");
    }
    if (!bookingData.patientAge || bookingData.patientAge <= 0) {
      missingInfo.push("age");
    }
    if (!bookingData.selectedDate && !bookingData.selectedSlot?.date) {
      missingInfo.push("appointment date");
    }
    if (!bookingData.selectedTime && !bookingData.selectedSlot?.time) {
      missingInfo.push("appointment time");
    }
    if (
      !bookingData.appointmentType ||
      bookingData.appointmentType.trim() === "" ||
      bookingData.appointmentType === "null"
    ) {
      missingInfo.push("appointment type");
    }

    if (missingInfo.length > 0) {
      // Missing critical information - cannot proceed with booking
      console.log(`❌ BOOKING BLOCKED - Missing info:`, missingInfo);
      console.log(`❌ Current booking data:`, bookingData);

      // Smart redirection based on what's missing
      if (
        missingInfo.includes("appointment type") &&
        !missingInfo.includes("patient name") &&
        !missingInfo.includes("phone number")
      ) {
        // Only appointment type is missing - redirect to type selection
        return {
          message: `❌ Cannot proceed with booking!\n\nI need to know what type of appointment this is.\n\n🏥 What type of appointment would you like?`,
          state: CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE,
          readyToBook: false,
          conversationContext: {
            ...context,
            state: CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE,
          },
        };
      } else if (
        missingInfo.includes("patient name") ||
        missingInfo.includes("phone number")
      ) {
        // Patient info is missing - redirect to patient info collection
        return {
          message: `❌ Cannot proceed with booking!\n\nI'm missing critical information:\n\n${missingInfo
            .map((info) => `• ${info}`)
            .join(
              "\n"
            )}\n\n🔄 Let's collect this information properly.\n\nPlease provide your full name and phone number like this:\n"John Smith, 9876543210"`,
          state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
          readyToBook: false,
          conversationContext: {
            ...context,
            state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
          },
        };
      } else {
        // Other info missing - general error
        return {
          message: `❌ Cannot proceed with booking!\n\nI'm missing critical information:\n\n${missingInfo
            .map((info) => `• ${info}`)
            .join(
              "\n"
            )}\n\n🔄 Let's start over to collect all required information.`,
          state: CONVERSATION_STATES.GREETING,
          readyToBook: false,
          conversationContext: {
            ...context,
            state: CONVERSATION_STATES.GREETING,
            bookingData: {},
          },
        };
      }
    }

    // DOUBLE CHECK: Ensure we actually have the required information
    console.log(`✅ BOOKING VALIDATION PASSED - Patient info:`, {
      name: bookingData.patientName,
      phone: bookingData.patientPhone,
      date: bookingData.selectedDate || bookingData.selectedSlot?.date,
      time: bookingData.selectedTime || bookingData.selectedSlot?.time,
    });

    // All required information present - proceed with booking
    return {
      message: "Perfect! I'm booking your appointment now...",
      state: CONVERSATION_STATES.COMPLETED,
      readyToBook: true,
      bookingData: {
        ...context.bookingData,
        // Ensure date/time are properly set
        selectedDate:
          bookingData.selectedDate || bookingData.selectedSlot?.date,
        selectedTime:
          bookingData.selectedTime || bookingData.selectedSlot?.time,
      },
      conversationContext: {
        ...context,
        state: CONVERSATION_STATES.COMPLETED,
      },
    };
  }

  return {
    message:
      "Please confirm if you'd like me to book this appointment by saying 'Yes' or 'Confirm'. If you'd like to make changes, say 'No' or 'Change'.",
    state: CONVERSATION_STATES.CONFIRMING_BOOKING,
    suggestedActions: ["Yes", "No"],
    conversationContext: context,
  };
};

module.exports = {
  processAppointmentChat,
  getAvailableSlots,
  getAvailableSlotsForDoctor,
  getAvailableDoctors,
  getDoctorsAvailableAtSlot,
  findPatient,
  parseUserInput,
  normalizeTimeFormat,
  CONVERSATION_STATES,
};
