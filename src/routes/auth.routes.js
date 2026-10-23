/**
 * Auth Routes
 * Endpoint publik: register & login (tidak butuh JWT)
 */
const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
