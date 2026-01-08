const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getDepartments,
  getShifts,
  getRoles
} = require('../controllers/staff/staff');

const {
  getRolesPermissions,
  createRolePermission,
  updateRolePermission,
  deleteRolePermission
} = require('../controllers/staff/rolesPermissions');

const {
  getStaffStatusHistory,
  overrideStatus,
  getStaffStatusSummary,
  triggerAutoUpdate
} = require('../controllers/staff/staffStatus');

// Roles and Permissions Routes (must come before /:id routes)
router.get('/roles-permissions', getRolesPermissions);
router.post('/roles-permissions', createRolePermission);
router.put('/roles-permissions', updateRolePermission);
router.delete('/roles-permissions', deleteRolePermission);

// Status tracking routes (must come before /:id routes)
router.get('/status-summary', getStaffStatusSummary);

// Dropdown data routes (must come before /:id routes)
router.get('/departments', getDepartments);
router.get('/shifts', getShifts);
router.get('/roles', getRoles);

// GET all staff members
router.get('/', getAllStaff);

// GET staff member by ID
router.get('/:id', getStaffById);

// Status routes for specific staff member
router.get('/:id/status-history', getStaffStatusHistory);
router.post('/:id/override-status', overrideStatus);
router.post('/:id/update-status-auto', triggerAutoUpdate);

// POST create new staff member
router.post('/', createStaff);

// PUT update staff member
router.put('/:id', updateStaff);

// DELETE staff member
router.delete('/:id', deleteStaff);

module.exports = router;
