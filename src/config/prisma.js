/**
 * Prisma Client Singleton
 * Memastikan hanya ada satu instance PrismaClient di seluruh aplikasi
 * (mencegah connection leak saat hot-reload di development)
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

module.exports = prisma;

