const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Helper function to prepare vitals data
const prepareVitalsData = (data) => {
  const {
    patientId,
    appointmentId,
    bloodPressureSys,
    bloodPressureDia,
    heartRate,
    temperature,
    respiratoryRate,
    oxygenSaturation,
    weight,
    height,
    recordedBy,
    notes
  } = data;

  return {
    patientId: patientId ? parseInt(patientId) : undefined,
    appointmentId: appointmentId ? parseInt(appointmentId) : null,
    bloodPressureSys: bloodPressureSys ? parseInt(bloodPressureSys) : null,
    bloodPressureDia: bloodPressureDia ? parseInt(bloodPressureDia) : null,
    heartRate: heartRate ? parseInt(heartRate) : null,
    temperature: temperature ? parseFloat(temperature) : null,
    respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
    oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
    weight: weight ? parseFloat(weight) : null,
    height: height ? parseFloat(height) : null,
    recordedBy: recordedBy || 'Doctor',
    notes: notes || null
  };
};

// Create or update vitals record (upsert)
const createVitals = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      bloodPressureSys,
      bloodPressureDia,
      heartRate,
      temperature,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
      recordedBy,
      notes
    } = req.body;

    // Validate required fields
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    // Validate that patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) }
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // If appointmentId is provided, validate that appointment exists and belongs to the patient
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: parseInt(appointmentId) }
      });
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      if (appointment.patientId !== parseInt(patientId)) {
        return res.status(400).json({ error: 'Appointment does not belong to the specified patient' });
      }
    }

    const vitalData = prepareVitalsData(req.body);

    // Use upsert to either create new or update existing vitals for this patient/appointment
    const vitals = await prisma.patientVitals.upsert({
      where: {
        unique_patient_appointment_vitals: {
          patientId: parseInt(patientId),
          appointmentId: appointmentId ? parseInt(appointmentId) : null
        }
      },
      update: {
        ...vitalData,
        updatedAt: new Date()
      },
      create: vitalData,
      include: {
        patient: {
          select: {
            name: true,
            visibleId: true
          }
        },
        appointment: {
          select: {
            date: true,
            time: true,
            type: true
          }
        }
      }
    });

    res.status(200).json({
      ...vitals,
      message: vitals.createdAt === vitals.updatedAt ? 'Vitals created successfully' : 'Vitals updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating vitals:', error);
    res.status(500).json({ error: 'Failed to create or update vitals record' });
  }
};

// Get vitals for a patient
const getPatientVitals = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 10 } = req.query;

    const vitals = await prisma.patientVitals.findMany({
      where: { patientId: parseInt(patientId) },
      include: {
        appointment: {
          select: {
            date: true,
            time: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(vitals);
  } catch (error) {
    console.error('Error fetching vitals:', error);
    res.status(500).json({ error: 'Failed to fetch vitals' });
  }
};

// Get vitals for a specific patient and appointment
const getVitalsByAppointment = async (req, res) => {
  try {
    const { patientId, appointmentId } = req.params;

    const vitals = await prisma.patientVitals.findUnique({
      where: {
        unique_patient_appointment_vitals: {
          patientId: parseInt(patientId),
          appointmentId: appointmentId ? parseInt(appointmentId) : null
        }
      },
      include: {
        patient: {
          select: {
            name: true,
            visibleId: true
          }
        },
        appointment: {
          select: {
            date: true,
            time: true,
            type: true
          }
        }
      }
    });

    if (!vitals) {
      return res.status(404).json({ error: 'No vitals found for this patient and appointment' });
    }

    res.json(vitals);
  } catch (error) {
    console.error('Error fetching vitals by appointment:', error);
    res.status(500).json({ error: 'Failed to fetch vitals for appointment' });
  }
};

// Get single vitals record
const getVitals = async (req, res) => {
  try {
    const { id } = req.params;

    const vitals = await prisma.patientVitals.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: {
          select: {
            name: true,
            visibleId: true
          }
        },
        appointment: {
          select: {
            date: true,
            time: true,
            type: true
          }
        }
      }
    });

    if (!vitals) {
      return res.status(404).json({ error: 'Vitals record not found' });
    }

    res.json(vitals);
  } catch (error) {
    console.error('Error fetching vitals:', error);
    res.status(500).json({ error: 'Failed to fetch vitals record' });
  }
};

// Update vitals record
const updateVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bloodPressureSys,
      bloodPressureDia,
      heartRate,
      temperature,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
      recordedBy,
      notes
    } = req.body;

    // Prepare update data using helper function
    const updateData = prepareVitalsData(req.body);
    delete updateData.patientId; // Don't update patientId
    delete updateData.appointmentId; // Don't update appointmentId

    const vitals = await prisma.patientVitals.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: {
          select: {
            name: true,
            visibleId: true
          }
        },
        appointment: {
          select: {
            date: true,
            time: true,
            type: true
          }
        }
      }
    });

    res.json(vitals);
  } catch (error) {
    console.error('Error updating vitals:', error);
    res.status(500).json({ error: 'Failed to update vitals record' });
  }
};

// Delete vitals record
const deleteVitals = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.patientVitals.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting vitals:', error);
    res.status(500).json({ error: 'Failed to delete vitals record' });
  }
};

module.exports = {
  createVitals,
  getPatientVitals,
  getVitalsByAppointment,
  getVitals,
  updateVitals,
  deleteVitals
};