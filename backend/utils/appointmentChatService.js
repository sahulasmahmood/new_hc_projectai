const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const { PrismaClient } = require("../generated/prisma");

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
  ASKING_APPOINTMENT_TYPE: "asking_appointment_type",
  COLLECTING_PATIENT_INFO: "collecting_patient_info",
  CONFIRMING_BOOKING: "confirming_booking",
  COMPLETED: "completed",
};

// Parse user input for date/time information
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
          content: `You are a date/time parser for appointment booking. Extract date and time information from user messages.

Current conversation state: ${currentState}
Today's date: ${todayStr}
Tomorrow's date: ${tomorrowStr}

Respond with ONLY a JSON object:
{
  "intent": "book_appointment|check_availability|provide_date|provide_time|provide_patient_info|general",
  "extractedDate": "YYYY-MM-DD format or null",
  "extractedTime": "HH:MM AM/PM format or null",
  "datePreference": "today|tomorrow|next_week|specific_date|null",
  "timePreference": "morning|afternoon|evening|specific_time|null",
  "patientName": "extracted name or null",
  "patientPhone": "extracted phone or null",
  "patientEmail": "extracted email or null",
  "patientAge": "extracted age as number or null",
  "isEmergency": true/false
}

Examples:
"I want to book appointment" → {"intent": "book_appointment", "extractedDate": null, ...}
"Tomorrow morning" → {"intent": "provide_date", "extractedDate": "${tomorrowStr}", "timePreference": "morning", ...}
"2 PM today" → {"intent": "provide_time", "extractedDate": "${todayStr}", "extractedTime": "2:00 PM", ...}
"My name is John, phone 9876543210" → {"intent": "provide_patient_info", "patientName": "John", "patientPhone": "9876543210", ...}
"john@email.com and I'm 25 years old" → {"intent": "provide_patient_info", "patientEmail": "john@email.com", "patientAge": 25, ...}
"I am 54 years old" → {"intent": "provide_patient_info", "patientAge": 54, ...}
"age 30" → {"intent": "provide_patient_info", "patientAge": 30, ...}
"54" → {"intent": "provide_patient_info", "patientAge": 54, ...}`,
        },
        {
          role: "user",
          content: `Parse this message: "${message}"`,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    return JSON.parse(response);
  } catch (error) {
    console.error("Input parsing failed:", error);
    return {
      intent: "general",
      extractedDate: null,
      extractedTime: null,
      datePreference: null,
      timePreference: null,
      patientName: null,
      patientPhone: null,
      patientEmail: null,
      patientAge: null,
      isEmergency: false,
    };
  }
};

// Get available appointment slots (prevents past bookings)
const getAvailableSlots = async (targetDate = null, timePreference = null) => {
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
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (startDate < today) {
        return []; // Return empty for past dates only
      }
    } else {
      startDate = new Date(); // Today
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (targetDate ? 0 : 7)); // Single day if specific date, 7 days if general

    // Get existing appointments
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: "Cancelled" },
      },
      select: { date: true, time: true, duration: true },
    });

    const availableSlots = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const isToday = currentDate.toDateString() === now.toDateString();
      const daySlots = generateDaySlots(
        currentDate,
        existingAppointments,
        settings,
        isToday,
        currentTime,
        timePreference
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

// Generate time slots for a specific day using appointment settings
const generateDaySlots = (
  date,
  existingAppointments,
  settings,
  isToday = false,
  currentTime = 0,
  timePreference = null
) => {
  const slots = [];

  if (!settings || !settings.timeSlots) {
    console.error("No appointment settings or time slots found");
    return slots;
  }

  // Parse time slots from settings
  let timeSlots = settings.timeSlots;
  if (typeof timeSlots === "string") {
    try {
      timeSlots = JSON.parse(timeSlots);
    } catch (error) {
      console.error("Error parsing time slots:", error);
      return slots;
    }
  }

  // Filter active time slots
  const activeTimeSlots = timeSlots.filter((slot) => slot.isActive);

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

    // Check if slot is available (not booked)
    const isBooked = existingAppointments.some((apt) => {
      const aptDate = new Date(apt.date);
      return (
        aptDate.toDateString() === date.toDateString() && apt.time === slotTime
      );
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
      });
    }
  });

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

    // Handle conversation flow based on current state and user input
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

// Handle greeting and initial appointment request
const handleGreeting = async (parsed, context) => {
  if (parsed.intent === "book_appointment" || parsed.isEmergency) {
    if (parsed.isEmergency) {
      return {
        message:
          "🚨 I understand this is urgent. For emergency situations, please call our emergency line immediately or visit the nearest emergency room.\n\nIf this is not a life-threatening emergency, I can help you book an urgent appointment. Would you like me to check for the earliest available slot?",
        state: CONVERSATION_STATES.ASKING_DATE,
        urgency: "emergency",
        suggestedActions: ["emergency_booking", "contact_emergency"],
        conversationContext: {
          ...context,
          state: CONVERSATION_STATES.ASKING_DATE,
          bookingData: { isEmergency: true },
        },
      };
    }

    context.state = CONVERSATION_STATES.ASKING_DATE;
    return {
      message:
        'Hello! I\'d be happy to help you book an appointment. 😊\n\nWhen would you like to schedule your appointment?\n\n📅 You can say:\n• "Today" (if available)\n• "Tomorrow"\n• "Next week"\n• Or a specific date like "January 31st"',
      state: CONVERSATION_STATES.ASKING_DATE,
      suggestedActions: ["today", "tomorrow", "next_week"],
      conversationContext: {
        ...context,
        state: CONVERSATION_STATES.ASKING_DATE,
      },
    };
  }

  return {
    message:
      "Hello! I'm your AI appointment assistant. 👋\n\nI can help you:\n📅 **Book new appointments**\n🔄 **Reschedule existing appointments**\n❌ **Cancel appointments**\n📋 **Check available slots**\n\nWhat would you like to do today?",
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
      suggestedActions: ["today", "tomorrow", "next_week"],
      conversationContext: context,
    };
  }

  // Get available slots
  const availableSlots = await getAvailableSlots(
    targetDate,
    parsed.timePreference
  );

  if (availableSlots.length === 0) {
    if (targetDate) {
      const date = new Date(targetDate);
      const isPast = date < new Date();
      if (isPast) {
        return {
          message:
            "I can't book appointments for past dates. 📅\n\nLet me show you available slots for today and upcoming days. When would you prefer your appointment?",
          state: CONVERSATION_STATES.ASKING_DATE,
          suggestedActions: ["today", "tomorrow", "next_week"],
          conversationContext: context,
        };
      }
    }

    return {
      message: `Unfortunately, there are no available slots for ${dateMessage}. 😔\n\nWould you like me to check other dates? I can show you the next available appointments.`,
      state: CONVERSATION_STATES.ASKING_DATE,
      suggestedActions: ["check_other_dates", "next_available"],
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

  let slotsMessage = `Great! I found ${availableSlots.length} available slots for ${dateMessage}:\n\n`;

  if (morningSlots.length > 0) {
    slotsMessage += `🌅 **Morning slots:**\n`;
    morningSlots.slice(0, 3).forEach((slot) => {
      slotsMessage += `• ${slot.time} on ${slot.displayDate}\n`;
    });
    slotsMessage += "\n";
  }

  if (afternoonSlots.length > 0) {
    slotsMessage += `☀️ **Afternoon slots:**\n`;
    afternoonSlots.slice(0, 3).forEach((slot) => {
      slotsMessage += `• ${slot.time} on ${slot.displayDate}\n`;
    });
  }

  slotsMessage +=
    '\nWhich time works best for you? You can tell me the exact time or say "morning" or "afternoon".';

  context.state = CONVERSATION_STATES.SHOWING_SLOTS;
  context.availableSlots = availableSlots;
  context.bookingData = { ...context.bookingData, targetDate, dateMessage };

  return {
    message: slotsMessage,
    state: CONVERSATION_STATES.SHOWING_SLOTS,
    availableSlots: availableSlots.slice(0, 6),
    suggestedActions: ["select_time", "show_more_slots"],
    conversationContext: context,
  };
};

// Handle slot/time selection
const handleSlotSelection = async (parsed, context) => {
  if (parsed.extractedTime) {
    // User specified exact time
    const requestedTime = parsed.extractedTime;
    const matchingSlot = context.availableSlots.find(
      (slot) => slot.time === requestedTime
    );

    if (matchingSlot) {
      context.state = CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE;
      context.bookingData = {
        ...context.bookingData,
        selectedSlot: matchingSlot,
        date: matchingSlot.date,
        time: matchingSlot.time,
      };

      return {
        message: `Perfect! I'll book you for ${matchingSlot.time} on ${matchingSlot.displayDate}. ✅\n\nWhat type of appointment would you like to book?`,
        state: CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE,
        selectedSlot: matchingSlot,
        suggestedActions: ["select_appointment_type"],
        conversationContext: context,
      };
    } else {
      return {
        message: `I'm sorry, ${requestedTime} is not available. Here are the available times:\n\n${context.availableSlots
          .slice(0, 5)
          .map((slot) => `• ${slot.time} on ${slot.displayDate}`)
          .join("\n")}\n\nWhich of these works for you?`,
        state: CONVERSATION_STATES.SHOWING_SLOTS,
        availableSlots: context.availableSlots.slice(0, 5),
        conversationContext: context,
      };
    }
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
          .slice(0, 5)
          .map((slot) => `• ${slot.time} on ${slot.displayDate}`)
          .join("\n")}\n\nWould any of these work for you?`,
        state: CONVERSATION_STATES.SHOWING_SLOTS,
        availableSlots: context.availableSlots.slice(0, 5),
        conversationContext: context,
      };
    }

    return {
      message: `Here are the available ${
        parsed.timePreference
      } slots:\n\n${filteredSlots
        .slice(0, 5)
        .map((slot) => `• ${slot.time} on ${slot.displayDate}`)
        .join("\n")}\n\nWhich specific time would you prefer?`,
      state: CONVERSATION_STATES.SHOWING_SLOTS,
      availableSlots: filteredSlots.slice(0, 5),
      conversationContext: context,
    };
  }

  return {
    message:
      'Please let me know which time you\'d prefer. You can:\n\n⏰ **Say the exact time** (e.g., "2:00 PM")\n🕐 **Choose time period** (e.g., "morning" or "afternoon")\n\nWhich works best for you?',
    state: CONVERSATION_STATES.SHOWING_SLOTS,
    availableSlots: context.availableSlots.slice(0, 5),
    conversationContext: context,
  };
};

// Handle time selection (if needed)
const handleTimeSelection = async (parsed, context) => {
  // This is handled in handleSlotSelection
  return handleSlotSelection(parsed, context);
};

// Handle appointment type selection
const handleAppointmentTypeSelection = async (parsed, context) => {
  try {
    // Get appointment settings to fetch available appointment types
    const settings = await prisma.appointmentSettings.findFirst();
    if (
      !settings ||
      !settings.appointmentTypes ||
      settings.appointmentTypes.length === 0
    ) {
      // Fallback to default type if no settings found
      context.bookingData.appointmentType = "General Consultation";
      context.state = CONVERSATION_STATES.COLLECTING_PATIENT_INFO;

      return {
        message: `I'll book this as a General Consultation appointment.\n\nNow I need some information to complete your booking:\n\n👤 **Patient Name:** What's your full name?\n📞 **Phone Number:** What's your contact number?\n📧 **Email Address:** What's your email address?\n🎂 **Age:** How old are you?`,
        state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
        suggestedActions: ["provide_info"],
        conversationContext: context,
      };
    }

    const availableTypes = settings.appointmentTypes;
    const userMessage = parsed.originalMessage.toLowerCase();

    // Try to match user input with available appointment types
    let selectedType = null;
    for (const type of availableTypes) {
      if (
        userMessage.includes(type.toLowerCase()) ||
        type.toLowerCase().includes(userMessage.trim())
      ) {
        selectedType = type;
        break;
      }
    }

    // Check for common variations and mappings
    const typeMapping = {
      consultation: "Consultation",
      checkup: "Routine Checkup",
      followup: "Follow-up",
      "follow up": "Follow-up",
      emergency: "Emergency",
      routine: "Routine Checkup",
      specialist: "Specialist Visit",
      lab: "Lab Test",
      test: "Lab Test",
      vaccination: "Vaccination",
      vaccine: "Vaccination",
    };

    if (!selectedType) {
      for (const [key, value] of Object.entries(typeMapping)) {
        if (userMessage.includes(key) && availableTypes.includes(value)) {
          selectedType = value;
          break;
        }
      }
    }

    if (selectedType) {
      // Valid appointment type selected
      context.bookingData.appointmentType = selectedType;
      context.state = CONVERSATION_STATES.COLLECTING_PATIENT_INFO;

      return {
        message: `Great! I'll book this as a ${selectedType} appointment.\n\nNow I need some information to complete your booking:\n\n👤 **Patient Name:** What's your full name?\n📞 **Phone Number:** What's your contact number?\n📧 **Email Address:** What's your email address?\n🎂 **Age:** How old are you?`,
        state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
        suggestedActions: ["provide_info"],
        conversationContext: context,
      };
    } else {
      // Show available appointment types
      const typesMessage = `Please select from the following appointment types:\n\n${availableTypes
        .map((type, index) => `${index + 1}. **${type}**`)
        .join(
          "\n"
        )}\n\nYou can say the name or number of the appointment type you'd like.`;

      return {
        message: typesMessage,
        state: CONVERSATION_STATES.ASKING_APPOINTMENT_TYPE,
        availableTypes: availableTypes,
        suggestedActions: availableTypes.slice(0, 3),
        conversationContext: context,
      };
    }
  } catch (error) {
    console.error("Error handling appointment type selection:", error);
    // Fallback to default type
    context.bookingData.appointmentType = "General Consultation";
    context.state = CONVERSATION_STATES.COLLECTING_PATIENT_INFO;

    return {
      message: `I'll book this as a General Consultation appointment.\n\nNow I need some information to complete your booking:\n\n👤 **Patient Name:** What's your full name?\n📞 **Phone Number:** What's your contact number?\n📧 **Email Address:** What's your email address?\n🎂 **Age:** How old are you?`,
      state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
      suggestedActions: ["provide_info"],
      conversationContext: context,
    };
  }
};

// Handle patient information collection
const handlePatientInfo = async (parsed, context) => {
  if (!context.bookingData) context.bookingData = {};

  // Extract patient info
  if (parsed.patientName) {
    context.bookingData.patientName = parsed.patientName;
  }
  if (parsed.patientPhone) {
    context.bookingData.patientPhone = parsed.patientPhone.replace(/\D/g, "");
  }
  if (parsed.patientEmail) {
    context.bookingData.patientEmail = parsed.patientEmail;
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

  console.log(`📋 Current booking data:`, context.bookingData);

  // Check if we have all required information
  const requiredFields = [
    { field: "patientName", label: "👤 **Your full name**" },
    { field: "patientPhone", label: "📞 **Your phone number**" },
    { field: "patientEmail", label: "📧 **Your email address**" },
    { field: "patientAge", label: "🎂 **Your age**" },
  ];

  const missingInfo = requiredFields.filter(
    (req) => !context.bookingData[req.field]
  );

  if (missingInfo.length > 0) {
    return {
      message: `I still need:\n\n${missingInfo
        .map((info) => info.label)
        .join(
          "\n"
        )}\n\nPlease provide this information so I can complete your booking.`,
      state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
      conversationContext: context,
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(context.bookingData.patientEmail)) {
    return {
      message:
        "Please provide a valid email address (e.g., john@example.com) so I can send you appointment confirmations.",
      state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
      conversationContext: context,
    };
  }

  // Validate age
  if (
    context.bookingData.patientAge < 1 ||
    context.bookingData.patientAge > 120
  ) {
    return {
      message: "Please provide a valid age between 1 and 120 years.",
      state: CONVERSATION_STATES.COLLECTING_PATIENT_INFO,
      conversationContext: context,
    };
  }

  // Check if patient exists
  const existingPatient = await findPatient(
    context.bookingData.patientPhone,
    context.bookingData.patientName
  );

  context.state = CONVERSATION_STATES.CONFIRMING_BOOKING;
  context.bookingData.existingPatient = existingPatient;

  const confirmationMessage = `Perfect! Let me confirm your appointment details:\n\n📅 **Date & Time:** ${
    context.bookingData.selectedSlot.displayDate
  } at ${context.bookingData.selectedSlot.time}\n👤 **Patient:** ${
    context.bookingData.patientName
  }\n📞 **Phone:** ${context.bookingData.patientPhone}\n📧 **Email:** ${
    context.bookingData.patientEmail
  }\n🎂 **Age:** ${context.bookingData.patientAge} years\n🏥 **Type:** ${
    context.bookingData.appointmentType || "General Consultation"
  }\n\n${
    existingPatient
      ? "✅ Found your existing patient record."
      : "📝 I'll create a new patient record for you."
  }\n\nShall I confirm this appointment booking?`;

  return {
    message: confirmationMessage,
    state: CONVERSATION_STATES.CONFIRMING_BOOKING,
    bookingData: context.bookingData,
    suggestedActions: ["confirm_booking", "modify_details"],
    conversationContext: context,
  };
};

// Handle booking confirmation
const handleBookingConfirmation = async (parsed, context) => {
  const message = parsed.originalMessage || "";
  console.log(`🔍 Checking confirmation for message: "${message}"`);
  const isConfirming = /yes|confirm|book|ok|sure|proceed/i.test(message);
  const isDenying = /no|cancel|stop|change/i.test(message);

  console.log(`✅ Is confirming: ${isConfirming}, Is denying: ${isDenying}`);

  if (isDenying) {
    context.state = CONVERSATION_STATES.ASKING_DATE;
    return {
      message:
        "No problem! Let's start over. When would you like to schedule your appointment?",
      state: CONVERSATION_STATES.ASKING_DATE,
      suggestedActions: ["today", "tomorrow", "next_week"],
      conversationContext: {
        ...context,
        state: CONVERSATION_STATES.ASKING_DATE,
        bookingData: {},
      },
    };
  }

  if (isConfirming) {
    // Proceed with booking - this will be handled by the controller
    return {
      message: "Great! I'm processing your appointment booking now...",
      state: CONVERSATION_STATES.CONFIRMING_BOOKING,
      readyToBook: true,
      bookingData: context.bookingData,
      conversationContext: context,
    };
  }

  return {
    message:
      "Please confirm if you'd like me to book this appointment by saying 'Yes' or 'Confirm'. If you'd like to make changes, say 'No' or 'Change'.",
    state: CONVERSATION_STATES.CONFIRMING_BOOKING,
    suggestedActions: ["confirm_booking", "modify_details"],
    conversationContext: context,
  };
};

module.exports = {
  processAppointmentChat,
  getAvailableSlots,
  findPatient,
  parseUserInput,
  CONVERSATION_STATES,
};
