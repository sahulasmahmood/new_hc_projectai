const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Get all GST rates
const getGstRates = async (req, res) => {
  try {
    const gstRates = await prisma.gstRate.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(gstRates);
  } catch (error) {
    console.error('Error fetching GST rates:', error);
    res.status(500).json({ error: 'Failed to fetch GST rates' });
  }
};

// Get active GST rates only
const getActiveGstRates = async (req, res) => {
  try {
    const gstRates = await prisma.gstRate.findMany({
      where: { isActive: true },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(gstRates);
  } catch (error) {
    console.error('Error fetching active GST rates:', error);
    res.status(500).json({ error: 'Failed to fetch active GST rates' });
  }
};

// Create new GST rate
const createGstRate = async (req, res) => {
  try {
    const { name, rate, description, categoryId } = req.body;

    // Validate required fields
    if (!name || rate === undefined || rate === null) {
      return res.status(400).json({ error: 'Name and rate are required' });
    }

    // Validate rate is a valid number
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'Rate must be a valid number between 0 and 100' });
    }

    // Validate category if provided
    if (categoryId && isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const gstRate = await prisma.gstRate.create({
      data: {
        name: name.trim(),
        rate: parseFloat(rate),
        description: description?.trim() || null,
        categoryId: categoryId ? parseInt(categoryId) : null
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    res.status(201).json(gstRate);
  } catch (error) {
    console.error('Error creating GST rate:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'GST rate with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create GST rate' });
    }
  }
};

// Update GST rate
const updateGstRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rate, description, categoryId, isActive } = req.body;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid GST rate ID is required' });
    }

    // Validate rate if provided
    if (rate !== undefined && (isNaN(rate) || rate < 0 || rate > 100)) {
      return res.status(400).json({ error: 'Rate must be a valid number between 0 and 100' });
    }

    // Validate category if provided
    if (categoryId !== undefined && categoryId !== null && isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    // Check if GST rate exists
    const existingGstRate = await prisma.gstRate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingGstRate) {
      return res.status(404).json({ error: 'GST rate not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (rate !== undefined) updateData.rate = parseFloat(rate);
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const gstRate = await prisma.gstRate.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    res.json(gstRate);
  } catch (error) {
    console.error('Error updating GST rate:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'GST rate with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update GST rate' });
    }
  }
};

// Delete GST rate
const deleteGstRate = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid GST rate ID is required' });
    }

    // Check if GST rate exists
    const existingGstRate = await prisma.gstRate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingGstRate) {
      return res.status(404).json({ error: 'GST rate not found' });
    }

    // Check if GST rate is being used in any bill items
    const billItemsCount = await prisma.billItem.count({
      where: { gstRateId: parseInt(id) }
    });

    if (billItemsCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete GST rate. It is being used in ${billItemsCount} bill item(s). You can deactivate it instead.` 
      });
    }

    await prisma.gstRate.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'GST rate deleted successfully' });
  } catch (error) {
    console.error('Error deleting GST rate:', error);
    res.status(500).json({ error: 'Failed to delete GST rate' });
  }
};

// Toggle GST rate active status
const toggleGstRateStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid GST rate ID is required' });
    }

    // Check if GST rate exists
    const existingGstRate = await prisma.gstRate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingGstRate) {
      return res.status(404).json({ error: 'GST rate not found' });
    }

    const gstRate = await prisma.gstRate.update({
      where: { id: parseInt(id) },
      data: { isActive: !existingGstRate.isActive }
    });

    res.json(gstRate);
  } catch (error) {
    console.error('Error toggling GST rate status:', error);
    res.status(500).json({ error: 'Failed to toggle GST rate status' });
  }
};

// GST Categories Management

// Get all GST categories
const getGstCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    const where = {};
    if (!includeInactive || includeInactive !== 'true') {
      where.isActive = true;
    }

    const categories = await prisma.gstCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { gstRates: true }
        }
      }
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching GST categories:', error);
    res.status(500).json({ error: 'Failed to fetch GST categories' });
  }
};

// Create new GST category
const createGstCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await prisma.gstCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating GST category:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'GST category with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create GST category' });
    }
  }
};

// Update GST category
const updateGstCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid category ID is required' });
    }

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category exists
    const existingCategory = await prisma.gstCategory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'GST category not found' });
    }

    const category = await prisma.gstCategory.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });

    res.json(category);
  } catch (error) {
    console.error('Error updating GST category:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'GST category with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update GST category' });
    }
  }
};

// Delete (deactivate) GST category
const deleteGstCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid category ID is required' });
    }

    // Check if category exists
    const existingCategory = await prisma.gstCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { gstRates: true }
        }
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'GST category not found' });
    }

    // Check if category is being used in any GST rates
    if (existingCategory._count.gstRates > 0) {
      return res.status(400).json({ 
        error: `Cannot delete GST category. It is being used in ${existingCategory._count.gstRates} GST rate(s). You can deactivate it instead.` 
      });
    }

    // Deactivate instead of hard delete to maintain referential integrity
    const category = await prisma.gstCategory.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({ message: 'GST category deactivated successfully', category });
  } catch (error) {
    console.error('Error deleting GST category:', error);
    res.status(500).json({ error: 'Failed to delete GST category' });
  }
};

// Restore (reactivate) GST category
const restoreGstCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid category ID is required' });
    }

    // Check if category exists
    const existingCategory = await prisma.gstCategory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'GST category not found' });
    }

    const category = await prisma.gstCategory.update({
      where: { id: parseInt(id) },
      data: { isActive: true }
    });

    res.json(category);
  } catch (error) {
    console.error('Error restoring GST category:', error);
    res.status(500).json({ error: 'Failed to restore GST category' });
  }
};

module.exports = {
  getGstRates,
  getActiveGstRates,
  createGstRate,
  updateGstRate,
  deleteGstRate,
  toggleGstRateStatus,
  getGstCategories,
  createGstCategory,
  updateGstCategory,
  deleteGstCategory,
  restoreGstCategory
};