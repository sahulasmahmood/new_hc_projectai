const { PrismaClient } = require('../../generated/prisma');
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

    // Add department filter
    if (department && department !== 'all') {
      where.department = department;
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
      where: { id: parseInt(id) }
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

// POST create new staff member
const createStaff = async (req, res) => {
  try {
    const {
      name,
      role,
      department,
      qualification,
      experience,
      phone,
      email,
      status,
      shift,
      consultationFee
    } = req.body;

    // Validate required fields
    if (!name || !role || !department) {
      return res.status(400).json({
        error: 'Name, role, and department are required fields'
      });
    }

    // Create new staff member
    const staff = await prisma.staff.create({
      data: {
        name,
        role,
        department,
        qualification,
        experience,
        phone,
        email,
        status: status || 'On Duty',
        shift,
        consultationFee
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
      department,
      qualification,
      experience,
      phone,
      email,
      status,
      shift,
      consultationFee
    } = req.body;

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStaff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Update staff member
    const updatedStaff = await prisma.staff.update({
      where: { id: parseInt(id) },
      data: {
        name,
        role,
        department,
        qualification,
        experience,
        phone,
        email,
        status,
        shift,
        consultationFee
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

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff
};
