/**
 * src/routes/kategori.routes.ts
 * ------------------------------
 * Routing untuk CRUD Kategori Barang.
 *
 * Base path: /api/kategori  (didaftarkan di app.ts)
 *
 * Hak Akses:
 *   GET    → semua role yang login (admin, operator, viewer)
 *   POST   → admin, operator
 *   PUT    → admin, operator
 *   DELETE → admin only
 */

import { Router } from 'express';
import * as kategoriController from '../controllers/kategori.controller';
import { kategoriValidator } from '../validators/kategori.validator';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminOnly, adminOrOperator, allRoles } from '../middlewares/role.middleware';

const router = Router();

// Semua route kategori butuh autentikasi (login dulu)
router.use(authMiddleware);

// GET /api/kategori       — Daftar semua kategori (admin, operator, viewer)
router.get('/', allRoles, kategoriController.getAllKategori);

// GET /api/kategori/:id  — Detail satu kategori (admin, operator, viewer)
router.get('/:id', allRoles, kategoriController.getKategoriById);

// POST /api/kategori     — Tambah kategori baru (admin, operator)
router.post('/', adminOrOperator, kategoriValidator, kategoriController.createKategori);

// PUT /api/kategori/:id  — Edit kategori (admin, operator)
router.put('/:id', adminOrOperator, kategoriValidator, kategoriController.updateKategori);

// DELETE /api/kategori/:id — Hapus kategori (admin only)
router.delete('/:id', adminOnly, kategoriController.deleteKategori);

export default router;
