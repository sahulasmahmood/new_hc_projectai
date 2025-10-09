const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// Get all vitals settings
const getVitalsSettings = async (req, res) => {
  try {
    const settings = await prisma.vitalsSettings.findMany({
      orderBy: { vitalType: 'asc' }
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching vitals settings:', error);
    res.status(500).json({ error: 'Failed to fetch vitals settings' });
  }
};

// Get single vitals setting by type
const getVitalsSettingByType = async (req, res) => {
  try {
    const { vitalType } = req.params;
    const setting = await prisma.vitalsSettings.findUnique({
      where: { vitalType }
    });

    if (!setting) {
      return res.status(404).json({ error: 'Vitals setting not found' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Error fetching vitals setting:', error);
    res.status(500).json({ error: 'Failed to fetch vitals setting' });
  }
};

// Update vitals setting
const updateVitalsSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      unit,
      minNormal,
      maxNormal,
      minCritical,
      maxCritical,
      isActive,
      notes
    } = req.body;

    // Comprehensive range validation
    const errors = [];
    
    // Check if normal range is valid
    if (minNormal !== null && maxNormal !== null && minNormal >= maxNormal) {
      errors.push('Normal minimum must be less than normal maximum');
    }
    
    // Check if critical range is valid
    if (minCritical !== null && maxCritical !== null && minCritical >= maxCritical) {
      errors.push('Critical minimum must be less than critical maximum');
    }
    
    // Check proper sequence: Critical Low < Normal Min < Normal Max < Critical High
    if (minCritical !== null && minNormal !== null && minCritical >= minNormal) {
      errors.push('Critical minimum must be lower than normal minimum');
    }
    
    if (maxNormal !== null && maxCritical !== null && maxNormal >= maxCritical) {
      errors.push('Normal maximum must be lower than critical maximum');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('. ') });
    }

    const setting = await prisma.vitalsSettings.update({
      where: { id: parseInt(id) },
      data: {
        name,
        unit,
        minNormal: minNormal !== null ? parseFloat(minNormal) : null,
        maxNormal: maxNormal !== null ? parseFloat(maxNormal) : null,
        minCritical: minCritical !== null ? parseFloat(minCritical) : null,
        maxCritical: maxCritical !== null ? parseFloat(maxCritical) : null,
        isActive,
        notes
      }
    });

    res.json(setting);
  } catch (error) {
    console.error('Error updating vitals setting:', error);
    res.status(500).json({ error: 'Failed to update vitals setting' });
  }
};

// Reset vitals settings to defaults
const resetVitalsSettings = async (req, res) => {
  try {
    const { initializeDefaultVitalsSettings } = require('../../utils/initializeDefaultVitalsSettings');
    
    // Delete all existing settings
    await prisma.vitalsSettings.deleteMany({});
    
    // Reinitialize defaults
    await initializeDefaultVitalsSettings();
    
    // Fetch and return new settings
    const settings = await prisma.vitalsSettings.findMany({
      orderBy: { vitalType: 'asc' }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error resetting vitals settings:', error);
    res.status(500).json({ error: 'Failed to reset vitals settings' });
  }
};

module.exports = {
  getVitalsSettings,
  getVitalsSettingByType,
  updateVitalsSettings,
  resetVitalsSettings
};
