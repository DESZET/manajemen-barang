/**
 * Item Service
 * Business logic untuk CRUD item + pagination + search + concurrency handling
 * Meng-koordinasikan validasi aturan bisnis dan memanggil repository
 */
const itemRepository = require('../repositories/item.repository');
const ApiError = require('../utils/ApiError');

/**
 * Buat item baru
 * @param {Object} data - { name, description, stock, price }
 * @param {string} userId - ID user yang membuat item
 * @returns {Promise<Object>} Created item
 */
async function createItem(data, userId) {
  return itemRepository.createItem({
    name: data.name,
    description: data.description || null,
    stock: data.stock,
    price: data.price,
    userId,
  });
}

/**
 * Ambil daftar item dengan search & pagination
 * @param {Object} query - { search, page, limit }
 * @param {string} userId - Hanya item milik user ini yang diambil
 * @returns {Promise<Object>} { data, meta }
 */
async function getItems(query, userId) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const { items, total } = await itemRepository.findMany({
    search: query.search,
    skip,
    take: limit,
    userId,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: items,
    meta: {
      page,
      limit,
      totalItems: total,
      totalPages,
    },
  };
}

/**
 * Ambil satu item berdasarkan ID
 * @param {string} id
 * @param {string} userId - Validasi kepemilikan
 * @returns {Promise<Object>}
 */
async function getItemById(id, userId) {
  const item = await itemRepository.findById(id);

  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', 'Item not found');
  }

  if (item.userId !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this item');
  }

  return item;
}

/**
 * Update item
 * @param {string} id
 * @param {Object} data - field yang akan diupdate
 * @param {string} userId - Validasi kepemilikan
 * @returns {Promise<Object>} Updated item
 */
async function updateItem(id, data, userId) {
  const item = await itemRepository.findById(id);

  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', 'Item not found');
  }

  if (item.userId !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this item');
  }

  return itemRepository.updateItem(id, data);
}

/**
 * Hapus item
 * @param {string} id
 * @param {string} userId - Validasi kepemilikan
 * @returns {Promise<void>}
 */
async function deleteItem(id, userId) {
  const item = await itemRepository.findById(id);

  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', 'Item not found');
  }

  if (item.userId !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this item');
  }

  await itemRepository.deleteItem(id);
}

/**
 * Kurangi stok item dengan penanganan concurrency
 * Menggunakan database transaction + row-level locking (SELECT ... FOR UPDATE)
 * untuk mencegah race condition saat multiple request bersamaan
 *
 * @param {string} id - Item ID
 * @param {number} quantity - Jumlah stok yang dikurangi
 * @param {string} userId - Validasi kepemilikan
 * @returns {Promise<Object>} Updated item
 */
async function decreaseStock(id, quantity, userId) {
  try {
    return await itemRepository.decreaseStockWithLock(id, quantity, userId);
  } catch (error) {
    if (error.message === 'ITEM_NOT_FOUND') {
      throw new ApiError(404, 'NOT_FOUND', 'Item not found');
    }
    if (error.message === 'FORBIDDEN') {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this item');
    }
    if (error.message === 'INSUFFICIENT_STOCK') {
      throw new ApiError(400, 'VALIDATION_ERROR', `Insufficient stock. Cannot decrease by ${quantity}`);
    }
    throw error;
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
