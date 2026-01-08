const express = require('express');
const router = express.Router();
const {
  getGstRates,
  getActiveGstRates,
  createGstRate,
  updateGstRate,
  deleteGstRate,
  toggleGstRateStatus,
  getGstCategories,
  createGstCategory,
  updateGstCategory,
  deleteGstCategory,
  restoreGstCategory
} = require('../controllers/gst');

// Get all GST rates
router.get('/', getGstRates);

// Get active GST rates only
router.get('/active', getActiveGstRates);

// Create new GST rate
router.post('/', createGstRate);

// Update GST rate
router.put('/:id', updateGstRate);

// Delete GST rate
router.delete('/:id', deleteGstRate);

// Toggle GST rate active status
router.patch('/:id/toggle-status', toggleGstRateStatus);

// GST Categories routes
router.get('/categories', getGstCategories);
router.post('/categories', createGstCategory);
router.put('/categories/:id', updateGstCategory);
router.delete('/categories/:id', deleteGstCategory);
router.patch('/categories/:id/restore', restoreGstCategory);

module.exports = router;