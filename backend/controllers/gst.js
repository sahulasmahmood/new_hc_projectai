const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Get all GST rates
const getGstRates = async (req, res) => {
  try {
    const gstRates = await prisma.gstRate.findMany({
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
    const { name, rate, description, category } = req.body;

    // Validate required fields
    if (!name || rate === undefined || rate === null) {
      return res.status(400).json({ error: 'Name and rate are required' });
    }

    // Validate rate is a valid number
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'Rate must be a valid number between 0 and 100' });
    }

    const gstRate = await prisma.gstRate.create({
      data: {
        name: name.trim(),
        rate: parseFloat(rate),
        description: description?.trim() || null,
        category: category?.trim() || null
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
    const { name, rate, description, category, isActive } = req.body;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid GST rate ID is required' });
    }

    // Validate rate if provided
    if (rate !== undefined && (isNaN(rate) || rate < 0 || rate > 100)) {
      return res.status(400).json({ error: 'Rate must be a valid number between 0 and 100' });
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
    if (category !== undefined) updateData.category = category?.trim() || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const gstRate = await prisma.gstRate.update({
      where: { id: parseInt(id) },
      data: updateData
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

module.exports = {
  getGstRates,
  getActiveGstRates,
  createGstRate,
  updateGstRate,
  deleteGstRate,
  toggleGstRateStatus
};