const { inngest } = require("../client");
const { PrismaClient } = require("../../generated/prisma");
const { 
  sendAppointmentReminderEmail,
  sendAppointmentFollowUpEmail 
} = require("../../utils/appointmentMail");
const { sendWhatsAppMessage, formatReminderMessage } = require("../../utils/whatsapp");

const prisma = new PrismaClient();

// Automated appointment reminder function (24 hours before)
const onAppointmentReminder = inngest.createFunction(
  { id: "appointment-reminder-24h", retries: 2 },
  { cron: "0 9 * * *" }, // Run daily at 9 AM
  async ({ step }) => {
    try {
      // Get appointments for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const upcomingAppointments = await step.run("get-upcoming-appointments", async () => {
        return await prisma.appointment.findMany({
          where: {
            date: {
              gte: tomorrow,
              lte: endOfTomorrow
            },
            status: "Confirmed"
          },
          include: {
            patient: true
          }
        });
      });

      console.log(`📅 Found ${upcomingAppointments.length} appointments for tomorrow`);

      // Send reminders for each appointment
      const reminderResults = await step.run("send-reminders", async () => {
        const results = [];
        
        for (const appointment of upcomingAppointments) {
          try {
            // Get patient info
            let patient = appointment.patient;
            if (!patient && appointment.patientPhone) {
              patient = await prisma.patient.findFirst({
                where: { phone: appointment.patientPhone }
              });
            }

            if (!patient) continue;

            // Send email reminder if patient has email
            if (patient.email) {
              try {
                await sendAppointmentReminderEmail({
                  to: patient.email,
                  name: patient.name,
                  appointmentDetails: {
                    date: appointment.date,
                    time: appointment.time,
                    type: appointment.type,
                    doctorName: appointment.doctorName || "",
                    department: appointment.department || "",
                    notes: appointment.notes || "",
                    patientName: patient.name,
                  }
                });
                console.log(`✅ Email reminder sent to: ${patient.email}`);
              } catch (emailError) {
                console.error(`❌ Email reminder failed for ${patient.email}:`, emailError);
              }
            }

            // Send WhatsApp reminder
            if (patient.phone) {
              try {
                let phone = patient.phone;
                if (/^\d{10}$/.test(phone)) {
                  phone = `+91${phone}`;
                }

                const hospitalSettings = await prisma.hospitalSettings.findFirst();
                const reminderMessage = formatReminderMessage({
                  patientName: patient.name,
                  date: appointment.date
                    ? new Date(appointment.date).toLocaleDateString("en-IN", { 
                        weekday: "long", 
                        year: "numeric", 
                        month: "long", 
                        day: "numeric" 
                      })
                    : "",
                  time: appointment.time,
                  type: appointment.type,
                  doctorName: appointment.doctorName || "",
                  hospitalName: hospitalSettings?.name || "Hospital",
                  hospitalPhone: hospitalSettings?.phone || "",
                });

                await sendWhatsAppMessage(phone, reminderMessage);
                console.log(`✅ WhatsApp reminder sent to: ${phone}`);
              } catch (whatsappError) {
                console.error(`❌ WhatsApp reminder failed for ${patient.phone}:`, whatsappError);
              }
            }

            results.push({
              appointmentId: appointment.id,
              patientName: patient.name,
              status: "sent"
            });

          } catch (error) {
            console.error(`❌ Reminder failed for appointment ${appointment.id}:`, error);
            results.push({
              appointmentId: appointment.id,
              status: "failed",
              error: error.message
            });
          }
        }

        return results;
      });

      return {
        success: true,
        appointmentsProcessed: upcomingAppointments.length,
        reminderResults: reminderResults
      };

    } catch (error) {
      console.error("❌ Error in appointment reminder function:", error);
      return { success: false, error: error.message };
    }
  }
);

// Automated follow-up for completed appointments
const onAppointmentFollowUp = inngest.createFunction(
  { id: "appointment-followup", retries: 2 },
  { cron: "0 10 * * *" }, // Run daily at 10 AM
  async ({ step }) => {
    try {
      // Get appointments completed yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      const completedAppointments = await step.run("get-completed-appointments", async () => {
        return await prisma.appointment.findMany({
          where: {
            date: {
              gte: yesterday,
              lte: endOfYesterday
            },
            status: "Completed"
          },
          include: {
            patient: true
          }
        });
      });

      console.log(`📋 Found ${completedAppointments.length} completed appointments for follow-up`);

      // Send follow-up emails
      const followUpResults = await step.run("send-followups", async () => {
        const results = [];
        
        for (const appointment of completedAppointments) {
          try {
            let patient = appointment.patient;
            if (!patient && appointment.patientPhone) {
              patient = await prisma.patient.findFirst({
                where: { phone: appointment.patientPhone }
              });
            }

            if (!patient || !patient.email) continue;

            await sendAppointmentFollowUpEmail({
              to: patient.email,
              name: patient.name,
              appointmentDetails: {
                date: appointment.date,
                time: appointment.time,
                type: appointment.type,
                doctorName: appointment.doctorName || "",
                department: appointment.department || "",
                notes: appointment.notes || "",
                patientName: patient.name,
              }
            });

            console.log(`✅ Follow-up email sent to: ${patient.email}`);
            
            results.push({
              appointmentId: appointment.id,
              patientName: patient.name,
              status: "sent"
            });

          } catch (error) {
            console.error(`❌ Follow-up failed for appointment ${appointment.id}:`, error);
            results.push({
              appointmentId: appointment.id,
              status: "failed",
              error: error.message
            });
          }
        }

        return results;
      });

      return {
        success: true,
        appointmentsProcessed: completedAppointments.length,
        followUpResults: followUpResults
      };

    } catch (error) {
      console.error("❌ Error in appointment follow-up function:", error);
      return { success: false, error: error.message };
    }
  }
);

// Smart appointment suggestions based on patient history
const onSmartAppointmentSuggestions = inngest.createFunction(
  { id: "smart-appointment-suggestions", retries: 1 },
  { event: "appointment/suggest-followup" },
  async ({ event, step }) => {
    try {
      const { patientId, appointmentType, completedDate } = event.data;

      const suggestions = await step.run("generate-suggestions", async () => {
        // Get patient's appointment history
        const patientHistory = await prisma.appointment.findMany({
          where: {
            patientId: patientId,
            status: "Completed"
          },
          orderBy: {
            date: 'desc'
          },
          take: 5
        });

        // Generate smart suggestions based on appointment type and history
        const suggestionRules = {
          "General Consultation": {
            followUpDays: 30,
            message: "Consider scheduling a follow-up consultation"
          },
          "Follow-up": {
            followUpDays: 14,
            message: "Schedule next follow-up appointment"
          },
          "Emergency": {
            followUpDays: 7,
            message: "Important: Schedule follow-up after emergency visit"
          },
          "Specialist": {
            followUpDays: 21,
            message: "Specialist follow-up recommended"
          }
        };

        const rule = suggestionRules[appointmentType] || suggestionRules["General Consultation"];
        const suggestedDate = new Date(completedDate);
        suggestedDate.setDate(suggestedDate.getDate() + rule.followUpDays);

        return {
          patientId: patientId,
          suggestedDate: suggestedDate,
          message: rule.message,
          appointmentType: appointmentType,
          priority: appointmentType === "Emergency" ? "high" : "medium"
        };
      });

      // Store suggestion in database (you might want to create a suggestions table)
      await step.run("store-suggestion", async () => {
        // For now, we'll just log it. In production, store in a suggestions table
        console.log(`💡 Smart suggestion generated:`, suggestions);
        return suggestions;
      });

      return { success: true, suggestions: suggestions };

    } catch (error) {
      console.error("❌ Error generating smart suggestions:", error);
      return { success: false, error: error.message };
    }
  }
);

// Waitlist management function
const onWaitlistManagement = inngest.createFunction(
  { id: "waitlist-management", retries: 2 },
  { event: "appointment/cancelled" },
  async ({ event, step }) => {
    try {
      const { cancelledAppointment } = event.data;

      // Check if there are patients waiting for this slot
      const waitlistResults = await step.run("check-waitlist", async () => {
        // This would check a waitlist table if implemented
        // For now, we'll just log the availability
        console.log(`📋 Slot became available: ${cancelledAppointment.date} at ${cancelledAppointment.time}`);
        
        // In a full implementation, you would:
        // 1. Check waitlist for this date/time
        // 2. Notify first person on waitlist
        // 3. Give them time to confirm
        // 4. Move to next person if no response
        
        return {
          slotAvailable: true,
          date: cancelledAppointment.date,
          time: cancelledAppointment.time,
          notified: 0 // Number of waitlist patients notified
        };
      });

      return { success: true, waitlistResults: waitlistResults };

    } catch (error) {
      console.error("❌ Error in waitlist management:", error);
      return { success: false, error: error.message };
    }
  }
);

module.exports = {
  onAppointmentReminder,
  onAppointmentFollowUp,
  onSmartAppointmentSuggestions,
  onWaitlistManagement
};