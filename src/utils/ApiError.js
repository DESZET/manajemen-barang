/**
 * Custom Error class untuk error handling yang terstruktur
 * Setiap error membawa HTTP status code dan error code untuk response yang konsisten
 */
class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Error yang diharapkan (validasi, auth, dll)

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
