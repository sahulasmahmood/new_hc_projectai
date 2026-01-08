const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();

// GET all departments
const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            staff: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ success: true, departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch departments' 
    });
  }
};

// POST - Create new department
const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Department name is required' 
      });
    }

    const newDepartment = await prisma.department.create({
      data: { name },
      include: {
        _count: {
          select: {
            staff: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      department: newDepartment,
      message: 'Department created successfully'
    });
  } catch (error) {
    console.error('Error creating department:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Department name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create department'
    });
  }
};

// PUT - Update department
const updateDepartment = async (req, res) => {
  try {
    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        error: 'Department ID and name are required'
      });
    }

    const updatedDepartment = await prisma.department.update({
      where: { id: parseInt(id) },
      data: { name },
      include: {
        _count: {
          select: {
            staff: true
          }
        }
      }
    });

    res.json({
      success: true,
      department: updatedDepartment,
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Error updating department:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Department name already exists'
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update department'
    });
  }
};

// DELETE - Delete department
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Department ID is required'
      });
    }

    // Check if department has staff members
    const staffCount = await prisma.staff.count({
      where: { departmentId: parseInt(id) }
    });

    if (staffCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department. It has ${staffCount} staff member(s) assigned.`
      });
    }

    await prisma.department.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete department'
    });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};