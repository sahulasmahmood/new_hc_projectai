const { inngest } = require("../client");
const { NonRetriableError } = require("inngest");
const { 
  sendAppointmentConfirmationEmail, 
  sendAppointmentCancellationEmail, 
  sendAppointmentRescheduleEmail 
} = require("../../utils/appointmentMail");

// Appointment Confirmation Email Function
const onAppointmentConfirmation = inngest.createFunction(
  { id: "on-appointment-confirmation", retries: 2 },
  { event: "appointment/confirmation" },
  async ({ event, step }) => {
    try {
      const { to, name, appointmentDetails } = event.data;
      
      await step.run("send-confirmation-email", async () => {
        const result = await sendAppointmentConfirmationEmail({
          to,
          name,
          appointmentDetails
        });
        
        if (!result) {
          throw new Error("Failed to send appointment confirmation email");
        }
        
        return result;
      });

      return { success: true, to, type: "confirmation" };
    } catch (error) {
      console.error("❌ Error sending appointment confirmation email", error.message);
      return { success: false, error: error.message };
    }
  }
);

// Appointment Cancellation Email Function
const onAppointmentCancellation = inngest.createFunction(
  { id: "on-appointment-cancellation", retries: 2 },
  { event: "appointment/cancellation" },
  async ({ event, step }) => {
    try {
      const { to, appointmentDetails } = event.data;
      
      await step.run("send-cancellation-email", async () => {
        const result = await sendAppointmentCancellationEmail({
          to,
          appointmentDetails
        });
        
        if (!result) {
          throw new Error("Failed to send appointment cancellation email");
        }
        
        return result;
      });

      return { success: true, to, type: "cancellation" };
    } catch (error) {
      console.error("❌ Error sending appointment cancellation email", error.message);
      return { success: false, error: error.message };
    }
  }
);

// Appointment Reschedule Email Function
const onAppointmentReschedule = inngest.createFunction(
  { id: "on-appointment-reschedule", retries: 2 },
  { event: "appointment/reschedule" },
  async ({ event, step }) => {
    try {
      const { to, appointmentDetails } = event.data;
      
      await step.run("send-reschedule-email", async () => {
        const result = await sendAppointmentRescheduleEmail({
          to,
          appointmentDetails
        });
        
        if (!result) {
          throw new Error("Failed to send appointment reschedule email");
        }
        
        return result;
      });

      return { success: true, to, type: "reschedule" };
    } catch (error) {
      console.error("❌ Error sending appointment reschedule email", error.message);
      return { success: false, error: error.message };
    }
  }
);

module.exports = { 
  onAppointmentConfirmation, 
  onAppointmentCancellation, 
  onAppointmentReschedule 
};