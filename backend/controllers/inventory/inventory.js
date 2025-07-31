const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// Helper: Get dynamic prefix for category
async function getCategoryPrefix(category) {
  // Validate category exists and is active
  const cat = await prisma.inventoryCategory.findFirst({
    where: { name: category, isActive: true }
  });
  if (!cat) throw new Error('Invalid or inactive category');
  // Use first 3 uppercase letters of category name as prefix
  return category.substring(0, 3).toUpperCase();
}

// Helper: Generate next code for category
async function generateNextCode(category) {
  const prefix = await getCategoryPrefix(category);
  // Find the highest code for this category
  const lastItem = await prisma.inventoryItem.findFirst({
    where: {
      code: { startsWith: prefix + '-' }
    },
    orderBy: { code: 'desc' }
  });
  let nextNumber = 1;
  if (lastItem && lastItem.code) {
    const match = lastItem.code.match(/^([A-Z]{3})-(\d{3})$/);
    if (match) {
      nextNumber = parseInt(match[2], 10) + 1;
    }
  }
  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

// GET all inventory items (with optional search/filter)
const getAllInventoryItems = async (req, res) => {
  try {
    const { search, category } = req.query;
    let where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category && category !== "all") {
      where.category = category;
    }
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`Fetched ${items.length} inventory items`);
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: "Failed to fetch inventory items" });
  }
};

// GET single inventory item by ID
const getInventoryItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.inventoryItem.findUnique({ 
      where: { id: parseInt(id) } 
    });
    
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: "Failed to fetch inventory item" });
  }
};

// CREATE new inventory item
const createInventoryItem = async (req, res) => {
  try {
    const data = req.body;
    // Validate required fields
    if (!data.name || !data.category || !data.unit || !data.supplier) {
      return res.status(400).json({ 
        error: "Missing required fields: name, category, unit, and supplier are required" 
      });
    }
    // Validate category exists and is active
    const cat = await prisma.inventoryCategory.findFirst({
      where: { name: data.category, isActive: true }
    });
    if (!cat) {
      return res.status(400).json({ error: "Selected category does not exist or is inactive" });
    }
    // Generate unique code for this category
    const code = await generateNextCode(data.category);
    // Set default values for optional fields
    const itemData = {
      ...data,
      code,
      currentStock: parseInt(data.currentStock) || 0,
      minStock: parseInt(data.minStock) || 0,
      maxStock: parseInt(data.maxStock) || 0,
      pricePerUnit: parseFloat(data.pricePerUnit) || 0,
      lastRestocked: data.lastRestocked ? new Date(data.lastRestocked) : new Date(),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null
    };
    const item = await prisma.inventoryItem.create({ data: itemData });
    console.log(`Created inventory item: ${item.name} (${item.code})`);
    res.status(201).json(item);
  } catch (error) {
    if (error.message === 'Invalid or inactive category') {
      return res.status(400).json({ error: "Selected category does not exist or is inactive" });
    }
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: "Failed to create inventory item" });
  }
};

// UPDATE inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    // Validate category if provided
    if (data.category) {
      const cat = await prisma.inventoryCategory.findFirst({
        where: { name: data.category, isActive: true }
      });
      if (!cat) {
        return res.status(400).json({ error: "Selected category does not exist or is inactive" });
      }
    }
    // Convert numeric fields
    const updateData = {
      ...data,
      currentStock: data.currentStock !== undefined ? parseInt(data.currentStock) : undefined,
      minStock: data.minStock !== undefined ? parseInt(data.minStock) : undefined,
      maxStock: data.maxStock !== undefined ? parseInt(data.maxStock) : undefined,
      pricePerUnit: data.pricePerUnit !== undefined ? parseFloat(data.pricePerUnit) : undefined,
      lastRestocked: data.lastRestocked ? new Date(data.lastRestocked) : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      reason: data.reason || undefined
    };
    const item = await prisma.inventoryItem.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    console.log(`Updated inventory item: ${item.name} (${item.code})`);
    res.json(item);
  } catch (error) {
    if (error.message === 'Invalid or inactive category') {
      return res.status(400).json({ error: "Selected category does not exist or is inactive" });
    }
    console.error('Error updating inventory item:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(500).json({ error: "Failed to update inventory item" });
  }
};

// DELETE inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get item details before deletion for logging
    const item = await prisma.inventoryItem.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    await prisma.inventoryItem.delete({ where: { id: parseInt(id) } });
    console.log(`Deleted inventory item: ${item.name} (${item.code})`);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
};

// RESTOCK inventory item
const restockInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, batchNumber, expiryDate, supplier, date, reason } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }
    if (!batchNumber) {
      return res.status(400).json({ error: "Batch number is required" });
    }
    // Simulate batch number uniqueness check (should be more robust in real app)
    // For now, always allow
    const item = await prisma.inventoryItem.findUnique({ where: { id: parseInt(id) } });
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return res.status(400).json({ error: "Expiry date must be in the future" });
    }
    if (date && new Date(date) > new Date()) {
      return res.status(400).json({ error: "Restock date cannot be in the future" });
    }
    if (item.currentStock + parseInt(quantity) > item.maxStock) {
      return res.status(400).json({ error: `Cannot exceed max stock (${item.maxStock} ${item.unit})` });
    }
    // Create InventoryBatch record
    await prisma.inventoryBatch.create({
      data: {
        inventoryItemId: item.id,
        batchNumber,
        quantity: parseInt(quantity),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        restockedAt: date ? new Date(date) : new Date(),
        supplier: supplier || item.supplier,
        reason: reason || null,
      },
    });
    // Update InventoryItem stock and lastRestocked
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: parseInt(id) },
      data: {
        currentStock: item.currentStock + parseInt(quantity),
        lastRestocked: date ? new Date(date) : new Date(),
        // Optionally update expiryDate and supplier for legacy/summary
        expiryDate: expiryDate ? new Date(expiryDate) : item.expiryDate,
        supplier: supplier || item.supplier,
        reason: reason || undefined,
      },
    });
    res.json(updatedItem);
  } catch (error) {
    console.error('Error restocking inventory item:', error);
    res.status(500).json({ error: "Failed to restock inventory item" });
  }
};

// GET batch history for an inventory item
const getInventoryItemBatches = async (req, res) => {
  try {
    const { id } = req.params;
    // Order by restockedAt DESC, then by id DESC for stable ordering within same date
    const batches = await prisma.inventoryBatch.findMany({
      where: { inventoryItemId: parseInt(id) },
      orderBy: [
        { restockedAt: 'desc' },
        { id: 'desc' },
      ],
    });
    res.json(batches);
  } catch (error) {
    console.error('Error fetching inventory batches:', error);
    res.status(500).json({ error: "Failed to fetch inventory batches" });
  }
};

module.exports = {
  getAllInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockInventoryItem,
  getInventoryItemBatches,
};