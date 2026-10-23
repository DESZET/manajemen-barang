/**
 * Authentication Middleware
 * Verifikasi JWT token dari header Authorization
 * Jika valid, attach user info ke req.user
 * Jika tidak valid, kembalikan 401 Unauthorized
 */
const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authorization header is required');
    }

    // Format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authorization header must be in format: Bearer <token>');
    }

    const token = parts[1];
    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
    }
    next(error);
  }
}

module.exports = authMiddleware;
