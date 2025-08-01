const { PrismaClient } = require('../../generated/prisma');
const { getPatientIdPrefix } = require("../../utils/patientIdGenerator");
const prisma = new PrismaClient();

// Get all emergency cases (with patient info)
const getAllEmergencyCases = async (req, res) => {
  try {
    const cases = await prisma.emergencyCase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        appointment: true,
      },
    });
    // Transform cases to match frontend format
    const transformed = cases.map((c) => ({
      id: c.id,
      caseId: `EM${c.id.toString().padStart(3, '0')}`,
      patientName: c.patient?.name || '',
      age: c.patient?.age || '',
      gender: c.patient?.gender || '',
      phone: c.patient?.phone || '',
      chiefComplaint: c.chiefComplaint,
      arrivalTime: c.arrivalTime.toISOString(),
      triagePriority: c.triagePriority,
      assignedTo: c.assignedTo,
      status: c.status,
      vitals: {
        bp: c.vitals?.bp || '',
        pulse: c.vitals?.pulse || '',
        temp: c.vitals?.temp || '',
        spo2: c.vitals?.spo2 || '',
      },
      // Add more fields if needed by frontend
    }));
    res.json(transformed);
  } catch (error) {
    console.error('Error fetching emergency cases:', error);
    res.status(500).json({ error: 'Failed to fetch emergency cases' });
  }
};

// Get emergency case by ID
const getEmergencyCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const c = await prisma.emergencyCase.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        appointment: true,
      },
    });
    if (!c) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    // Transform to match frontend format
    const transformed = {
      id: c.id,
      caseId: `EM${c.id.toString().padStart(3, '0')}`,
      patientName: c.patient?.name || '',
      age: c.patient?.age || '',
      gender: c.patient?.gender || '',
      phone: c.patient?.phone || '',
      chiefComplaint: c.chiefComplaint,
      arrivalTime: c.arrivalTime.toISOString(),
      triagePriority: c.triagePriority,
      assignedTo: c.assignedTo,
      status: c.status,
      vitals: {
        bp: c.vitals?.bp || '',
        pulse: c.vitals?.pulse || '',
        temp: c.vitals?.temp || '',
        spo2: c.vitals?.spo2 || '',
      },
      // Add more fields if needed by frontend
    };
    res.json(transformed);
  } catch (error) {
    console.error('Error fetching emergency case:', error);
    res.status(500).json({ error: 'Failed to fetch emergency case' });
  }
};

// Create new emergency case
const createEmergencyCase = async (req, res) => {
  try {
    const {
      patientId,
      chiefComplaint,
      arrivalTime,
      triagePriority,
      assignedTo,
      status,
      vitals,
      appointmentId,
    } = req.body;

    // Validate required fields
    if (!patientId || !chiefComplaint || !arrivalTime || !triagePriority || !assignedTo || !status || !vitals) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure patient exists
    const patient = await prisma.patient.findUnique({ where: { id: parseInt(patientId) } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const newCase = await prisma.emergencyCase.create({
      data: {
        patientId: parseInt(patientId),
        chiefComplaint,
        arrivalTime: new Date(arrivalTime),
        triagePriority,
        assignedTo,
        status,
        vitals,
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
      },
      include: {
        patient: true,
        appointment: true,
      },
    });

    res.status(201).json(newCase);
  } catch (error) {
    console.error('Error creating emergency case:', error);
    res.status(500).json({ error: 'Failed to create emergency case' });
  }
};

// Update emergency case
const updateEmergencyCase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      chiefComplaint,
      arrivalTime,
      triagePriority,
      assignedTo,
      status,
      vitals,
      appointmentId,
    } = req.body;

    const updatedCase = await prisma.emergencyCase.update({
      where: { id: parseInt(id) },
      data: {
        chiefComplaint,
        arrivalTime: arrivalTime ? new Date(arrivalTime) : undefined,
        triagePriority,
        assignedTo,
        status,
        vitals,
        appointmentId: appointmentId ? parseInt(appointmentId) : undefined,
      },
      include: {
        patient: true,
        appointment: true,
      },
    });

    res.json(updatedCase);
  } catch (error) {
    console.error('Error updating emergency case:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    res.status(500).json({ error: 'Failed to update emergency case' });
  }
};

// Delete emergency case
const deleteEmergencyCase = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.emergencyCase.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting emergency case:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    res.status(500).json({ error: 'Failed to delete emergency case' });
  }
};

    // Transfer emergency case
const transferEmergencyCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { transferTo, transferReason, transferNotes } = req.body;
    if (!transferTo || !transferReason) {
      return res.status(400).json({ error: 'Missing required transfer fields' });
    }
    const updatedCase = await prisma.emergencyCase.update({
      where: { id: parseInt(id) },
      data: {
        transferStatus: 'Transferred',
        transferTo,
        transferReason,
        transferNotes,
        transferTime: new Date(),
        status: 'Transferred',
      },
      include: {
        patient: true,
        appointment: true,
      },
    });
    res.json(updatedCase);
  } catch (error) {
    console.error('Error transferring emergency case:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    res.status(500).json({ error: 'Failed to transfer emergency case' });
  }
};

// Atomic registration: patient, appointment, emergency case
const registerEmergencyCase = async (req, res) => {
  const prisma = new (require('../../generated/prisma').PrismaClient)();
  const {
    patient, // { name, age, gender, phone, ... }
    appointment, // { type, duration, ... }
    emergencyCase // { chiefComplaint, triagePriority, ... }
  } = req.body;

  // Validate required fields for patient
  if (!patient || !patient.name || !patient.age || !patient.gender || !patient.phone) {
    return res.status(400).json({ error: 'Missing required patient fields' });
  }
  // Validate required fields for emergency case
  if (!emergencyCase || !emergencyCase.chiefComplaint || !emergencyCase.triagePriority) {
    return res.status(400).json({ error: 'Missing required emergency case fields' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Generate visibleId (PREFIX-00001 ... PREFIX-99999, then PREFIX-A-00001 ...)
      let prefix;
      try {
        prefix = await getPatientIdPrefix();
      } catch (error) {
        throw new Error(`Unable to create patient: ${error.message}`);
      }
      let letter = null;
      let number = 1;
      const lastPatient = await tx.patient.findFirst({
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
        let match = lastPatient.visibleId.match(/^([A-Z]{3})-(\d{5})$/);
        if (match) {
          prefix = match[1];
          number = parseInt(match[2], 10) + 1;
          if (number > 99999) {
            number = 1;
            letter = 'A';
          }
        } else {
          match = lastPatient.visibleId.match(/^([A-Z]{3})-([A-Z])-(\d{5})$/);
          if (match) {
            prefix = match[1];
            letter = match[2];
            number = parseInt(match[3], 10) + 1;
            if (number > 99999) {
              number = 1;
              if (letter === 'Z') {
                let prefixArr = prefix.split('');
                let i = 2;
                while (i >= 0) {
                  if (prefixArr[i] !== 'Z') {
                    prefixArr[i] = String.fromCharCode(prefixArr[i].charCodeAt(0) + 1);
                    break;
                  } else {
                    prefixArr[i] = 'A';
                    i--;
                  }
                }
                prefix = prefixArr.join('');
                letter = 'A';
              } else {
                letter = String.fromCharCode(letter.charCodeAt(0) + 1);
              }
            }
          }
        }
      }
      let visibleId = letter
        ? `${prefix}-${letter}-${String(number).padStart(5, '0')}`
        : `${prefix}-${String(number).padStart(5, '0')}`;

      // 1. Create patient
      const createdPatient = await tx.patient.create({
        data: {
          visibleId,
          name: patient.name,
          age: parseInt(patient.age),
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email,
          condition: patient.condition,
          allergies: patient.allergies || [],
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
          address: patient.address,
          abhaId: patient.abhaId,
          status: 'Active',
          createdFromEmergency: true,
        },
      });

      // Fetch appointment settings for slot assignment
      const appointmentSettings = await tx.appointmentSettings.findFirst();
      if (!appointmentSettings) {
        throw new Error('Appointment settings not configured.');
      }
      // Parse timeSlots JSON
      let timeSlots = appointmentSettings.timeSlots;
      if (typeof timeSlots === 'string') timeSlots = JSON.parse(timeSlots);
      // Get today's date string (YYYY-MM-DD)
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      // Find the earliest slot (by time, e.g., '08:00')
      const sortedSlots = timeSlots
        .filter(slot => slot.isActive !== false)
        .sort((a, b) => a.time.localeCompare(b.time));
      if (!sortedSlots.length) throw new Error('No active time slots configured.');
      const earliestSlot = sortedSlots[0];
      // Helper to parse 12-hour time (e.g., '01:00 PM') to 24-hour
      function parseTimeTo24Hour(timeStr) {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return { hours, minutes };
      }
      // Get slot duration in minutes from appointment settings
      let slotDurationMinutes;
      let appointmentDuration;

      // Always use defaultDuration for emergency appointments
      if (appointmentSettings.defaultDuration) {
        const parsed = parseInt(appointmentSettings.defaultDuration);
        if (!isNaN(parsed)) {
          slotDurationMinutes = parsed;
          appointmentDuration = appointmentSettings.defaultDuration;
        }
      }
      if (!slotDurationMinutes || !appointmentDuration) {
        throw new Error('No valid appointment duration found in settings.');
      }
      // Map slots to Date objects for today, with start and end
      const todaySlots = sortedSlots.map(slot => {
        const { hours, minutes } = parseTimeTo24Hour(slot.time);
        const slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60000);
        return { ...slot, slotStart, slotEnd };
      });
      // --- New logic: split each slot into two halves for emergency assignment ---
      let chosenSlot;
      let slotDate;
      let slotTime;
      // Find the slot where now is between slotStart and slotEnd
      const currentSlotIndex = todaySlots.findIndex(slot => now >= slot.slotStart && now < slot.slotEnd);
      if (currentSlotIndex !== -1) {
        const slot = todaySlots[currentSlotIndex];
        const midpoint = new Date(slot.slotStart.getTime() + (slotDurationMinutes / 2) * 60000);
        if (now < midpoint) {
          // First half: assign current slot
          chosenSlot = slot;
        } else {
          // Second half: assign next slot if available, else last slot
          chosenSlot = todaySlots[currentSlotIndex + 1] || todaySlots[todaySlots.length - 1];
        }
      } else {
        // If not in any slot, use the next future slot, or last slot if none
        const nextSlot = todaySlots.find(slot => slot.slotStart > now);
        chosenSlot = nextSlot || todaySlots[todaySlots.length - 1];
      }
      slotDate = chosenSlot.slotStart;
      slotTime = chosenSlot.time;

      // 2. Create appointment (double booking allowed for emergencies)
      const createdAppointment = await tx.appointment.create({
        data: {
          patientId: createdPatient.id,
          patientName: createdPatient.name,
          patientPhone: createdPatient.phone,
          date: slotDate,
          time: slotTime,
          type: appointment?.type || 'Emergency',
          duration: appointmentDuration, // Use dynamic duration
          status: appointment?.status || 'Confirmed',
          notes: appointment?.notes || `Auto-created for emergency (${emergencyCase.triagePriority})`,
        },
      });
      // 3. Create emergency case
      const createdCase = await tx.emergencyCase.create({
        data: {
          patientId: createdPatient.id,
          chiefComplaint: emergencyCase.chiefComplaint,
          arrivalTime: emergencyCase.arrivalTime ? new Date(emergencyCase.arrivalTime) : now,
          triagePriority: emergencyCase.triagePriority,
          assignedTo: emergencyCase.assignedTo || 'Unassigned',
          status: emergencyCase.status || 'Waiting',
          vitals: emergencyCase.vitals || {},
          appointmentId: createdAppointment.id,
        },
        include: { patient: true, appointment: true },
      });

      // 4. Update appointment to reference emergency case
      await tx.appointment.update({
        where: { id: createdAppointment.id },
        data: { emergencyCaseId: createdCase.id },
      });

      return createdCase;
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Atomic emergency registration failed:', error);
    res.status(500).json({ error: error?.message || 'Failed to register emergency case' });
  }
};

module.exports = {
  getAllEmergencyCases,
  getEmergencyCaseById,
  createEmergencyCase,
  updateEmergencyCase,
  deleteEmergencyCase,
  transferEmergencyCase,
  registerEmergencyCase,
};