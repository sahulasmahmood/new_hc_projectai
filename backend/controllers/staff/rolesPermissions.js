const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// GET all roles and permissions
const getRolesPermissions = async (req, res) => {
  try {
    const roles = await prisma.rolePermission.findMany({
      orderBy: {
        role: 'asc'
      }
    });

    res.json({ success: true, roles });
  } catch (error) {
    console.error('Error fetching roles and permissions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch roles and permissions' 
    });
  }
};

// POST - Create new role with permissions
const createRolePermission = async (req, res) => {
  try {
    const { role, permissions } = req.body;

    if (!role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Role name is required' 
      });
    }

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Permissions array is required' 
      });
    }

    const newRole = await prisma.rolePermission.create({
      data: { 
        role, 
        permissions: permissions 
      }
    });

    res.status(201).json({
      success: true,
      role: newRole,
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Error creating role:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Role name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create role'
    });
  }
};

// PUT - Update role with permissions
const updateRolePermission = async (req, res) => {
  try {
    const { id, role, permissions } = req.body;

    if (!id || !role) {
      return res.status(400).json({
        success: false,
        error: 'Role ID and name are required'
      });
    }

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Permissions array is required' 
      });
    }

    const updatedRole = await prisma.rolePermission.update({
      where: { id: parseInt(id) },
      data: { 
        role, 
        permissions: permissions 
      }
    });

    res.json({
      success: true,
      role: updatedRole,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Role name already exists'
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update role'
    });
  }
};

// DELETE - Delete role
const deleteRolePermission = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Role ID is required'
      });
    }

    await prisma.rolePermission.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete role'
    });
  }
};

module.exports = {
  getRolesPermissions,
  createRolePermission,
  updateRolePermission,
  deleteRolePermission
};