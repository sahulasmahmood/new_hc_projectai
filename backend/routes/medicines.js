const express = require('express');
const router = express.Router();
const {
  searchMedicines,
  getFrequentMedicines,
  getMedicineCategories,
  getMedicinesByCategory
} = require('../controllers/medicines');

// GET /api/medicines/search?q=para&limit=10
router.get('/search', searchMedicines);

// GET /api/medicines/frequent?doctorId=1&limit=10
router.get('/frequent', getFrequentMedicines);

// GET /api/medicines/categories
router.get('/categories', getMedicineCategories);

// GET /api/medicines/category?category=Tablets&limit=20
router.get('/category', getMedicinesByCategory);

module.exports = router;