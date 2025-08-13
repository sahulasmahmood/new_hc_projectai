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
const medicinesRouter = require('./medicines');
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
router.use('/medicines', medicinesRouter);
/* router.use('/settings/categories', categoriesRouter);
router.use('/settings/suppliers', suppliersRouter); */

module.exports = router;
