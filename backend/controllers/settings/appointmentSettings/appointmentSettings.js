const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();

// Get appointment settings (do NOT auto-create)
const getAppointmentSettings = async (req, res) => {
  try {
    const settings = await prisma.appointmentSettings.findFirst();
    if (!settings) {
      // Do NOT create defaults in DB, just return null
      return res.json(null);
    }
    // Parse JSON fields before sending to frontend
    settings.durations = typeof settings.durations === "string" ? JSON.parse(settings.durations) : settings.durations;
    settings.timeSlots = typeof settings.timeSlots === "string" ? JSON.parse(settings.timeSlots) : settings.timeSlots;
    settings.workingHours = {
      start: settings.workingHoursStart,
      end: settings.workingHoursEnd,
    };
    settings.breakTime = {
      start: settings.breakStart,
      end: settings.breakEnd,
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to load appointment settings" });
  }
};

// Save/update appointment settings
const saveAppointmentSettings = async (req, res) => {
  try {
    const data = req.body;

    // Map nested fields to flat fields for Prisma
    const mappedData = {
      workingHoursStart: data.workingHours?.start,
      workingHoursEnd: data.workingHours?.end,
      breakStart: data.breakTime?.start,
      breakEnd: data.breakTime?.end,
      durations: JSON.stringify(data.durations),
      timeSlots: JSON.stringify(data.timeSlots),
      appointmentTypes: data.appointmentTypes,
      maxAppointmentsPerDay: data.maxAppointmentsPerDay,
      allowOverlapping: data.allowOverlapping,
      bufferTime: data.bufferTime,
      advanceBookingDays: data.advanceBookingDays,
      autoGenerateSlots: data.autoGenerateSlots,
      defaultDuration: data.defaultDuration,
    };

    let settings = await prisma.appointmentSettings.findFirst();
    if (!settings) {
      settings = await prisma.appointmentSettings.create({ data: mappedData });
    } else {
      settings = await prisma.appointmentSettings.update({
        where: { id: settings.id },
        data: mappedData,
      });
    }
    // Convert JSON fields back for frontend
    settings.durations = JSON.parse(settings.durations);
    settings.timeSlots = JSON.parse(settings.timeSlots);
    // Re-nest for frontend
    settings.workingHours = {
      start: settings.workingHoursStart,
      end: settings.workingHoursEnd,
    };
    settings.breakTime = {
      start: settings.breakStart,
      end: settings.breakEnd,
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to save appointment settings" });
  }
};

module.exports = {
  getAppointmentSettings,
  saveAppointmentSettings,
};