const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// Create new prescription
const createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      chiefComplaint,
      medications,
      investigations,
      doctorNotes,
      advice,
      doctorId,
    } = req.body;

    // Validate required fields
    if (!patientId) {
      return res.status(400).json({ error: "Patient ID is required" });
    }

    if (!doctorId) {
      return res.status(400).json({ error: "Doctor selection is required for prescription security" });
    }

    // Get doctor information - MANDATORY for security
    const doctor = await prisma.staff.findUnique({
      where: { id: parseInt(doctorId) },
      select: { name: true, qualification: true, digitalSignature: true },
    });

    if (!doctor) {
      return res.status(400).json({ error: "Invalid doctor selected. Please select a valid doctor." });
    }

    // Get patient information to store directly in prescription
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
      select: { name: true, visibleId: true, age: true, gender: true },
    });

    if (!patient) {
      return res.status(400).json({ error: "Patient not found." });
    }

    const finalDoctorName = doctor.name;
    const doctorSignature = doctor.digitalSignature || 
      (doctor.qualification ? `${doctor.name}, ${doctor.qualification}` : doctor.name);

    // Create prescription with medications
    const prescription = await prisma.prescription.create({
      data: {
        patientId: parseInt(patientId),
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        // Store patient info directly
        patientName: patient.name,
        patientVisibleId: patient.visibleId,
        patientAge: patient.age,
        patientGender: patient.gender,
        chiefComplaint,
        investigations,
        doctorNotes,
        advice,
        doctorName: finalDoctorName,
        doctorSignature,
        medications: {
          create:
            medications?.map((med) => ({
              medicineName: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
            })) || [],
        },
      },
      include: {
        medications: true,
        patient: {
          select: {
            name: true,
            visibleId: true,
          },
        },
      },
    });

    // If appointment ID is provided, mark consultation as completed
    if (appointmentId) {
      const actualEndTime = new Date();

      await prisma.appointment.update({
        where: { id: parseInt(appointmentId) },
        data: {
          status: "Completed",
          actualEndTime: actualEndTime, // Store actual end time
          // consultationEndTime remains the official scheduled end time
        },
      });

      // Update patient consultation status
      await prisma.patient.update({
        where: { id: parseInt(patientId) },
        data: {
          consultationStatus: "completed",
          lastVisit: new Date(),
        },
      });
    }

    res.status(201).json(prescription);
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(500).json({ error: "Failed to create prescription" });
  }
};

// Get prescriptions for a patient
const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: parseInt(patientId) },
      include: {
        medications: true,
        appointment: {
          select: {
            date: true,
            time: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
};

// Get single prescription
const getPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(id) },
      include: {
        medications: true,
        patient: {
          select: {
            name: true,
            visibleId: true,
            age: true,
            gender: true,
          },
        },
        appointment: {
          select: {
            date: true,
            time: true,
            type: true,
          },
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    res.json(prescription);
  } catch (error) {
    console.error("Error fetching prescription:", error);
    res.status(500).json({ error: "Failed to fetch prescription" });
  }
};

// Update prescription
const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { chiefComplaint, medications, investigations, doctorNotes, advice } =
      req.body;

    // Delete existing medications and create new ones
    await prisma.prescriptionMedication.deleteMany({
      where: { prescriptionId: parseInt(id) },
    });

    const prescription = await prisma.prescription.update({
      where: { id: parseInt(id) },
      data: {
        chiefComplaint,
        investigations,
        doctorNotes,
        advice,
        medications: {
          create:
            medications?.map((med) => ({
              medicineName: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
            })) || [],
        },
      },
      include: {
        medications: true,
        patient: {
          select: {
            name: true,
            visibleId: true,
          },
        },
      },
    });

    res.json(prescription);
  } catch (error) {
    console.error("Error updating prescription:", error);
    res.status(500).json({ error: "Failed to update prescription" });
  }
};

// Delete prescription
const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.prescription.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting prescription:", error);
    res.status(500).json({ error: "Failed to delete prescription" });
  }
};

// Get available doctors from staff
const getDoctors = async (req, res) => {
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
        digitalSignature: true,
      },
      orderBy: { name: "asc" },
    });

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
};

module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getPrescription,
  updatePrescription,
  deletePrescription,
  getDoctors,
};
