/**
 * Item Repository
 * Layer akses data untuk Item — semua Prisma query terkait Item ada di sini
 */
const prisma = require('../config/prisma');
const { Prisma } = require('@prisma/client');

/**
 * Buat item baru
 * @param {Object} data - { name, description, stock, price, userId }
 * @returns {Promise<Object>} Created item
 */
async function createItem(data) {
  return prisma.item.create({
    data: {
      name: data.name,
      description: data.description,
      stock: data.stock,
      price: data.price,
      userId: data.userId,
    },
  });
}

/**
 * Ambil daftar item dengan search dan pagination
 * @param {Object} params - { search, skip, take, userId }
 * @returns {Promise<{items: Array, total: number}>}
 */
async function findMany({ search, skip, take, userId }) {
  const where = {
    userId,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.item.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.item.count({ where }),
  ]);

  return { items, total };
}

/**
 * Cari item berdasarkan ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function findById(id) {
  return prisma.item.findUnique({
    where: { id },
  });
}

/**
 * Update item
 * @param {string} id
 * @param {Object} data - field yang akan diupdate
 * @returns {Promise<Object>} Updated item
 */
async function updateItem(id, data) {
  return prisma.item.update({
    where: { id },
    data,
  });
}

/**
 * Hapus item
 * @param {string} id
 * @returns {Promise<void>}
 */
async function deleteItem(id) {
  await prisma.item.delete({
    where: { id },
  });
}

/**
 * Kurangi stok item dengan row-level locking (SELECT ... FOR UPDATE)
 * Mencegah race condition saat 2 request bersamaan mengurangi stok
 *
 * @param {string} itemId
 * @param {number} quantity - Jumlah stok yang akan dikurangi
 * @param {string} userId - Pemilik item (untuk validasi kepemilikan)
 * @returns {Promise<Object>} Updated item setelah stok dikurangi
 */
async function decreaseStockWithLock(itemId, quantity, userId) {
  return prisma.$transaction(async (tx) => {
    // SELECT ... FOR UPDATE: lock row agar request kedua harus menunggu
    // sampai transaction pertama commit/rollback
    const rows = await tx.$queryRaw`
      SELECT id, name, stock, user_id
      FROM items
      WHERE id = ${itemId}
      FOR UPDATE
    `;

    const item = rows[0];

    if (!item) {
      throw new Error('ITEM_NOT_FOUND');
    }

    if (item.user_id !== userId) {
      throw new Error('FORBIDDEN');
    }

    if (item.stock < quantity) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    // Update stok: stok saat ini - quantity
    const updated = await tx.item.update({
      where: { id: itemId },
      data: { stock: item.stock - quantity },
    });

    return updated;
  });
}

module.exports = {
  createItem,
  findMany,
  findById,
  updateItem,
  deleteItem,
  decreaseStockWithLock,
};
