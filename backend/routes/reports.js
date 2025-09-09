const express = require('express');
const router = express.Router();
const {
  getPrescriptionsReport,
  getAppointmentsReport,
  getSummaryMetrics,
  exportPrescriptionsReport,
  exportAppointmentsReport
} = require('../controllers/reports/reports');

// GET /api/reports/prescriptions - Get prescriptions by date (with pagination)
router.get('/prescriptions', getPrescriptionsReport);

// GET /api/reports/appointments - Get appointments by date (with pagination)
router.get('/appointments', getAppointmentsReport);

// GET /api/reports/summary - Get summary metrics
router.get('/summary', getSummaryMetrics);

// GET /api/reports/prescriptions/export - Export prescriptions report (PDF/CSV)
router.get('/prescriptions/export', exportPrescriptionsReport);

// GET /api/reports/appointments/export - Export appointments report (PDF/CSV)
router.get('/appointments/export', exportAppointmentsReport);

module.exports = router;
