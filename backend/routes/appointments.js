const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  rescheduleAppointment,
  swapAppointments,
  validateConsultationStartTiming,
  startConsultation
} = require('../controllers/appointments/appointments');
const { checkSlotAvailability } = require('../controllers/appointments/availability');

// Get all appointments
router.get('/appointments', getAllAppointments);

// Get single appointment
router.get('/appointments/:id', getAppointment);

// Create new appointment
router.post('/appointments', createAppointment);

// Update appointment
router.put('/appointments/:id', updateAppointment);

// Reschedule appointment
router.patch('/appointments/:id/reschedule', rescheduleAppointment);

// Swap appointments
router.post('/appointments/swap', swapAppointments);

// Delete appointment
router.delete('/appointments/:id', deleteAppointment);

// Check slot availability
router.post('/appointments/check-availability', checkSlotAvailability);

// Validate consultation start timing
router.get('/appointments/:id/validate-start', validateConsultationStartTiming);

// Start consultation with proper time handling
router.post('/appointments/:id/start-consultation', startConsultation);

module.exports = router;
