/**
 * Item Routes
 * Endpoint protected: semua butuh JWT auth
 */
const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  createItemSchema,
  updateItemSchema,
  listItemsQuerySchema,
  decreaseStockSchema,
} = require('../validators/item.validator');
const itemController = require('../controllers/item.controller');

// Semua route di bawah ini butuh authentication
router.use(authMiddleware);

router.post('/', validate(createItemSchema), itemController.createItem);
router.get('/', validate(listItemsQuerySchema, 'query'), itemController.getItems);
router.get('/:id', itemController.getItemById);
router.put('/:id', validate(updateItemSchema), itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

// Endpoint tambahan untuk demo concurrency handling
router.post('/:id/decrease-stock', validate(decreaseStockSchema), itemController.decreaseStock);

module.exports = router;
