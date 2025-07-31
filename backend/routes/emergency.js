const express = require('express');
const router = express.Router();
const {
  getAllEmergencyCases,
  getEmergencyCaseById,
  createEmergencyCase,
  updateEmergencyCase,
  deleteEmergencyCase,
  transferEmergencyCase,
  registerEmergencyCase,
} = require('../controllers/emergency/emergency');

// Get all emergency cases
router.get('/', getAllEmergencyCases);

// Get emergency case by ID
router.get('/:id', getEmergencyCaseById);

// Create new emergency case
router.post('/', createEmergencyCase);

// Update emergency case
router.put('/:id', updateEmergencyCase);

// Transfer emergency case
router.put('/:id/transfer', transferEmergencyCase);

// Delete emergency case
router.delete('/:id', deleteEmergencyCase);

// Atomic registration: patient, appointment, emergency case
router.post('/register', registerEmergencyCase);

module.exports = router;