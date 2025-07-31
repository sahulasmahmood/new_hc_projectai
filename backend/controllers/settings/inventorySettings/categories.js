const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();

// GET all categories (optionally include inactive)
const getAllCategories = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await prisma.inventoryCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// GET category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

// POST create new category
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if active category already exists
    const existingCategory = await prisma.inventoryCategory.findFirst({
      where: { name, isActive: true }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const category = await prisma.inventoryCategory.create({
      data: {
        name,
        description,
        isActive: true
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// PUT update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category exists
    const existingCategory = await prisma.inventoryCategory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if new name conflicts with another active category
    if (name !== existingCategory.name) {
      const nameConflict = await prisma.inventoryCategory.findFirst({
        where: { name, isActive: true }
      });
      if (nameConflict) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
    }

    const updatedCategory = await prisma.inventoryCategory.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive
      }
    });

    // If the name changed, update all inventory items with the old name
    if (name !== existingCategory.name) {
      await prisma.inventoryItem.updateMany({
        where: { category: existingCategory.name },
        data: { category: name }
      });
    }

    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// DELETE category (soft delete)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.inventoryCategory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category is being used by any inventory items
    const itemsUsingCategory = await prisma.inventoryItem.findFirst({
      where: { category: existingCategory.name }
    });

    if (itemsUsingCategory) {
      return res.status(400).json({ 
        error: 'Cannot delete category. It is being used by inventory items.' 
      });
    }

    // Soft delete by setting isActive to false
    await prisma.inventoryCategory.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// PATCH restore category
const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if category exists
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: parseInt(id) }
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    // Check for active duplicate
    const activeDuplicate = await prisma.inventoryCategory.findFirst({
      where: { name: category.name, isActive: true }
    });
    if (activeDuplicate) {
      return res.status(400).json({ error: 'An active category with this name already exists' });
    }
    const restored = await prisma.inventoryCategory.update({
      where: { id: parseInt(id) },
      data: { isActive: true }
    });
    res.json(restored);
  } catch (error) {
    console.error('Error restoring category:', error);
    res.status(500).json({ error: 'Failed to restore category' });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory
}; 