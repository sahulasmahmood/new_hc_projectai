const express = require('express');
const router = express.Router();
const inventory = require('../controllers/inventory/inventory');

router.get('/', inventory.getAllInventoryItems);
router.get('/:id', inventory.getInventoryItemById);
router.post('/', inventory.createInventoryItem);
router.put('/:id', inventory.updateInventoryItem);
router.delete('/:id', inventory.deleteInventoryItem);
router.post('/:id/restock', inventory.restockInventoryItem);
router.get('/:id/batches', inventory.getInventoryItemBatches);

module.exports = router;