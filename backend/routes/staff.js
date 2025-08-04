const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/staff/staff');

// GET all staff members
router.get('/staff', getAllStaff);

// GET staff member by ID
router.get('/staff/:id', getStaffById);

// POST create new staff member
router.post('/staff', createStaff);

// PUT update staff member
router.put('/staff/:id', updateStaff);

// DELETE staff member
router.delete('/staff/:id', deleteStaff);

module.exports = router;
