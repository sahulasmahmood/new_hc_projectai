const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Get all doctors from staff table
router.get('/', async (req, res) => {
  try {
    const doctors = await prisma.staff.findMany({
      where: {
        role: {
          contains: 'Doctor',
          mode: 'insensitive'
        },
        // Only include on-duty doctors (handle both "Active" and "On Duty" status)
        OR: [
          { status: 'Active' },
          { status: 'On Duty' }
        ]
      },
      select: {
        id: true,
        name: true,
        qualification: true,
        digitalSignature: true,
        registrationNumber: true,
        consultationFee: true,
        status: true,
        department: {
          select: {
            name: true
          }
        }
      }
    });

    // Format the response
    // Note: Time slots come from appointment settings, not doctor-specific
    // All doctors share the same time slots for now
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      name: doctor.name,
      specialization: doctor.department?.name || 'General Medicine',
      qualification: doctor.qualification,
      registrationNumber: doctor.registrationNumber,
      consultationFee: doctor.consultationFee,
      digitalSignature: doctor.digitalSignature,
      status: doctor.status
    }));

    res.json(formattedDoctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id);
    const doctor = await prisma.staff.findFirst({
      where: {
        id: doctorId,
        role: {
          contains: 'Doctor',
          mode: 'insensitive'
        },
        OR: [
          { status: 'Active' },
          { status: 'On Duty' }
        ]
      },
      select: {
        id: true,
        name: true,
        qualification: true,
        digitalSignature: true,
        registrationNumber: true,
        consultationFee: true,
        status: true,
        department: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found or not available' });
    }
    
    const formattedDoctor = {
      id: doctor.id,
      name: doctor.name,
      specialization: doctor.department?.name || 'General Medicine',
      qualification: doctor.qualification,
      registrationNumber: doctor.registrationNumber,
      consultationFee: doctor.consultationFee,
      digitalSignature: doctor.digitalSignature,
      status: doctor.status
    };
    
    res.json(formattedDoctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

// Get time slots for a specific doctor
router.get('/:id/timeslots', async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id);
    const doctor = await prisma.staff.findFirst({
      where: {
        id: doctorId,
        role: {
          contains: 'Doctor',
          mode: 'insensitive'
        },
        OR: [
          { status: 'Active' },
          { status: 'On Duty' }
        ]
      },
      select: {
        id: true
      }
    });
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found or not available' });
    }
    
    // Get dynamic time slots from appointment settings
    const appointmentSettings = await prisma.appointmentSettings.findFirst();
    let timeSlots = [];
    
    if (appointmentSettings && appointmentSettings.timeSlots) {
      const slotsData = appointmentSettings.timeSlots;
      if (Array.isArray(slotsData)) {
        timeSlots = slotsData
          .filter(slot => slot.isActive)
          .map(slot => slot.time);
      }
    }
    
    // No fallback - return only dynamic time slots
    
    res.json({ timeSlots });
  } catch (error) {
    console.error('Error fetching doctor time slots:', error);
    res.status(500).json({ error: 'Failed to fetch doctor time slots' });
  }
});

module.exports = router;