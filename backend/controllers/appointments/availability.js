const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

/**
 * Check if a specific time slot is available
 * Returns error if requested slot is already booked
 */
const checkSlotAvailability = async (req, res) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "Date and time are required",
      });
    }

    // Get appointment settings
    const settings = await prisma.appointmentSettings.findFirst();
    if (!settings) {
      return res.status(500).json({
        success: false,
        message: "Appointment settings not found",
      });
    }

    // Parse timeSlots JSON if it's a string
    let timeSlots = settings.timeSlots;
    if (typeof timeSlots === "string") {
      try {
        timeSlots = JSON.parse(timeSlots);
      } catch (error) {
        console.error("Error parsing time slots:", error);
        return res.status(500).json({
          success: false,
          message: "Invalid time slots configuration",
        });
      }
    }

    // Parse the date and time
    const [year, month, day] = date.split("-").map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    
    // Parse time string (handle both 12-hour and 24-hour formats)
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    
    appointmentDate.setHours(hours, minutes, 0, 0);

    // Check if slot is already booked
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: {
          equals: appointmentDate,
        },
        time: {
          equals: time,
        },
        status: {
          notIn: ["Cancelled", "Completed"],
        },
      },
    });

    // If slot is available, return success
    if (!existingAppointment) {
      return res.json({
        success: true,
        available: true,
      });
    }

    // If slot is taken, return error
    return res.status(409).json({
      success: false,
      available: false,
      message: "This time slot is already booked. Please select another time.",
    });

  } catch (error) {
    console.error("Error checking slot availability:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check slot availability",
    });
  }
};

module.exports = {
  checkSlotAvailability,
};
