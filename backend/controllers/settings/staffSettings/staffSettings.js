/* const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient(); */

// ============================================================================
// LEGACY CODE - COMMENTED OUT
// ============================================================================
// The following functions were used with the old StaffSettings table which 
// stored roles, departments, and shifts as JSON arrays. This table was dropped
// in favor of dedicated Department, Shift, and RolePermission tables.
// 
// Current system uses:
// - backend/controllers/settings/staffSettings/departments.js for departments
// - backend/controllers/settings/staffSettings/shifts.js for shifts  
// - backend/controllers/staff/rolesPermissions.js for roles
// ============================================================================

/*
// GET staff settings
const getStaffSettings = async (req, res) => {
  try {
    const settings = await prisma.staffSettings.findFirst();
    res.json(settings || { roles: [], departments: [], shifts: [] });
  } catch (error) {
    console.error('Error fetching staff settings:', error);
    res.status(500).json({ error: 'Failed to fetch staff settings' });
  }
};

// Update staff settings
const updateStaffSettings = async (req, res) => {
  try {
    const { roles, departments, shifts } = req.body;

    // Validate input
    if (!Array.isArray(roles) || !Array.isArray(departments) || !Array.isArray(shifts)) {
      return res.status(400).json({ 
        error: 'Invalid input. Roles, departments, and shifts must be arrays.' 
      });
    }

    // Get existing settings or create new
    const existingSettings = await prisma.staffSettings.findFirst();

    if (existingSettings) {
      // Update existing settings
      const settings = await prisma.staffSettings.update({
        where: { id: existingSettings.id },
        data: { roles, departments, shifts }
      });
      res.json(settings);
    } else {
      // Create new settings
      const settings = await prisma.staffSettings.create({
        data: { roles, departments, shifts }
      });
      res.json(settings);
    }
  } catch (error) {
    console.error('Error updating staff settings:', error);
    res.status(500).json({ error: 'Failed to update staff settings' });
  }
};

// Add new role
const addRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const settings = await prisma.staffSettings.findFirst();
    
    if (settings) {
      const updatedSettings = await prisma.staffSettings.update({
        where: { id: settings.id },
        data: {
          roles: {
            push: role
          }
        }
      });
      res.json(updatedSettings);
    } else {
      const newSettings = await prisma.staffSettings.create({
        data: {
          roles: [role],
          departments: [],
          shifts: []
        }
      });
      res.json(newSettings);
    }
  } catch (error) {
    console.error('Error adding role:', error);
    res.status(500).json({ error: 'Failed to add role' });
  }
};

// Add new department
const addDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    
    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }

    const settings = await prisma.staffSettings.findFirst();
    
    if (settings) {
      const updatedSettings = await prisma.staffSettings.update({
        where: { id: settings.id },
        data: {
          departments: {
            push: department
          }
        }
      });
      res.json(updatedSettings);
    } else {
      const newSettings = await prisma.staffSettings.create({
        data: {
          roles: [],
          departments: [department],
          shifts: []
        }
      });
      res.json(newSettings);
    }
  } catch (error) {
    console.error('Error adding department:', error);
    res.status(500).json({ error: 'Failed to add department' });
  }
};

// Add new shift
const addShift = async (req, res) => {
  try {
    const { shift } = req.body;
    
    if (!shift) {
      return res.status(400).json({ error: 'Shift is required' });
    }

    const settings = await prisma.staffSettings.findFirst();
    
    if (settings) {
      const updatedSettings = await prisma.staffSettings.update({
        where: { id: settings.id },
        data: {
          shifts: {
            push: shift
          }
        }
      });
      res.json(updatedSettings);
    } else {
      const newSettings = await prisma.staffSettings.create({
        data: {
          roles: [],
          departments: [],
          shifts: [shift]
        }
      });
      res.json(newSettings);
    }
  } catch (error) {
    console.error('Error adding shift:', error);
    res.status(500).json({ error: 'Failed to add shift' });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const settings = await prisma.staffSettings.findFirst();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const updatedSettings = await prisma.staffSettings.update({
      where: { id: settings.id },
      data: {
        roles: settings.roles.filter(r => r !== role)
      }
    });
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    
    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }

    const settings = await prisma.staffSettings.findFirst();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const updatedSettings = await prisma.staffSettings.update({
      where: { id: settings.id },
      data: {
        departments: settings.departments.filter(d => d !== department)
      }
    });
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

// Delete shift
const deleteShift = async (req, res) => {
  try {
    const { shift } = req.body;
    
    if (!shift) {
      return res.status(400).json({ error: 'Shift is required' });
    }

    const settings = await prisma.staffSettings.findFirst();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const updatedSettings = await prisma.staffSettings.update({
      where: { id: settings.id },
      data: {
        shifts: settings.shifts.filter(s => s !== shift)
      }
    });
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
};
*/

// ============================================================================
// ACTIVE CODE - Currently Used
// ============================================================================
// This file is kept for potential future use or backward compatibility
// All staff settings functionality has been moved to dedicated controllers:
// - Departments: backend/controllers/settings/staffSettings/departments.js
// - Shifts: backend/controllers/settings/staffSettings/shifts.js
// - Roles: backend/controllers/staff/rolesPermissions.js
// ============================================================================

module.exports = {
  // All functions commented out - using dedicated controllers instead
  // getStaffSettings,
  // updateStaffSettings,
  // addRole,
  // addDepartment,
  // addShift,
  // deleteRole,
  // deleteDepartment,
  // deleteShift
};
