const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();

// GET all shifts
const getShifts = async (req, res) => {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ success: true, shifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch shifts' 
    });
  }
};

// POST - Create new shift
const createShift = async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields (name, startTime, endTime) are required' 
      });
    }

    const newShift = await prisma.shift.create({
      data: { 
        name, 
        startTime, 
        endTime
      }
    });

    res.status(201).json({
      success: true,
      shift: newShift,
      message: 'Shift created successfully'
    });
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create shift'
    });
  }
};

// PUT - Update shift
const updateShift = async (req, res) => {
  try {
    const { id, name, startTime, endTime } = req.body;

    if (!id || !name || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'All fields (id, name, startTime, endTime) are required'
      });
    }

    const updatedShift = await prisma.shift.update({
      where: { id: parseInt(id) },
      data: { name, startTime, endTime }
    });

    res.json({
      success: true,
      shift: updatedShift,
      message: 'Shift updated successfully'
    });
  } catch (error) {
    console.error('Error updating shift:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Shift not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update shift'
    });
  }
};

// DELETE - Delete shift
const deleteShift = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Shift ID is required'
      });
    }

    await prisma.shift.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shift:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Shift not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete shift'
    });
  }
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift
};