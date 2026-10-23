/**
 * JWT utility functions
 * Menangani signing dan verification JWT token
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign a JWT token untuk user
 * @param {Object} payload - Data yang akan di-encode di token (biasanya { id, email })
 * @returns {string} Signed JWT token
 */
function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verify dan decode JWT token
 * @param {string} token - JWT token yang akan diverify
 * @returns {Object} Decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
