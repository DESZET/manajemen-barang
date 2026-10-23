/**
 * Environment configuration loader
 * Memvalidasi dan mengekspos environment variables ke seluruh aplikasi
 */
require('dotenv').config();

const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
};

module.exports = env;
