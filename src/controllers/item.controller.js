/**
 * Item Controller
 * Handler HTTP untuk endpoint CRUD item
 * Hanya meng-handle HTTP request/response, tidak ada business logic
 */
const itemService = require('../services/item.service');

/**
 * POST /items
 */
async function createItem(req, res, next) {
  try {
    const item = await itemService.createItem(req.body, req.user.id);

    res.status(201).json({
      message: 'Item created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /items?search=&page=&limit=
 */
async function getItems(req, res, next) {
  try {
    const result = await itemService.getItems(
      res.locals.validated?.query || req.query,
      req.user.id
    );

    res.status(200).json({
      message: 'Items retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /items/:id
 */
async function getItemById(req, res, next) {
  try {
    const item = await itemService.getItemById(req.params.id, req.user.id);

    res.status(200).json({
      message: 'Item retrieved successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /items/:id
 */
async function updateItem(req, res, next) {
  try {
    const item = await itemService.updateItem(req.params.id, req.body, req.user.id);

    res.status(200).json({
      message: 'Item updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /items/:id
 */
async function deleteItem(req, res, next) {
  try {
    await itemService.deleteItem(req.params.id, req.user.id);

    res.status(200).json({
      message: 'Item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /items/:id/decrease-stock
 * Endpoint tambahan untuk demonstrasi penanganan concurrency stok
 * Mengurangi stok dengan row-level locking (SELECT ... FOR UPDATE)
 */
async function decreaseStock(req, res, next) {
  try {
    const quantity = req.body.quantity;

    const item = await itemService.decreaseStock(
      req.params.id,
      quantity,
      req.user.id
    );

    res.status(200).json({
      message: 'Stock decreased successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  decreaseStock,
};
