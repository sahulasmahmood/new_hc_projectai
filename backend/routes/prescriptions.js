const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPatientPrescriptions,
  getPrescription,
  updatePrescription,
  deletePrescription,
  getDoctors
} = require('../controllers/prescriptions');

// GET /api/prescriptions/doctors - Get available doctors
router.get('/doctors', getDoctors);

// POST /api/prescriptions - Create new prescription
router.post('/', createPrescription);

// GET /api/prescriptions/patient/:patientId - Get prescriptions for a patient
router.get('/patient/:patientId', getPatientPrescriptions);

// GET /api/prescriptions/:id - Get single prescription
router.get('/:id', getPrescription);

// PUT /api/prescriptions/:id - Update prescription
router.put('/:id', updatePrescription);

// DELETE /api/prescriptions/:id - Delete prescription
router.delete('/:id', deletePrescription);

module.exports = router;