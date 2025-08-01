const {
  processSimpleChat,
  getConversationHistory,
  CONVERSATION_STATES,
} = require("../../utils/simpleChatService");
const { PrismaClient } = require("../../generated/prisma");
const { getPatientIdPrefix } = require("../../utils/patientIdGenerator");
// TODO: Enable email notifications in future
// const { inngest } = require('../../inngest/client');

const prisma = new PrismaClient();



// Perform the actual appointment booking
const performBooking = async (bookingData, conversationId) => {
  try {
    const {
      patientName,
      patientPhone,
      patientEmail,
      patientAge,
      selectedSlot,
      existingPatient,
    } = bookingData;

    let patient = existingPatient;

    // Create patient if doesn't exist
    if (!patient) {
      // Generate visibleId using the same logic as regular patient creation
      let prefix;
      try {
        prefix = await getPatientIdPrefix();
      } catch (error) {
        return {
          success: false,
          error: `Unable to create patient: ${error.message}`,
        };
      }
      let letter = null;
      let number = 1;

      // Find the highest existing visibleId with this prefix
      const lastPatient = await prisma.patient.findFirst({
        where: {
          visibleId: {
            startsWith: prefix,
          },
        },
        orderBy: {
          visibleId: "desc",
        },
      });

      if (lastPatient && lastPatient.visibleId) {
        // Match APL-00001 to APL-99999
        let match = lastPatient.visibleId.match(/^([A-Z]{3})-(\d{5})$/);
        if (match) {
          prefix = match[1];
          number = parseInt(match[2], 10) + 1;
          if (number > 99999) {
            number = 1;
            letter = "A";
          }
        } else {
          // Match APL-X-00001 to APL-Z-99999
          match = lastPatient.visibleId.match(/^([A-Z]{3})-([A-Z])-(\d{5})$/);
          if (match) {
            prefix = match[1];
            letter = match[2];
            number = parseInt(match[3], 10) + 1;
            if (number > 99999) {
              number = 1;
              // Increment letter
              if (letter === "Z") {
                // If letter exceeds Z, increment the last letter of prefix
                let prefixArr = prefix.split("");
                let i = 2;
                while (i >= 0) {
                  if (prefixArr[i] !== "Z") {
                    prefixArr[i] = String.fromCharCode(
                      prefixArr[i].charCodeAt(0) + 1
                    );
                    break;
                  } else {
                    prefixArr[i] = "A";
                    i--;
                  }
                }
                prefix = prefixArr.join("");
                letter = "A";
              } else {
                letter = String.fromCharCode(letter.charCodeAt(0) + 1);
              }
            }
          }
        }
      }

      let visibleId = letter
        ? `${prefix}-${letter}-${String(number).padStart(5, "0")}`
        : `${prefix}-${String(number).padStart(5, "0")}`;

      patient = await prisma.patient.create({
        data: {
          visibleId,
          name: patientName,
          age: patientAge || 25, // Use provided age or default
          gender: "Not Specified",
          phone: patientPhone,
          email: patientEmail || null,
          condition: "General Consultation",
          allergies: [],
          emergencyContact: null,
          emergencyPhone: null,
          address: null,
          abhaId: null,
          status: "Active",
          createdFromEmergency: false,
        },
      });
    } else if (patientEmail && !patient.email) {
      // Update existing patient with email if they don't have one
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          email: patientEmail,
          age: patientAge || patient.age, // Update age if provided
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

    // Get appointment settings for duration
    const appointmentSettings = await prisma.appointmentSettings.findFirst();
    const duration = appointmentSettings?.defaultDuration || "30";

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientName: patient.name,
        patientPhone: patientPhone,
        patientVisibleId: patient.visibleId,
        date: appointmentDate,
        time: selectedSlot.time,
        type: bookingData.appointmentType || "General Consultation",
        duration: duration,
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
    const { message, conversationId = "default", userId = null, patientPhone = null } = req.body;

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

    // Use conversation ID as session ID to maintain state
    const sessionId = conversationId;

    // Process the message with simplified chat service
    const response = await processSimpleChat(
      message.trim(),
      sessionId,
      patientPhone,
      userId
    );

    // Handle automatic booking if ready
    if (response.readyToBook && response.bookingData) {
      try {
        const bookingResult = await performBooking(
          response.conversationContext?.bookingData || response.bookingData,
          sessionId
        );
        if (bookingResult.success) {
          response.message = `✅ **Appointment Booked Successfully!**\n\n📅 **Details:**\n• Date: ${bookingResult.appointment.date.toLocaleDateString(
            "en-US",
            { weekday: "long", month: "long", day: "numeric", year: "numeric" }
          )}\n• Time: ${bookingResult.appointment.time}\n• Patient: ${
            bookingResult.patient.name
          }\n• Phone: ${bookingResult.patient.phone}\n• Email: ${
            bookingResult.patient.email || "Not provided"
          }\n• Age: ${bookingResult.patient.age} years\n• Type: ${
            bookingResult.appointment.type
          }\n• Duration: ${
            bookingResult.appointment.duration
          } minutes\n\n📱 You'll receive confirmation messages shortly.\n\nIs there anything else I can help you with?`;
          if (response.conversationContext) {
            response.conversationContext.state = CONVERSATION_STATES.COMPLETED;
          }
          response.appointmentBooked = true;
          response.appointmentDetails = bookingResult.appointment;
        } else {
          response.message = `❌ Sorry, there was an issue booking your appointment: ${bookingResult.error}\n\nWould you like to try a different time slot?`;
          if (response.conversationContext) {
            response.conversationContext.state = CONVERSATION_STATES.SHOWING_SLOTS;
          }
        }
      } catch (bookingError) {
        console.error("Booking error:", bookingError);
        response.message = `❌ Sorry, there was an issue booking your appointment. Please try again or contact our staff directly.`;
        if (response.conversationContext) {
          response.conversationContext.state = CONVERSATION_STATES.GREETING;
        }
      }
    }

    // Create AI response message
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      type: "ai",
      content: response.message,
      timestamp: new Date().toISOString(),
      state: response.conversationContext?.state || CONVERSATION_STATES.GREETING,
      availableSlots: response.availableSlots || [],
      suggestedActions: response.suggestedActions || [],
      urgency: response.urgency || "low",
      bookingData: response.conversationContext?.bookingData,
      appointmentBooked: response.appointmentBooked || false,
      appointmentDetails: response.appointmentDetails,
      sessionId: sessionId
    };

    // Return response
    res.json({
      success: true,
      response: aiMessage,
      conversationId: conversationId,
      sessionId: sessionId,
      conversationState: response.conversationContext?.state || CONVERSATION_STATES.GREETING,
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
      patientEmail,
      patientAge,
      date,
      time,
      type = "General Consultation",
      duration,
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

      // Generate visibleId using the same logic as regular patient creation
      let prefix;
      try {
        prefix = await getPatientIdPrefix();
      } catch (error) {
        return res.status(400).json({
          error: `Unable to create patient: ${error.message}`,
        });
      }
      let letter = null;
      let number = 1;

      // Find the highest existing visibleId with this prefix
      const lastPatient = await prisma.patient.findFirst({
        where: {
          visibleId: {
            startsWith: prefix,
          },
        },
        orderBy: {
          visibleId: "desc",
        },
      });

      if (lastPatient && lastPatient.visibleId) {
        // Match APL-00001 to APL-99999
        let match = lastPatient.visibleId.match(/^([A-Z]{3})-(\d{5})$/);
        if (match) {
          prefix = match[1];
          number = parseInt(match[2], 10) + 1;
          if (number > 99999) {
            number = 1;
            letter = "A";
          }
        } else {
          // Match APL-X-00001 to APL-Z-99999
          match = lastPatient.visibleId.match(/^([A-Z]{3})-([A-Z])-(\d{5})$/);
          if (match) {
            prefix = match[1];
            letter = match[2];
            number = parseInt(match[3], 10) + 1;
            if (number > 99999) {
              number = 1;
              // Increment letter
              if (letter === "Z") {
                // If letter exceeds Z, increment the last letter of prefix
                let prefixArr = prefix.split("");
                let i = 2;
                while (i >= 0) {
                  if (prefixArr[i] !== "Z") {
                    prefixArr[i] = String.fromCharCode(
                      prefixArr[i].charCodeAt(0) + 1
                    );
                    break;
                  } else {
                    prefixArr[i] = "A";
                    i--;
                  }
                }
                prefix = prefixArr.join("");
                letter = "A";
              } else {
                letter = String.fromCharCode(letter.charCodeAt(0) + 1);
              }
            }
          }
        }
      }

      let visibleId = letter
        ? `${prefix}-${letter}-${String(number).padStart(5, "0")}`
        : `${prefix}-${String(number).padStart(5, "0")}`;

      // Create new patient
      patient = await prisma.patient.create({
        data: {
          visibleId,
          name: patientName,
          age: patientAge || 25, // Use provided age or default
          gender: "Not Specified",
          phone: patientPhone,
          email: patientEmail || null,
          condition: "General Consultation",
          allergies: [],
          emergencyContact: null,
          emergencyPhone: null,
          address: null,
          abhaId: null,
          status: "Active",
          createdFromEmergency: false,
        },
      });
    }

    // Get appointment settings for duration if not provided
    const appointmentSettings = await prisma.appointmentSettings.findFirst();
    const appointmentDuration =
      duration || appointmentSettings?.defaultDuration || "30";

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
        type: type || "General Consultation",
        duration: appointmentDuration,
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
const getChatHistory = async (req, res) => {
  try {
    const { conversationId = "default" } = req.params;
    const history = await getConversationHistory(conversationId);

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
    const { clearSession } = require("../../utils/simpleChatMemory");
    await clearSession(conversationId);

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
  getConversationHistory: getChatHistory,
  clearConversation,
};
