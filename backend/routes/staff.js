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

// Roles and Permissions Routes (must come before /:id routes)
router.get('/roles-permissions', getRolesPermissions);
router.post('/roles-permissions', createRolePermission);
router.put('/roles-permissions', updateRolePermission);
router.delete('/roles-permissions', deleteRolePermission);

// Dropdown data routes (must come before /:id routes)
router.get('/departments', getDepartments);
router.get('/shifts', getShifts);
router.get('/roles', getRoles);

// GET all staff members
router.get('/', getAllStaff);

// GET staff member by ID
router.get('/:id', getStaffById);

// POST create new staff member
router.post('/', createStaff);

// PUT update staff member
router.put('/:id', updateStaff);

// DELETE staff member
router.delete('/:id', deleteStaff);

module.exports = router;
