/**
 * Zod validation schemas untuk Auth endpoints
 */
const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(255, 'Password must not exceed 255 characters'),
});

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
