const express = require('express');
const router = express.Router();
const {
  getVitalsSettings,
  getVitalsSettingByType,
  updateVitalsSettings,
  resetVitalsSettings
} = require('../controllers/settings/vitalsSettings');

// Get all vitals settings
router.get('/', getVitalsSettings);

// Get vitals setting by type
router.get('/:vitalType', getVitalsSettingByType);

// Update vitals setting
router.put('/:id', updateVitalsSettings);

// Reset to defaults
router.post('/reset', resetVitalsSettings);

module.exports = router;
