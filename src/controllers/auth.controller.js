/**
 * Auth Controller
 * Handler HTTP untuk endpoint auth: register & login
 * Hanya meng-handle HTTP request/response, tidak ada business logic
 */
const authService = require('../services/auth.service');

/**
 * POST /auth/register
 */
async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/login
 */
async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);

    res.status(200).json({
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login };
