const express = require('express');
const router = express.Router();
const appointmentsRouter = require('./appointments');
const patientsRouter = require('./patients');
const settingsRouter = require('./settings');
// const hospitalSettingsRouter = require('./hospitalSettings');
const emergencyRouter = require('./emergency');
const inventoryRouter = require('./inventory');
const aiRouter = require('./ai');
const staffRouter = require('./staff');
const prescriptionsRouter = require('./prescriptions');
const vitalsRouter = require('./vitals');
const vitalsSettingsRouter = require('./vitalsSettings');
const medicinesRouter = require('./medicines');
const reportsRouter = require('./reports');
const billingRouter = require("./billing")
const gstRouter = require('./gst');
const dashboardRouter = require('./dashboard');
const doctorsRouter = require('./doctors');
/* const categoriesRouter = require('./categories');
const suppliersRouter = require('./suppliers'); */

// Use appointments routes
router.use('/', appointmentsRouter);
router.use('/patients', patientsRouter);
router.use('/settings', settingsRouter);
/* router.use('/', hospitalSettingsRouter); */
router.use('/emergency', emergencyRouter);
router.use('/inventory', inventoryRouter);
router.use('/ai', aiRouter);
router.use('/staff', staffRouter);
router.use('/prescriptions', prescriptionsRouter);
router.use('/vitals', vitalsRouter);
router.use('/vitals-settings', vitalsSettingsRouter);
router.use('/medicines', medicinesRouter);
router.use('/reports', reportsRouter);
router.use("/billing", billingRouter)
router.use('/gst', gstRouter);
router.use('/dashboard', dashboardRouter);
router.use('/doctors', doctorsRouter);
/* router.use('/settings/categories', categoriesRouter);
router.use('/settings/suppliers', suppliersRouter); */

module.exports = router;
