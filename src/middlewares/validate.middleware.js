/**
 * Validation Middleware (Zod wrapper)
 * Menerima Zod schema dan validasi target (body, query, params)
 * Jika valid, pass ke next middleware
 * Jika tidak valid, kembalikan 400 dengan detail error
 */
const ApiError = require('../utils/ApiError');

function validate(schema, property = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = req[property];
      const parsed = schema.parse(dataToValidate);

      // Simpan hasil parsed di res.locals (Express 5: req.query pakai getter
      // yang re-parse URL setiap akses, jadi tidak bisa di-overwrite langsung)
      res.locals.validated = res.locals.validated || {};
      res.locals.validated[property] = parsed;

      // Untuk body: juga update req.body (bisa di-overwrite di Express 5)
      if (property === 'body') {
        req.body = parsed;
      }
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        // Zod v3+ menggunakan 'issues', beberapa versi juga punya 'errors'
        const issues = error.issues || error.errors || [];
        const details = issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return next(
          new ApiError(400, 'VALIDATION_ERROR', 'Invalid input data', details)
        );
      }
      next(error);
    }
  };
}

module.exports = validate;
