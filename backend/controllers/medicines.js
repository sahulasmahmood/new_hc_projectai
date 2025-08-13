const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Search inventory items for prescription (medicines, syringes, devices, etc.)
const searchMedicines = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const items = await prisma.inventoryItem.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { code: { contains: q, mode: 'insensitive' } }
            ]
          },
          { currentStock: { gt: 0 } } // Only show items in stock
        ]
      },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        unit: true,
        currentStock: true
      },
      orderBy: [
        { name: 'asc' }
      ],
      take: parseInt(limit)
    });

    // Format response for easy use in frontend
    const formattedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      code: item.code,
      category: item.category,
      unit: item.unit,
      stock: item.currentStock,
      type: item.category,
      displayName: item.name
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error('Error searching inventory items:', error);
    res.status(500).json({ error: 'Failed to search inventory items' });
  }
};

// Get frequently prescribed medicines by doctor
const getFrequentMedicines = async (req, res) => {
  try {
    const { doctorId, limit = 10 } = req.query;

    if (!doctorId) {
      return res.json([]);
    }

    // Get most frequently prescribed medicines by this doctor
    const frequentMedicines = await prisma.prescriptionMedication.findMany({
      where: {
        prescription: {
          doctorName: { not: null } // We'll improve this with doctorId later
        }
      },
      select: {
        medicineName: true,
        dosage: true,
        frequency: true,
        duration: true
      },
      take: parseInt(limit)
    });

    // Group by medicine name and count frequency
    const medicineFrequency = {};
    frequentMedicines.forEach(med => {
      const key = med.medicineName.toLowerCase();
      if (!medicineFrequency[key]) {
        medicineFrequency[key] = {
          name: med.medicineName,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          count: 0
        };
      }
      medicineFrequency[key].count++;
    });

    // Sort by frequency and return top medicines
    const sortedMedicines = Object.values(medicineFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit))
      .map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        displayName: `${med.name} (${med.dosage})`,
        isFrequent: true
      }));

    res.json(sortedMedicines);
  } catch (error) {
    console.error('Error getting frequent medicines:', error);
    res.status(500).json({ error: 'Failed to get frequent medicines' });
  }
};

// Get all inventory categories for quick selection
const getMedicineCategories = async (req, res) => {
  try {
    const categories = await prisma.inventoryItem.groupBy({
      by: ['category'],
      where: {
        currentStock: { gt: 0 } // Only categories with items in stock
      },
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });

    const formattedCategories = categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }));

    res.json(formattedCategories);
  } catch (error) {
    console.error('Error getting inventory categories:', error);
    res.status(500).json({ error: 'Failed to get inventory categories' });
  }
};

// Get inventory items by category
const getMedicinesByCategory = async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const items = await prisma.inventoryItem.findMany({
      where: {
        AND: [
          { category: { equals: category, mode: 'insensitive' } },
          { currentStock: { gt: 0 } }
        ]
      },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        unit: true,
        currentStock: true
      },
      orderBy: { name: 'asc' },
      take: parseInt(limit)
    });

    const formattedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      code: item.code,
      category: item.category,
      unit: item.unit,
      stock: item.currentStock,
      type: item.category,
      displayName: item.name
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error('Error getting inventory items by category:', error);
    res.status(500).json({ error: 'Failed to get inventory items by category' });
  }
};

module.exports = {
  searchMedicines,
  getFrequentMedicines,
  getMedicineCategories,
  getMedicinesByCategory
};