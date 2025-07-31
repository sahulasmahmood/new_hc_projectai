const express = require('express');
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  updateABHAStatus,
  getPatientByPhone
} = require('../controllers/patients/patients');
const upload = require('../utils/upload');

// Get all patients with optional search
router.get('/', getAllPatients);

// Get patient by phone
router.get('/search/by-phone', getPatientByPhone);

// Get patient by ID
router.get('/:id', getPatientById);

// Create new patient
router.post('/', upload.array('medicalReports'), createPatient);

// Update patient
router.put('/:id', upload.array('medicalReports'), updatePatient);

// Delete patient
router.delete('/:id', deletePatient);

// Update ABHA verification status
router.patch('/:id/abha-status', updateABHAStatus);

module.exports = router;
