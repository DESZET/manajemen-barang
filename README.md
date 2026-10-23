# Sistem Manajemen Inventaris Barang — RESTful API

RESTful API untuk manajemen inventaris barang dengan autentikasi JWT, CRUD lengkap, search, pagination, validasi data, dan penanganan konkurensi stok.

## Tech Stack

| Komponen | Pilihan |
|---|---|
| Bahasa & Framework | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Validasi | Zod |
| Autentikasi | JWT (jsonwebtoken) + bcryptjs |
| Dokumentasi | Swagger / OpenAPI 3.0 |

## Struktur Project

```
inventory-api/
├── src/
│   ├── app.js                      # Express app & middleware setup
│   ├── server.js                   # Entry point
│   ├── config/
│   │   ├── env.js                  # Environment variables
│   │   └── prisma.js               # Prisma client singleton
│   ├── routes/
│   │   ├── index.js                # Route aggregator
│   │   ├── auth.routes.js          # /auth endpoints
│   │   └── item.routes.js          # /items endpoints
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verification
│   │   ├── validate.middleware.js  # Zod schema validation
│   │   └── error.middleware.js     # Global error handler
│   ├── controllers/
│   │   ├── auth.controller.js      # HTTP handler untuk auth
│   │   └── item.controller.js      # HTTP handler untuk items
│   ├── services/
│   │   ├── auth.service.js         # Business logic: register, login
│   │   └── item.service.js         # Business logic: CRUD, pagination, concurrency
│   ├── repositories/
│   │   ├── user.repository.js      # Prisma queries untuk User
│   │   └── item.repository.js      # Prisma queries untuk Item
│   ├── validators/
│   │   ├── auth.validator.js       # Zod schemas untuk auth
│   │   └── item.validator.js       # Zod schemas untuk items
│   └── utils/
│       ├── ApiError.js             # Custom error class
│       └── jwt.js                  # JWT sign/verify helper
├── docs/
│   └── swagger.js                  # OpenAPI spec
├── prisma/
│   └── schema.prisma               # Database schema
├── docker-compose.yml              # PostgreSQL container
├── .env.example
├── package.json
└── README.md
```

## Cara Menjalankan

### Prasyarat
- Node.js v18+
- PostgreSQL (via Docker atau install manual)

### Opsi 1: Dengan Docker (Recommended)

```bash
# 1. Clone repository
git clone <repo-url>
cd inventory-api

# 2. Install dependencies
npm install

# 3. Jalankan PostgreSQL dengan Docker
docker-compose up -d

# 4. Copy environment file
cp .env.example .env

# 5. Apply database migration (sudah include CHECK constraint stok >= 0)
npx prisma migrate deploy

# 6. Generate Prisma client
npx prisma generate

# 7. Start server (development mode)
npm run dev
```

### Opsi 2: Manual Setup

```bash
# 1. Install PostgreSQL & buat database
createdb inventory_db

# 2. Clone & install
git clone <repo-url>
cd inventory-api
npm install

# 3. Copy .env dan sesuaikan DATABASE_URL
cp .env.example .env

# 4. Apply migration (sudah include CHECK constraint stok >= 0)
npx prisma migrate deploy
npx prisma generate

# 5. Start server
npm run dev
```

> **Catatan:** Migration sudah dibuat dengan CHECK constraint (`stock >= 0` dan `price >= 0`) di level database. Gunakan `npx prisma migrate deploy` untuk apply migration yang sudah ada. Jangan gunakan `migrate dev` karena akan membuat migration baru tanpa CHECK constraint.

Server berjalan di `http://localhost:3000`

Dokumentasi Swagger: `http://localhost:3000/api/docs`

## Endpoint API

### Auth (Public)

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/register` | Register user baru |
| POST | `/api/auth/login` | Login & dapatkan JWT token |

### Items (Protected — butuh JWT)

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/items` | Tambah barang baru |
| GET | `/api/items` | Daftar barang (search + pagination) |
| GET | `/api/items/:id` | Detail barang |
| PUT | `/api/items/:id` | Edit barang |
| DELETE | `/api/items/:id` | Hapus barang |
| POST | `/api/items/:id/decrease-stock` | Kurangi stok (concurrency-safe) |

### Contoh Request

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Create Item (dengan token):**
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Laptop ASUS","description":"Gaming laptop","stock":10,"price":15000000}'
```

**List Items dengan search & pagination:**
```bash
curl -X GET "http://localhost:3000/api/items?search=laptop&page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Pertanyaan Pemahaman

### 1. Alur Request: Jelaskan alur perjalanan request dari client hingga data tersimpan di database. Mengapa memisahkan logic seperti itu?

**Alur Request:**

```
Client Request
    │
    ▼
Router (Express)          → Match URL & HTTP method ke handler yang sesuai
    │
    ▼
Middleware (Auth + Validation)
    │                        → Auth: verifikasi JWT token dari header Authorization
    │                        → Validate: validasi req.body/req.query dengan Zod schema
    ▼
Controller                 → Ekstrak data dari req (body, params, query)
    │                        → Panggil service, terima result
    │                        → Format HTTP response (status code + JSON)
    ▼
Service                    → Business logic (hash password, validasi aturan bisnis,
    │                        → pagination calc, transaction management)
    ▼
Repository                 → Eksekusi query ke database via Prisma
    │                        → Isolasi akses data (service tidak tahu detail query)
    ▼
Database (PostgreSQL)
```

Contoh: saat client memanggil `POST /items`:

1. **Router** menerima request, cocokkan `POST /items` → arahkan ke `item.routes.js`
2. **Auth Middleware** verifikasi JWT dari header `Authorization: Bearer <token>`. Jika tidak valid → 401. Jika valid, attach `req.user = { id, email }`
3. **Validate Middleware** validasi `req.body` dengan `createItemSchema` (Zod). Jika tidak valid → 400 dengan detail error
4. **Controller** (`itemController.createItem`) ekstrak `req.body` dan `req.user.id`, panggil `itemService.createItem(data, userId)`
5. **Service** (`itemService.createItem`) meneruskan data ke repository
6. **Repository** (`itemRepository.createItem`) eksekusi `prisma.item.create()`, data tersimpan di PostgreSQL
7. **Controller** terima hasil, kembalikan `201 Created` dengan data item

**Mengapa dipisah?**

- **Separation of Concerns**: Setiap layer punya tanggung jawab tunggal. Controller hanya urus HTTP, Service hanya urus business logic, Repository hanya urus database.
- **Testability**: Service bisa di-test tanpa HTTP context (tidak perlu mock Express). Repository bisa di-test dengan database test.
- **Maintainability**: Jika ingin ganti ORM dari Prisma ke Sequelize, hanya ubah Repository layer. Controller dan Service tidak perlu diubah.
- **Reusability**: Logic di Service bisa dipakai oleh multiple controller (misal: logic createItem bisa dipakai oleh endpoint REST dan juga GraphQL resolver).

### 2. Keamanan & Token: Dimana sebaiknya frontend menyimpan token JWT?

Ada dua pilihan utama, masing-masing dengan tradeoff:

**Opsi A: Local Storage**
- Token disimpan di `localStorage` JavaScript browser
- Kelebihan: mudah diimplementasikan, bisa diakses dari JavaScript untuk attach ke header
- Risiko: rentan serangan **XSS (Cross-Site Scripting)**. Jika attacker berhasil injeksi script ke halaman, script tersebut bisa membaca token dari localStorage dan mengirimkannya ke server attacker

**Opsi B: HttpOnly Cookie**
- Token disimpan di cookie dengan flag `HttpOnly`, `Secure`, dan `SameSite`
- Kelebihan: JavaScript tidak bisa mengakses cookie (HttpOnly), sehingga tahan dari XSS. Browser otomatis mengirim cookie di setiap request
- Risiko: rentan serangan **CSRF (Cross-Site Request Forgery)**. Karena browser otomatis kirim cookie, attacker bisa membuat user mengunjungi form di site lain yang trigger request ke API kita. Mitigasi: gunakan `SameSite=Strict` atau `SameSite=Lax`, dan tambah CSRF token

**Rekomendasi:**

Gunakan **HttpOnly Cookie** dengan konfigurasi:
- `HttpOnly: true` — JavaScript tidak bisa akses
- `Secure: true` — hanya kirim via HTTPS
- `SameSite: Strict` — cookie tidak dikirim di request dari domain lain (mitigasi CSRF)

Jika menggunakan Local Storage, pastikan:
- Input sanitization ketat untuk mencegah XSS
- Content Security Policy (CSP) header
- Gunakan token dengan expiry pendek + refresh token

Pada API ini, token dikembalikan di response body (standar REST API), sehingga frontend bisa memilih strategi penyimpanannya. Untuk produksi, saya rekomendasikan memodifikasi backend untuk langsung set HttpOnly cookie.

### 3. Penanganan Konkurensi (Concurrency)

**Skenario:** Stok barang X = 1. Dua user secara bersamaan mengirim request untuk mengurangi stok sebanyak 1. Tanpa penanganan, keduanya bisa membaca stok = 1, mengurangi masing-masing 1, dan menulis stok = 0. Hasilnya stok menjadi 0, padahal total pengurangan seharusnya 2 (stok seharusnya -1 atau request kedua ditolak).

**Solusi yang diimplementasikan: 2 layer pertahanan**

#### Layer 1: Database Transaction + Row-Level Locking (`SELECT ... FOR UPDATE`)

```javascript
// src/repositories/item.repository.js
async function decreaseStockWithLock(itemId, quantity, userId) {
  return prisma.$transaction(async (tx) => {
    // SELECT ... FOR UPDATE: lock row item
    // Request kedua yang datang bersamaan akan MENUNGGU
    // sampai transaction pertama commit/rollback
    const rows = await tx.$queryRaw`
      SELECT id, name, stock, user_id
      FROM items
      WHERE id = ${itemId}
      FOR UPDATE
    `;

    const item = rows[0];

    if (!item) throw new Error('ITEM_NOT_FOUND');
    if (item.user_id !== userId) throw new Error('FORBIDDEN');
    if (item.stock < quantity) throw new Error('INSUFFICIENT_STOCK');

    // Update stok: nilai baru = stok saat ini - quantity
    const updated = await tx.item.update({
      where: { id: itemId },
      data: { stock: item.stock - quantity },
    });

    return updated;
  });
}
```

**Cara kerja:**

1. Request A dan Request B datang hampir bersamaan
2. Request A: `SELECT ... FOR UPDATE` → dapat row dengan stok = 1, **lock row**
3. Request B: `SELECT ... FOR UPDATE` → **menunggu** karena row sedang di-lock Request A
4. Request A: cek stok (1 >= 1, OK), update stok = 0, commit → **lock dilepas**
5. Request B: lock dilepas, lanjutkan query → baca stok = 0
6. Request B: cek stok (0 < 1) → **throw INSUFFICIENT_STOCK** → kembalikan 400

Hasil: stok tidak pernah menjadi negatif. Hanya 1 request yang berhasil.

#### Layer 2: Database CHECK Constraint (Defense-in-Depth)

```sql
ALTER TABLE items ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);
```

Ini adalah constraint di level database. Meski ada bug di aplikasi yang melewati validasi, database akan **menolak** stok negatif. Transaksi akan di-rollback dan error dilempar.

**Alternatif lain (tidak diimplementasikan, tapi bisa dipertimbangkan):**

- **Optimistic Concurrency Control**: Tambah kolom `version`. Saat update: `WHERE id = ? AND version = ?`. Jika affected rows = 0, berarti data sudah berubah → retry atau reject. Cocok jika konflik jarang terjadi.
- **Atomic UPDATE dengan WHERE**: `UPDATE items SET stock = stock - ? WHERE id = ? AND stock >= ?`. Prisma bisa melakukannya dalam satu query. Simpler, tapi tidak bisa memberikan pesan error yang spesifik (hanya tahu affected rows = 0).

---

## Database Schema

### Tabel `users`

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK, default uuid |
| email | VARCHAR | UNIQUE, NOT NULL |
| password | VARCHAR | NOT NULL (hashed) |
| name | VARCHAR | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

### Tabel `items`

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK, default uuid |
| name | VARCHAR | NOT NULL |
| description | TEXT | NULL |
| stock | INTEGER | NOT NULL, CHECK (stock >= 0) |
| price | DECIMAL(12,2) | NOT NULL, CHECK (price >= 0) |
| user_id | UUID | FK → users.id, NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

---

## Scripts

```bash
npm run dev       # Start development server (nodemon)
npm run start     # Start production server
npm run migrate   # Run Prisma migration
npm run generate  # Generate Prisma client
npm run studio    # Open Prisma Studio (DB GUI)
```
