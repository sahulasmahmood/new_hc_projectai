const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();

// GET all suppliers (optionally include inactive)
const getAllSuppliers = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const suppliers = await prisma.supplier.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

// GET supplier by ID
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
};

// POST create new supplier
const createSupplier = async (req, res) => {
  try {
    const { 
      name, 
      contactPerson, 
      email, 
      phone, 
      address, 
      website, 
      notes 
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    // Check if active supplier already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: { name, isActive: true }
    });

    if (existingSupplier) {
      return res.status(400).json({ error: 'Supplier with this name already exists' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        website,
        notes,
        isActive: true
      }
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

// PUT update supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      contactPerson, 
      email, 
      phone, 
      address, 
      website, 
      notes, 
      isActive 
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if new name conflicts with another active supplier
    if (name !== existingSupplier.name) {
      const nameConflict = await prisma.supplier.findFirst({
        where: { name, isActive: true }
      });
      if (nameConflict) {
        return res.status(400).json({ error: 'Supplier with this name already exists' });
      }
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        website,
        notes,
        isActive: isActive !== undefined ? isActive : existingSupplier.isActive
      }
    });

    res.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

// DELETE supplier (soft delete)
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if supplier is being used by any inventory items
    const itemsUsingSupplier = await prisma.inventoryItem.findFirst({
      where: { supplier: existingSupplier.name }
    });

    if (itemsUsingSupplier) {
      return res.status(400).json({ 
        error: 'Cannot delete supplier. It is being used by inventory items.' 
      });
    }

    // Soft delete by setting isActive to false
    await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
};

// PATCH restore supplier
const restoreSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) }
    });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    // Check for active duplicate
    const activeDuplicate = await prisma.supplier.findFirst({
      where: { name: supplier.name, isActive: true }
    });
    if (activeDuplicate) {
      return res.status(400).json({ error: 'An active supplier with this name already exists' });
    }
    const restored = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { isActive: true }
    });
    res.json(restored);
  } catch (error) {
    console.error('Error restoring supplier:', error);
    res.status(500).json({ error: 'Failed to restore supplier' });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  restoreSupplier
}; 