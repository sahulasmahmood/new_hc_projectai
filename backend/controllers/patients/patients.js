const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();      

// GET all patients with optional search
const getAllPatients = async (req, res) => {
  try {
    const { search, status } = req.query;
    let where = {};

    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { condition: { contains: search, mode: 'insensitive' } },
          { abhaId: { contains: search } },
          { phone: { contains: search } }
        ]
      };
    }

    if (status) {
      where.status = status;
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          take: 1
        },
        medicalReports: true
      }
    });

    // Format lastVisit from the most recent appointment
    const formattedPatients = patients.map(patient => ({
      ...patient,
      lastVisit: patient.appointments[0]?.date || null,
      appointments: undefined, // Remove appointments from response
      medicalReportCount: patient.medicalReports.length
    }));

    res.json(formattedPatients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

// GET patient by ID
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          take: 1
        },
        medicalReports: true
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Format patient data
    const formattedPatient = {
      ...patient,
      lastVisit: patient.appointments[0]?.date || null,
      appointments: undefined,
      medicalReportCount: patient.medicalReports.length
    };

    res.json(formattedPatient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
};

// POST create new patient
const createPatient = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      email,
      condition,
      allergies,
      emergencyContact,
      emergencyPhone,
      address,
      abhaId,
      createdFromEmergency = false
    } = req.body;

    // Validate required fields
    if (!name || !age || !gender || !phone) {
      return res.status(400).json({
        error: 'Missing required fields: name, age, gender, and phone are required'
      });
    }

    // Handle allergies - convert to array if it's a string
    let processedAllergies = [];
    if (allergies) {
      if (Array.isArray(allergies)) {
        processedAllergies = allergies;
      } else if (typeof allergies === 'string') {
        processedAllergies = allergies.split(',').map(a => a.trim()).filter(Boolean);
      }
    }

    // Generate visibleId (APL-00001 ... APL-99999, then APL-A-00001 ...)
    let prefix = "APL";
    let letter = null;
    let number = 1;
    // Find the highest existing visibleId with this prefix
    const lastPatient = await prisma.patient.findFirst({
      where: {
        visibleId: {
          startsWith: prefix
        }
      },
      orderBy: {
        visibleId: 'desc'
      }
    });
    if (lastPatient && lastPatient.visibleId) {
      // Match APL-00001 to APL-99999
      let match = lastPatient.visibleId.match(/^([A-Z]{3})-(\d{5})$/);
      if (match) {
        prefix = match[1];
        number = parseInt(match[2], 10) + 1;
        if (number > 99999) {
          number = 1;
          letter = 'A';
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
            if (letter === 'Z') {
              // If letter exceeds Z, increment the last letter of prefix
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

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        visibleId,
        name,
        age: parseInt(age),
        gender,
        phone,
        email,
        condition,
        allergies: processedAllergies,
        emergencyContact,
        emergencyPhone,
        address,
        abhaId,
        status: 'Active',
        createdFromEmergency
      }
    });

    // Handle multiple file uploads with notes/types
    if (req.files && req.files.length > 0) {
      // Notes may be a string (single) or array (multiple)
      let notes = req.body.medicalReportNotes || [];
      if (!Array.isArray(notes)) notes = [notes];
      for (let i = 0; i < req.files.length; i++) {
        await prisma.medicalReport.create({
          data: {
            filePath: req.files[i].path.replace(/\\/g, '/'),
            patientId: patient.id,
            description: notes[i] || null
          }
        });
      }
    }

    // Return patient with report count
    const patientWithReports = await prisma.patient.findUnique({
      where: { id: patient.id },
      include: { medicalReports: true }
    });
    res.status(201).json({
      ...patientWithReports,
      medicalReportCount: patientWithReports.medicalReports.length
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'ABHA ID must be unique' });
    }
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

// PUT update patient
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      age,
      gender,
      phone,
      email,
      condition,
      allergies,
      emergencyContact,
      emergencyPhone,
      address,
      status
    } = req.body;

    // Handle allergies - convert to array if it's a string
    let processedAllergies = [];
    if (allergies) {
      if (Array.isArray(allergies)) {
        processedAllergies = allergies;
      } else if (typeof allergies === 'string') {
        processedAllergies = allergies.split(',').map(a => a.trim()).filter(Boolean);
      }
    }

    // Prepare update data
    const updateData = {
      name,
      age: age ? parseInt(age) : undefined,
      gender,
      phone,
      email,
      condition,
      allergies: processedAllergies,
      emergencyContact,
      emergencyPhone,
      address,
      status
    };

    // Update patient info
    const updatedPatient = await prisma.patient.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Handle multiple file uploads with notes/types
    if (req.files && req.files.length > 0) {
      let notes = req.body.medicalReportNotes || [];
      if (!Array.isArray(notes)) notes = [notes];
      for (let i = 0; i < req.files.length; i++) {
        await prisma.medicalReport.create({
          data: {
            filePath: req.files[i].path.replace(/\\/g, '/'),
            patientId: updatedPatient.id,
            description: notes[i] || null
          }
        });
      }
    }

    // Return patient with report count
    const patientWithReports = await prisma.patient.findUnique({
      where: { id: updatedPatient.id },
      include: { medicalReports: true }
    });
    res.json({
      ...patientWithReports,
      medicalReportCount: patientWithReports.medicalReports.length
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

// DELETE patient
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.patient.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting patient:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(500).json({ error: 'Failed to delete patient' });
  }
};

// PATCH update ABHA verification status
const updateABHAStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { abhaId, verified } = req.body;

    const updatedPatient = await prisma.patient.update({
      where: { id: parseInt(id) },
      data: {
        abhaId,
        abhaVerified: verified
      }
    });

    res.json(updatedPatient);
  } catch (error) {
    console.error('Error updating ABHA status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(500).json({ error: 'Failed to update ABHA status' });
  }
};

// Add this route before :id route
const getPatientByPhone = async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: "Phone number required" });

  const patients = await prisma.patient.findMany({ where: { phone } });
  if (!patients || patients.length === 0) return res.status(404).json({ error: "Patient not found" });

  res.json(patients);
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  updateABHAStatus,
  getPatientByPhone
};
