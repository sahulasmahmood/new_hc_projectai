const express = require('express');
const router = express.Router();

// Legacy staffSettings functions are commented out - using dedicated controllers instead
// const {
//   getStaffSettings,
//   updateStaffSettings,
//   addRole
// } = require('../controllers/settings/staffSettings/staffSettings');

const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment: deleteDepartmentNew
} = require('../controllers/settings/staffSettings/departments');

const {
  getShifts,
  createShift,
  updateShift,
  deleteShift: deleteShiftNew
} = require('../controllers/settings/staffSettings/shifts');

const {
  getHospitalSettings,
  saveHospitalSettings,
} = require('../controllers/settings/hospitalSettings/hospitalSettings');


const {
  getAppointmentSettings,
  saveAppointmentSettings,
} = require('../controllers/settings/appointmentSettings/appointmentSettings');

const {
  getEmailConfig,
  updateEmailConfig,
  testEmailConfig,
} = require('../controllers/settings/emailConfiguration/emailConfiguration');


const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory
} = require('../controllers/settings/inventorySettings/categories');


const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  restoreSupplier
} = require('../controllers/settings/inventorySettings/suppliers');

// Legacy Staff Settings Routes - COMMENTED OUT (using dedicated controllers instead)
// router.get('/staff-settings', getStaffSettings);
// router.post('/staff-settings', updateStaffSettings);
// router.post('/staff-settings/roles', addRole);

// Department Routes
router.get('/staff-settings/departments', getDepartments);
router.post('/staff-settings/departments', createDepartment);
router.put('/staff-settings/departments', updateDepartment);
router.delete('/staff-settings/departments', deleteDepartmentNew);

// Shift Routes
router.get('/staff-settings/shifts', getShifts);
router.post('/staff-settings/shifts', createShift);
router.put('/staff-settings/shifts', updateShift);
router.delete('/staff-settings/shifts', deleteShiftNew);

router.get('/hospital-settings', getHospitalSettings);
router.post('/hospital-settings', saveHospitalSettings);


// GET email config
router.get('/email-configuration', getEmailConfig);
// POST/PUT email config
router.post('/email-configuration', updateEmailConfig);
// PUT for test email
router.put('/email-configuration', testEmailConfig);


router.get('/appointment-settings', getAppointmentSettings);
router.post('/appointment-settings', saveAppointmentSettings);


// GET all categories
router.get('/categories', getAllCategories);

// GET category by ID
router.get('/categories/:id', getCategoryById);

// POST create new category
router.post('/categories', createCategory);

// PUT update category
router.put('/categories/:id', updateCategory);

// DELETE category
router.delete('/categories/:id', deleteCategory);

// PATCH restore category
router.patch('/categories/:id/restore', restoreCategory);


// GET all suppliers
router.get('/suppliers', getAllSuppliers);

// GET supplier by ID
router.get('/suppliers/:id', getSupplierById);

// POST create new supplier
router.post('/suppliers', createSupplier);

// PUT update supplier
router.put('/suppliers/:id', updateSupplier);

// DELETE supplier
router.delete('/suppliers/:id', deleteSupplier);

// PATCH restore supplier
router.patch('/suppliers/:id/restore', restoreSupplier);



module.exports = router;