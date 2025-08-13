const express = require('express');
const router = express.Router();
const {
  createVitals,
  getPatientVitals,
  getVitalsByAppointment,
  getVitals,
  updateVitals,
  deleteVitals
} = require('../controllers/vitals');

// POST /api/vitals - Create new vitals record
router.post('/', createVitals);

// GET /api/vitals/patient/:patientId - Get vitals for a patient
router.get('/patient/:patientId', getPatientVitals);

// GET /api/vitals/patient/:patientId/appointment/:appointmentId - Get vitals for specific appointment
router.get('/patient/:patientId/appointment/:appointmentId', getVitalsByAppointment);

// GET /api/vitals/:id - Get single vitals record
router.get('/:id', getVitals);

// PUT /api/vitals/:id - Update vitals record
router.put('/:id', updateVitals);

// DELETE /api/vitals/:id - Delete vitals record
router.delete('/:id', deleteVitals);

module.exports = router;