const { PrismaClient } = require('../../generated/prisma');
const { ensureRoleExists } = require('../../utils/initializeDefaults');
const prisma = new PrismaClient();

// GET all staff members with optional search and filter
const getAllStaff = async (req, res) => {
  try {
    const { search, department, role, status } = req.query;
    let where = {};

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    // Add department filter (now using departmentId)
    if (department && department !== 'all') {
      where.departmentId = parseInt(department);
    }

    // Add role filter
    if (role && role !== 'all') {
      where.role = role;
    }

    // Add status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    const staff = await prisma.staff.findMany({
      where,
      include: {
        department: true, // Include department details
        shiftTime: true   // Include shift details
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
};

// GET staff member by ID
const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await prisma.staff.findUnique({
      where: { id: parseInt(id) },
      include: {
        department: true, // Include department details
        shiftTime: true   // Include shift details
      }
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
};

// Function to generate employee ID
const generateEmployeeId = async () => {
  const count = await prisma.staff.count();
  const nextNumber = count + 1;
  const today = new Date();
  const datePrefix = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '');
  
  return `EMP-${datePrefix}-${nextNumber.toString().padStart(4, '0')}`;
};

// POST create new staff member
const createStaff = async (req, res) => {
  try {
    const {
      name,
      role,
      departmentId,
      shiftId,
      gender,
      dateOfBirth,
      dateOfHiring,
      qualification,
      registrationNumber,
      experience,
      phone,
      email,
      status,
      shift,
      weekOff,
      consultationFee,
      digitalSignature
    } = req.body;

    // Validate required fields
    if (!name || !role || !departmentId) {
      return res.status(400).json({
        error: 'Name, role, and department are required fields'
      });
    }

    // Validate department
    const finalDepartmentId = parseInt(departmentId);
    const department = await prisma.department.findUnique({
      where: { id: finalDepartmentId }
    });

    if (!department) {
      return res.status(400).json({
        error: 'Invalid department selected'
      });
    }

    // Ensure role exists in RolePermission (create if it's a default role)
    try {
      await ensureRoleExists(role);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid role selected'
      });
    }

    // Validate shift if provided
    if (shiftId) {
      const shiftExists = await prisma.shift.findUnique({
        where: { id: parseInt(shiftId) }
      });

      if (!shiftExists) {
        return res.status(400).json({
          error: 'Invalid shift selected'
        });
      }
    }

    // Generate employee ID
    const employeeId = await generateEmployeeId();

    // Create new staff member
    const staff = await prisma.staff.create({
      data: {
        employeeId,
        name,
        role,
        department: {
          connect: { id: finalDepartmentId }
        },
        shiftTime: shiftId ? {
          connect: { id: parseInt(shiftId) }
        } : undefined,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateOfHiring: dateOfHiring ? new Date(dateOfHiring) : null,
        qualification,
        registrationNumber,
        experience,
        phone,
        email,
        status: status || 'On Duty',
        weekOff,
        consultationFee,
        digitalSignature
      },
      include: {
        department: true,
        shiftTime: true
      }
    });

    res.status(201).json(staff);
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
};

// PUT update staff member
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      role,
      departmentId,
      shiftId,
      gender,
      dateOfBirth,
      dateOfHiring,
      qualification,
      registrationNumber,
      experience,
      phone,
      email,
      status,
      shift,
      weekOff,
      consultationFee,
      digitalSignature
    } = req.body;

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStaff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Handle department update if provided
    let finalDepartmentId = null;
    if (departmentId) {
      finalDepartmentId = parseInt(departmentId);
      
      // Validate department
      const department = await prisma.department.findUnique({
        where: { id: finalDepartmentId }
      });

      if (!department) {
        return res.status(400).json({
          error: 'Invalid department selected'
        });
      }
    }

    // Ensure role exists if provided (create if it's a default role)
    if (role) {
      try {
        await ensureRoleExists(role);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid role selected'
        });
      }
    }

    // Validate shift if provided
    if (shiftId) {
      const shiftExists = await prisma.shift.findUnique({
        where: { id: parseInt(shiftId) }
      });

      if (!shiftExists) {
        return res.status(400).json({
          error: 'Invalid shift selected'
        });
      }
    }

    // Update staff member
    const updatedStaff = await prisma.staff.update({
      where: { id: parseInt(id) },
      data: {
        name,
        role,
        department: finalDepartmentId ? {
          connect: { id: finalDepartmentId }
        } : undefined,
        shiftTime: shiftId ? {
          connect: { id: parseInt(shiftId) }
        } : undefined,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        dateOfHiring: dateOfHiring ? new Date(dateOfHiring) : undefined,
        qualification,
        registrationNumber,
        experience,
        phone,
        email,
        status,
        weekOff,
        consultationFee,
        digitalSignature
      },
      include: {
        department: true,
        shiftTime: true
      }
    });

    res.json(updatedStaff);
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
};

// DELETE staff member
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStaff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Delete staff member
    await prisma.staff.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
};

// GET all departments for dropdown
const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// GET all shifts for dropdown
const getShifts = async (req, res) => {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, shifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

// GET all roles for dropdown
const getRoles = async (req, res) => {
  try {
    const roles = await prisma.rolePermission.findMany({
      select: {
        id: true,
        role: true
      },
      orderBy: { role: 'asc' }
    });

    res.json({ success: true, roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getDepartments,
  getShifts,
  getRoles
};
