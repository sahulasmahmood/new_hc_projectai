const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();

// Get hospital settings (only one row)
const getHospitalSettings = async (req, res) => {
  try {
    let settings = await prisma.hospitalSettings.findFirst();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to load hospital settings" });
  }
};

// Save/update hospital settings (upsert)
const saveHospitalSettings = async (req, res) => {
  try {
    const data = req.body;
    let settings = await prisma.hospitalSettings.findFirst();
    if (!settings) {
      settings = await prisma.hospitalSettings.create({ data });
    } else {
      settings = await prisma.hospitalSettings.update({
        where: { id: settings.id },
        data,
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to save hospital settings" });
  }
};

module.exports = {
  getHospitalSettings,
  saveHospitalSettings,
};