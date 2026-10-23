/**
 * Route Aggregator
 * Menggabungkan semua route modules dan tambahkan health check
 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const itemRoutes = require('./item.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Inventory API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/items', itemRoutes);

module.exports = router;
