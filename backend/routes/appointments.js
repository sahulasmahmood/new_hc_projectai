const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  rescheduleAppointment,
  swapAppointments
} = require('../controllers/appointments/appointments');

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

module.exports = router;
