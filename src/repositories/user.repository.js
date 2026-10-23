/**
 * User Repository
 * Layer akses data untuk User — semua Prisma query terkait User ada di sini
 * Service layer tidak perlu tahu detail query, hanya memanggil method di sini
 */
const prisma = require('../config/prisma');

/**
 * Buat user baru
 * @param {Object} data - { email, password, name }
 * @returns {Promise<Object>} Created user (tanpa password)
 */
async function createUser(data) {
  return prisma.user.create({
    data: {
      email: data.email,
      password: data.password,
      name: data.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });
}

/**
 * Cari user berdasarkan email
 * @param {string} email
 * @returns {Promise<Object|null>} User dengan password (untuk verifikasi login)
 */
async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Cari user berdasarkan ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}

module.exports = { createUser, findByEmail, findById };
