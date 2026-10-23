/**
 * Swagger / OpenAPI Specification
 * Dokumentasi API lengkap yang bisa di-akses di /api/docs
 */
const env = require('../src/config/env');

const swaggerSpecs = {
  openapi: '3.0.3',
  info: {
    title: 'Sistem Manajemen Inventaris Barang API',
    version: '1.0.0',
    description:
      'RESTful API untuk manajemen inventaris barang dengan autentikasi JWT.\n\n' +
      'Fitur: Register, Login, CRUD Barang dengan search & pagination, ' +
      'validasi data, dan penanganan konkurensi stok.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}/api`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // === User Schemas ===
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100, example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', minLength: 6, maxLength: 255, example: 'password123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
      // === Item Schemas ===
      CreateItemRequest: {
        type: 'object',
        required: ['name', 'stock', 'price'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255, example: 'Laptop ASUS ROG' },
          description: { type: 'string', maxLength: 1000, example: 'Laptop gaming 16GB RAM, RTX 4060' },
          stock: { type: 'integer', minimum: 0, example: 10 },
          price: { type: 'number', minimum: 0, example: 15000000 },
        },
      },
      UpdateItemRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255, example: 'Laptop ASUS ROG Strix' },
          description: { type: 'string', maxLength: 1000, example: 'Updated description' },
          stock: { type: 'integer', minimum: 0, example: 8 },
          price: { type: 'number', minimum: 0, example: 14000000 },
        },
      },
      DecreaseStockRequest: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'integer', minimum: 1, example: 1 },
        },
      },
      Item: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          stock: { type: 'integer' },
          price: { type: 'number' },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ItemListResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Item' } },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              totalItems: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
        },
      },
      // === Error Schema ===
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid input data' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
  ],
  paths: {
    // === AUTH ENDPOINTS ===
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register user baru',
        description: 'Membuat akun user baru. Password akan di-hash menggunakan bcrypt.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User registered successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          409: {
            description: 'Email sudah terdaftar',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          400: {
            description: 'Validasi input gagal',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        description: 'Autentikasi user dan kembalikan JWT token.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login berhasil',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: {
            description: 'Email atau password salah',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          400: {
            description: 'Validasi input gagal',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    // === ITEM ENDPOINTS ===
    '/items': {
      post: {
        tags: ['Items'],
        summary: 'Tambah barang baru',
        description: 'Membuat item baru. Stok tidak boleh negatif, harga tidak boleh negatif.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateItemRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Item berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Item created successfully' },
                    data: { $ref: '#/components/schemas/Item' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validasi input gagal',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          401: {
            description: 'Tidak terautentikasi',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
      get: {
        tags: ['Items'],
        summary: 'Lihat daftar barang',
        description: 'Mengambil daftar item milik user yang login, dengan search dan pagination.',
        parameters: [
          {
            name: 'search',
            in: 'query',
            description: 'Kata kunci pencarian (nama atau deskripsi)',
            required: false,
            schema: { type: 'string' },
            example: 'laptop',
          },
          {
            name: 'page',
            in: 'query',
            description: 'Nomor halaman',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
            example: 1,
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Jumlah item per halaman (1-100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            example: 10,
          },
        ],
        responses: {
          200: {
            description: 'Daftar item berhasil diambil',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ItemListResponse' } } },
          },
          401: {
            description: 'Tidak terautentikasi',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/items/{id}': {
      get: {
        tags: ['Items'],
        summary: 'Lihat detail barang',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Detail item',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Item' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Item tidak ditemukan',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          403: {
            description: 'Tidak punya akses ke item ini',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
      put: {
        tags: ['Items'],
        summary: 'Edit data barang',
        description: 'Update item. Minimal 1 field harus diisi. Stok dan harga tidak boleh negatif.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateItemRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Item berhasil diupdate',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Item' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Item tidak ditemukan',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          403: {
            description: 'Tidak punya akses ke item ini',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          400: {
            description: 'Validasi input gagal',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
      delete: {
        tags: ['Items'],
        summary: 'Hapus barang',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Item berhasil dihapus',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Item deleted successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Item tidak ditemukan',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          403: {
            description: 'Tidak punya akses ke item ini',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/items/{id}/decrease-stock': {
      post: {
        tags: ['Items'],
        summary: 'Kurangi stok barang (dengan concurrency handling)',
        description:
          'Mengurangi stok item menggunakan database transaction dengan row-level locking ' +
          '(SELECT ... FOR UPDATE) untuk mencegah race condition. ' +
          'Jika 2 request bersamaan mencoba mengurangi stok yang tersisa 1, ' +
          'request kedua akan menunggu sampai request pertama commit, ' +
          'lalu ditolak karena stok tidak mencukupi.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DecreaseStockRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Stok berhasil dikurangi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Stock decreased successfully' },
                    data: { $ref: '#/components/schemas/Item' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Stok tidak mencukupi',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          404: {
            description: 'Item tidak ditemukan',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
  },
};

module.exports = swaggerSpecs;
