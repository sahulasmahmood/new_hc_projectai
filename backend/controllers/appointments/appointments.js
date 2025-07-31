const { PrismaClient } = require('../../generated/prisma');
const { inngest } = require('../../inngest/client');
const prisma = new PrismaClient();
const { sendWhatsAppMessage, formatAppointmentMessage } = require("../../utils/whatsapp");

//old code 
/* const { sendAppointmentConfirmationEmail, sendAppointmentCancellationEmail, sendAppointmentRescheduleEmail } = require("../../utils/appointmentMail");
 */


// Get all appointments
const getAllAppointments = async (req, res) => {
  try {
    // console.log('Fetching all appointments...');
    const appointments = await prisma.appointment.findMany({
      orderBy: {
        date: 'asc'
      }
    });
    // console.log('Found appointments:', appointments);
    res.json(appointments);
  } catch (error) {
    // console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get single appointment
const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log('Fetching appointment with ID:', id);
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) }
    });
    // console.log('Found appointment:', appointment);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    // console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Create new appointment
const createAppointment = async (req, res) => {
  try {
    const {
      patientId, // <-- new
      patientPhone,
      date,
      time,
      type,
      duration,
      notes = '',
      status = 'Confirmed'
    } = req.body;

    let patient = null;
    if (patientId) {
      // Try to find patient by ID
      patient = await prisma.patient.findUnique({
        where: { id: typeof patientId === 'string' ? parseInt(patientId) : patientId }
      });
    }
    if (!patient) {
      // Fallback: find by phone
      patient = await prisma.patient.findFirst({
        where: { phone: patientPhone }
      });
    }

    if (!patient) {
      return res.status(400).json({ error: "Patient not found. Please create the patient record first." });
    }

    // Validate: Prevent scheduling in the past (allow if slot's END time is in the future)
    // Fix timezone issue by creating date in local timezone
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day); // month is 0-indexed
    // Parse time string (e.g., '10:30 AM') to set hours and minutes
    let slotDurationMinutes;
    if (duration) {
      slotDurationMinutes = parseInt(duration);
      if (isNaN(slotDurationMinutes)) throw new Error('Invalid or missing slot duration.');
    }
    if (time) {
      const [timePart, period] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      appointmentDate.setHours(hours, minutes, 0, 0);
    }
    const slotEnd = new Date(appointmentDate.getTime() + slotDurationMinutes * 60000);
    if (slotEnd < new Date()) {
      return res.status(400).json({ error: 'Cannot schedule an appointment in the past.' });
    }

    // Check maximum appointments per day limit
    const appointmentSettings = await prisma.appointmentSettings.findFirst();
    if (!appointmentSettings) {
      return res.status(400).json({ error: 'Please configure appointment settings before creating appointments.' });
    }

    if (appointmentSettings) {
      // Count existing appointments for the same date
      const existingAppointmentsCount = await prisma.appointment.count({
        where: {
          date: appointmentDate
        }
      });

      if (existingAppointmentsCount >= appointmentSettings.maxAppointmentsPerDay) {
        return res.status(400).json({ 
          error: `Maximum appointments per day (${appointmentSettings.maxAppointmentsPerDay}) has been reached for ${date}. Please select a different date.` 
        });
      }
    }

    try {
      const appointment = await prisma.appointment.create({
        data: {
          patientName: patient.name,
          patientPhone,
          patientVisibleId: patient.visibleId,
          date: appointmentDate,
          time,
          type,
          duration,
          notes: notes || null,
          status,
          patientId: patient.id
        }
      });

      //normal email send ( without inngest old code )
/*       await sendAppointmentConfirmationEmail({
        to: patient.email,
        name: patient.name,
        appointmentDetails: {
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
          doctorName: appointment.doctorName || "", // if available
          department: appointment.department || "", // if available
          notes: appointment.notes || "",
          patientName: patient.name,
        }
      }); */

      // Send appointment confirmation email via Inngest
      if (patient.email) {
        try {
          await inngest.send({
            name: "appointment/confirmation",
            data: {
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
            }
          });
          console.log(`✅ Appointment confirmation email event triggered for: ${patient.email}`);
        } catch (emailError) {
          console.error("❌ Failed to trigger confirmation email event:", emailError);
          // Don't fail the appointment creation if email event fails
        }
      }
      if (patient.phone) {
        // Convert 10-digit to E.164 (India) if needed
        let phone = patient.phone;
        if (/^\d{10}$/.test(phone)) {
          phone = `+91${phone}`;
        }
        // Fetch hospital info for message
        const hospitalSettings = await prisma.hospitalSettings.findFirst();
        const message = formatAppointmentMessage({
          patientName: patient.name,
          date: appointment.date
            ? new Date(appointment.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
            : "",
          time: appointment.time,
          type: appointment.type,
          doctorName: appointment.doctorName || "",
          department: appointment.department || "",
          hospitalName: hospitalSettings?.name || "Hospital",
          hospitalPhone: hospitalSettings?.phone || "",
        });
        // This will log success or error in the utility itself
        await sendWhatsAppMessage(phone, message);
      }
      res.status(201).json(appointment);
    } catch (error) {
      console.error(error); // Log the error for debugging
      // Handle unique constraint violation (duplicate booking)
      if (error.code === 'P2002' && error.meta && error.meta.target && error.meta.target.includes('date_time')) {
        return res.status(409).json({ error: 'This time slot is already booked. Please select a different time.' });
      }
      // Fallback for other errors
      return res.status(500).json({ error: 'Failed to create appointment' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientName,
      patientPhone,
      date,
      time,
      type,
      duration,
      notes,
      status
    } = req.body;

    console.log('Updating appointment:', id, 'with data:', req.body);

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        patientName,
        patientPhone,
        date: date ? (() => {
          // Fix timezone issue by creating date in local timezone
          const [year, month, day] = date.split('-').map(Number);
          return new Date(year, month - 1, day); // month is 0-indexed
        })() : undefined,
        time,
        type,
        duration,
        notes: notes || null,
        status
      }
    });

    // console.log('Updated appointment:', appointment);
    res.json(appointment);
  } catch (error) {
    // console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    // Find appointment details for cancellation email
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Fetch patient info
    let patient = null;
    if (appointment.patientId) {
      patient = await prisma.patient.findUnique({ where: { id: appointment.patientId } });
    }
    if (!patient && appointment.patientPhone) {
      patient = await prisma.patient.findFirst({ where: { phone: appointment.patientPhone } });
    }

        // Send cancellation email if patient email exists (Normal email function - old code )
      /*   if (patient && patient.email) {
          await sendAppointmentCancellationEmail({
            to: patient.email,
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
        }
 */
    // Send cancellation email via Inngest if patient email exists
    if (patient && patient.email) {
      try {
        await inngest.send({
          name: "appointment/cancellation",
          data: {
            to: patient.email,
            appointmentDetails: {
              date: appointment.date,
              time: appointment.time,
              type: appointment.type,
              doctorName: appointment.doctorName || "",
              department: appointment.department || "",
              notes: appointment.notes || "",
              patientName: patient.name,
            }
          }
        });
        console.log(`✅ Appointment cancellation email event triggered for: ${patient.email}`);
      } catch (emailError) {
        console.error("❌ Failed to trigger cancellation email event:", emailError);
        // Don't fail the appointment deletion if email event fails
      }
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id: parseInt(id) }
    });
    // console.log('Appointment deleted successfully');
    res.status(204).send();
  } catch (error) {
    // console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
};

// Reschedule appointment
const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newTime } = req.body;

    console.log('Rescheduling appointment:', id, 'to', newDate, newTime);

    // Get the current appointment
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if appointment can be rescheduled
    const blockedStatuses = ["In Progress", "Completed", "Cancelled"];
    if (blockedStatuses.includes(currentAppointment.status)) {
      return res.status(400).json({ 
        error: `Cannot reschedule appointment with status \"${currentAppointment.status}\". Only confirmed appointments can be rescheduled.` 
      });
    }

    // Validate new date and time
    if (!newDate || !newTime) {
      return res.status(400).json({ error: 'New date and time are required' });
    }

    // Parse the new appointment date and time
    // Fix timezone issue by creating date in local timezone
    const [year, month, day] = newDate.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day); // month is 0-indexed
    const [timePart, period] = newTime.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    appointmentDate.setHours(hours, minutes, 0, 0);

    // Validate: Prevent scheduling in the past
    const slotDurationMinutes = parseInt(currentAppointment.duration);
    if (isNaN(slotDurationMinutes)) throw new Error('Invalid or missing slot duration.');
    const slotEnd = new Date(appointmentDate.getTime() + slotDurationMinutes * 60000);
    if (slotEnd < new Date()) {
      return res.status(400).json({ error: 'Cannot reschedule to a time in the past.' });
    }

    // Check if the new time slot is available (excluding the current appointment)
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        date: appointmentDate, // Use the already created timezone-safe date
        time: newTime,
        id: { not: parseInt(id) } // Exclude the current appointment
      }
    });

    if (conflictingAppointment) {
      return res.status(409).json({ 
        error: `Time slot ${newTime} on ${newDate} is already booked by ${conflictingAppointment.patientName}. Please select a different time.` 
      });
    }

    // Check maximum appointments per day limit for rescheduling to a different date
    if (currentAppointment.date.toISOString().split('T')[0] !== newDate) {
      const appointmentSettings = await prisma.appointmentSettings.findFirst();
      if (appointmentSettings) {
        // Count existing appointments for the new date (excluding the current appointment)
        const existingAppointmentsCount = await prisma.appointment.count({
          where: { date: appointmentDate }
        });
        if (existingAppointmentsCount >= appointmentSettings.maxAppointmentsPerDay) {
          return res.status(400).json({ 
            error: `Maximum appointments per day (${appointmentSettings.maxAppointmentsPerDay}) has been reached for ${newDate}. Please select a different date.` 
          });
        }
      }
    }

    // Update the appointment with new date and time (use Date object for Prisma)
    const updatedAppointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        date: appointmentDate,
        time: newTime,
      }
    });

    // Find patient
    let patient = null;
    if (updatedAppointment.patientId) {
      patient = await prisma.patient.findUnique({ where: { id: updatedAppointment.patientId } });
    }
    if (!patient && updatedAppointment.patientPhone) {
      patient = await prisma.patient.findFirst({ where: { phone: updatedAppointment.patientPhone } });
    }
    
    //old code - normal email reschedule - if you need you can uncommand
    // Send reschedule email if patient email exists
/*     if (patient && patient.email) {
      await sendAppointmentRescheduleEmail({
        to: patient.email,
        appointmentDetails: {
          date: updatedAppointment.date,
          time: updatedAppointment.time,
          type: updatedAppointment.type,
          doctorName: updatedAppointment.doctorName || "",
          department: updatedAppointment.department || "",
          notes: updatedAppointment.notes || "",
          patientName: patient.name,
        }
      });
    } */


    // Send reschedule email via Inngest if patient email exists
    if (patient && patient.email) {
      try {
        await inngest.send({
          name: "appointment/reschedule",
          data: {
            to: patient.email,
            appointmentDetails: {
              date: updatedAppointment.date,
              time: updatedAppointment.time,
              type: updatedAppointment.type,
              doctorName: updatedAppointment.doctorName || "",
              department: updatedAppointment.department || "",
              notes: updatedAppointment.notes || "",
              patientName: patient.name,
            }
          }
        });
        console.log(`✅ Appointment reschedule email event triggered for: ${patient.email}`);
      } catch (emailError) {
        console.error("❌ Failed to trigger reschedule email event:", emailError);
        // Don't fail the appointment reschedule if email event fails
      }
    }

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
};

const swapAppointments = async (req, res) => {
  const { id1, id2 } = req.body;
  if (!id1 || !id2) {
    return res.status(400).json({ error: "Both appointment IDs are required" });
  }
  try {
    const [a1, a2] = await Promise.all([
      prisma.appointment.findUnique({ where: { id: id1 } }),
      prisma.appointment.findUnique({ where: { id: id2 } }),
    ]);
    if (!a1 || !a2) {
      return res.status(404).json({ error: "One or both appointments not found" });
    }
    const blocked = ["In Progress", "Completed", "Cancelled"];
    if (blocked.includes(a1.status) || blocked.includes(a2.status)) {
      return res.status(400).json({ error: "Cannot swap appointments with current status" });
    }

    // Use a temporary time value that cannot conflict
    const tempTime = "__TEMP__" + Date.now();

    await prisma.$transaction([
      // Step 1: Move A to a temporary slot
      prisma.appointment.update({
        where: { id: id1 },
        data: { date: a1.date, time: tempTime }
      }),
      // Step 2: Move B to A's original slot
      prisma.appointment.update({
        where: { id: id2 },
        data: { date: a1.date, time: a1.time }
      }),
      // Step 3: Move A to B's original slot
      prisma.appointment.update({
        where: { id: id1 },
        data: { date: a2.date, time: a2.time }
      }),
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error swapping appointments:", error);
    res.status(500).json({ error: "Failed to swap appointments" });
  }
};

module.exports = {
  getAllAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  rescheduleAppointment,
  swapAppointments
};