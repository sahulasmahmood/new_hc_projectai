const {
  processAppointmentChat,
  CONVERSATION_STATES,
} = require("../../utils/appointmentChatService");
const { PrismaClient } = require("../../generated/prisma");
// TODO: Enable email notifications in future
// const { inngest } = require('../../inngest/client');

const prisma = new PrismaClient();

// Store conversation in memory (in production, use Redis or database)
const conversations = new Map();

// Perform the actual appointment booking
const performBooking = async (bookingData, conversationId) => {
  try {
    const { patientName, patientPhone, selectedSlot, existingPatient } =
      bookingData;

    let patient = existingPatient;

    // Create patient if doesn't exist
    if (!patient) {
      const patientCount = await prisma.patient.count();
      patient = await prisma.patient.create({
        data: {
          name: patientName,
          age: 25, // Default age for AI bookings (can be updated later)
          gender: "Not Specified",
          phone: patientPhone,
          email: null,
          condition: "General Consultation",
          allergies: [],
          emergencyContact: null,
          emergencyPhone: null,
          address: null,
          abhaId: null,
          visibleId: `P${(patientCount + 1).toString().padStart(4, "0")}`,
          status: "Active",
          createdFromEmergency: false,
        },
      });
    }

    // Parse date and time
    const [year, month, day] = selectedSlot.date.split("-").map(Number);
    const appointmentDate = new Date(year, month - 1, day);

    const [timePart, period] = selectedSlot.time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    appointmentDate.setHours(hours, minutes, 0, 0);

    // Double-check slot availability
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: appointmentDate,
        time: selectedSlot.time,
        status: { not: "Cancelled" },
      },
    });

    if (existingAppointment) {
      return {
        success: false,
        error:
          "This time slot is no longer available. Please select a different time.",
      };
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientName: patient.name,
        patientPhone: patientPhone,
        patientVisibleId: patient.visibleId,
        date: appointmentDate,
        time: selectedSlot.time,
        type: "General Consultation",
        duration: "30",
        notes: "Booked via AI Chat Assistant",
        status: "Confirmed",
        patientId: patient.id,
      },
    });

    // TODO: Enable email notifications in future
    console.log(
      `📧 Email notification would be sent to: ${
        patient.email || "No email provided"
      }`
    );
    console.log(`✅ Appointment booked successfully via AI Assistant`);

    return {
      success: true,
      appointment: appointment,
      patient: patient,
    };
  } catch (error) {
    console.error("Error in performBooking:", error);
    return {
      success: false,
      error: error.message || "Failed to book appointment",
    };
  }
};

// Process appointment chat message
const handleAppointmentChat = async (req, res) => {
  try {
    const { message, conversationId = "default", userId = null } = req.body;

    // Validate input
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        error: "Message is required and must be a non-empty string",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        error: "Message is too long. Please keep it under 1000 characters.",
      });
    }

    // Get conversation context
    let conversationContext = conversations.get(conversationId) || {
      state: CONVERSATION_STATES.GREETING,
      bookingData: {},
      availableSlots: [],
      messages: [],
    };

    // Add user message to history
    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    conversationContext.messages.push(userMessage);

    // Process the message with conversation context
    const response = await processAppointmentChat(
      message.trim(),
      conversationContext,
      userId
    );

    // Handle automatic booking if ready
    if (response.readyToBook && response.bookingData) {
      try {
        const bookingResult = await performBooking(
          response.bookingData,
          conversationId
        );
        if (bookingResult.success) {
          response.message = `✅ **Appointment Booked Successfully!**\n\n📅 **Details:**\n• Date: ${bookingResult.appointment.date.toLocaleDateString(
            "en-US",
            { weekday: "long", month: "long", day: "numeric", year: "numeric" }
          )}\n• Time: ${bookingResult.appointment.time}\n• Patient: ${
            bookingResult.patient.name
          }\n• Phone: ${bookingResult.patient.phone}\n• Type: ${
            bookingResult.appointment.type
          }\n\n📱 You'll receive confirmation messages shortly.\n\nIs there anything else I can help you with?`;
          response.state = CONVERSATION_STATES.COMPLETED;
          response.appointmentBooked = true;
          response.appointmentDetails = bookingResult.appointment;
        } else {
          response.message = `❌ Sorry, there was an issue booking your appointment: ${bookingResult.error}\n\nWould you like to try a different time slot?`;
          response.state = CONVERSATION_STATES.SHOWING_SLOTS;
        }
      } catch (bookingError) {
        console.error("Booking error:", bookingError);
        response.message = `❌ Sorry, there was an issue booking your appointment. Please try again or contact our staff directly.`;
        response.state = CONVERSATION_STATES.GREETING;
      }
    }

    // Update conversation context
    if (response.conversationContext) {
      conversationContext = response.conversationContext;
    }

    // Create AI response message
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      type: "ai",
      content: response.message,
      timestamp: new Date().toISOString(),
      state: response.state,
      availableSlots: response.availableSlots || [],
      suggestedActions: response.suggestedActions || [],
      urgency: response.urgency || "low",
      bookingData: response.bookingData,
      appointmentBooked: response.appointmentBooked || false,
      appointmentDetails: response.appointmentDetails,
    };

    // Add AI response to history
    conversationContext.messages.push(aiMessage);

    // Store updated conversation (limit to last 20 messages)
    conversationContext.messages = conversationContext.messages.slice(-20);
    conversations.set(conversationId, conversationContext);

    // Return response
    res.json({
      success: true,
      response: aiMessage,
      conversationId: conversationId,
      conversationState: response.state,
    });
  } catch (error) {
    console.error("Error in appointment chat:", error);

    res.status(500).json({
      error: error.message || "An error occurred while processing your message",
    });
  }
};

// Book appointment from chat (legacy function - now handled by conversational flow)
const bookAppointmentFromChat = async (req, res) => {
  try {
    const {
      patientPhone,
      patientName,
      date,
      time,
      type = "General Consultation",
      duration = "30",
      conversationId = "default",
    } = req.body;

    // Validate required fields
    if (!patientPhone || !date || !time) {
      return res.status(400).json({
        error: "Patient phone, date, and time are required",
      });
    }

    // Find or create patient
    let patient = await prisma.patient.findFirst({
      where: { phone: patientPhone },
    });

    if (!patient) {
      if (!patientName) {
        return res.status(400).json({
          error: "Patient name is required for new patients",
        });
      }

      // Create new patient
      const patientCount = await prisma.patient.count();
      patient = await prisma.patient.create({
        data: {
          name: patientName,
          age: 25, // Default age for AI bookings (can be updated later)
          gender: "Not Specified",
          phone: patientPhone,
          email: null,
          condition: "General Consultation",
          allergies: [],
          emergencyContact: null,
          emergencyPhone: null,
          address: null,
          abhaId: null,
          visibleId: `P${(patientCount + 1).toString().padStart(4, "0")}`,
          status: "Active",
          createdFromEmergency: false,
        },
      });
    }

    // Parse date
    const [year, month, day] = date.split("-").map(Number);
    const appointmentDate = new Date(year, month - 1, day);

    // Parse time
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    appointmentDate.setHours(hours, minutes, 0, 0);

    // Check if slot is still available
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: appointmentDate,
        time: time,
        status: { not: "Cancelled" },
      },
    });

    if (existingAppointment) {
      return res.status(409).json({
        error:
          "This time slot is no longer available. Please select a different time.",
      });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientName: patient.name,
        patientPhone: patientPhone,
        patientVisibleId: patient.visibleId,
        date: appointmentDate,
        time,
        type,
        duration,
        notes: "Booked via AI Chat Assistant",
        status: "Confirmed",
        patientId: patient.id,
      },
    });

    // TODO: Enable email notifications in future
    console.log(
      `📧 Email notification would be sent to: ${
        patient.email || "No email provided"
      }`
    );
    console.log(`✅ Appointment booked successfully via AI Assistant`);

    // Update conversation with booking confirmation
    const conversationHistory = conversations.get(conversationId) || [];
    const confirmationMessage = {
      id: Date.now().toString(),
      type: "ai",
      content: `✅ Great! Your appointment has been successfully booked.\n\n📅 **Appointment Details:**\n• Date: ${appointmentDate.toLocaleDateString(
        "en-US",
        { weekday: "long", month: "long", day: "numeric", year: "numeric" }
      )}\n• Time: ${time}\n• Type: ${type}\n• Patient: ${
        patient.name
      }\n• Phone: ${patientPhone}\n\n📱 You'll receive a confirmation message shortly. Is there anything else I can help you with?`,
      timestamp: new Date().toISOString(),
      state: "booking_confirmed",
      appointmentId: appointment.id,
    };

    conversationHistory.push(confirmationMessage);
    conversations.set(conversationId, conversationHistory.slice(-20));

    res.json({
      success: true,
      appointment: appointment,
      patient: patient,
      message: "Appointment booked successfully!",
    });
  } catch (error) {
    console.error("Error booking appointment from chat:", error);
    res.status(500).json({
      error: "Failed to book appointment. Please try again.",
    });
  }
};

// Get conversation history
const getConversationHistory = async (req, res) => {
  try {
    const { conversationId = "default" } = req.params;
    const history = conversations.get(conversationId) || [];

    res.json({
      success: true,
      conversationId: conversationId,
      messages: history,
    });
  } catch (error) {
    console.error("Error getting conversation history:", error);
    res.status(500).json({
      error: "Failed to get conversation history",
    });
  }
};

// Clear conversation history
const clearConversation = async (req, res) => {
  try {
    const { conversationId = "default" } = req.params;
    conversations.delete(conversationId);

    res.json({
      success: true,
      message: "Conversation cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing conversation:", error);
    res.status(500).json({
      error: "Failed to clear conversation",
    });
  }
};

module.exports = {
  handleAppointmentChat,
  bookAppointmentFromChat,
  getConversationHistory,
  clearConversation,
};
