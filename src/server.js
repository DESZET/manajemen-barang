/**
 * Server Entry Point
 * Menjalankan HTTP server dan menangani graceful shutdown
 */
const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Inventory API Server`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Docs:        http://localhost:${PORT}/api/docs`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`========================================\n`);
});

// Graceful shutdown: tutup koneksi database & server saat aplikasi dihentikan
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
  });
  await prisma.$disconnect();
  console.log('Database connection closed.');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
