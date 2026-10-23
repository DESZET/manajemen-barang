/**
 * Global Error Handler Middleware
 * Menangkap semua error yang dilempar dari controller/service/repository
 * Format response error yang konsisten di seluruh API
 */
const env = require('../config/env');

// 404 handler untuk route yang tidak ditemukan
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

// Global error handler
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong';
  let details = err.details || null;

  // Log full error di development untuk debugging
  if (env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('Unhandled error:', err);
  }

  // Jika error dari Prisma (misal: unique constraint violation)
  if (err.code === 'P2002') {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = 'Resource already exists';
    details = err.meta
      ? { target: err.meta.target }
      : null;
  }

  // Jika error dari Prisma: record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = 'Resource not found';
  }

  const response = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  // Stack trace hanya di development
  if (env.NODE_ENV === 'development' && statusCode === 500) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = { notFoundHandler, errorHandler };
