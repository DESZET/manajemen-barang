/**
 * Zod validation schemas untuk Item endpoints
 * Stok tidak boleh negatif, harga tidak boleh negatif
 */
const { z } = require('zod');

const createItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must not exceed 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  stock: z
    .int('Stock must be an integer')
    .min(0, 'Stock must not be negative'),
  price: z
    .number()
    .min(0, 'Price must not be negative'),
});

const updateItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name must not be empty')
    .max(255, 'Name must not exceed 255 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  stock: z
    .int('Stock must be an integer')
    .min(0, 'Stock must not be negative')
    .optional(),
  price: z
    .number()
    .min(0, 'Price must not be negative')
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Schema untuk query params GET /items
const listItemsQuerySchema = z.object({
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, 'Page must be >= 1'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
});

const decreaseStockSchema = z.object({
  quantity: z
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),
});

module.exports = { createItemSchema, updateItemSchema, listItemsQuerySchema, decreaseStockSchema };
