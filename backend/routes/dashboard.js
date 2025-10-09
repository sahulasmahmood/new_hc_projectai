const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAppointmentTrends,
  getPatientGrowth,
  getRevenueTrends,
  getTopMedicines,
  getRecentActivities,
  getLowStockAlerts,
  getExpiredItemsAlerts,
  getUpcomingAppointments
} = require('../controllers/dashboard');

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Trends and analytics
router.get('/appointment-trends', getAppointmentTrends);
router.get('/patient-growth', getPatientGrowth);
router.get('/revenue-trends', getRevenueTrends);
router.get('/top-medicines', getTopMedicines);

// Recent activities and alerts
router.get('/recent-activities', getRecentActivities);
router.get('/low-stock-alerts', getLowStockAlerts);
router.get('/expired-items-alerts', getExpiredItemsAlerts);
router.get('/upcoming-appointments', getUpcomingAppointments);

module.exports = router;