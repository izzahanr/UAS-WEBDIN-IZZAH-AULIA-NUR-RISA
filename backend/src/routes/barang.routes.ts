/**
 * src/routes/barang.routes.ts
 * ----------------------------
 * Routing untuk CRUD Barang Inventaris.
 *
 * Base path: /api/barang  (didaftarkan di app.ts)
 *
 * Hak Akses:
 *   GET              → semua role yang login
 *   POST             → admin, operator
 *   PUT              → admin, operator
 *   DELETE           → admin only
 *   POST /:id/upload → admin, operator (Tahap 7)
 */

import { Router } from 'express';
import * as barangController from '../controllers/barang.controller';
import {
  createBarangValidator,
  updateBarangValidator,
} from '../validators/barang.validator';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminOnly, adminOrOperator, allRoles } from '../middlewares/role.middleware';
import { handleUpload } from '../middlewares/upload.middleware';

const router = Router();

// Semua route barang butuh autentikasi
router.use(authMiddleware);

// GET /api/barang               — Daftar barang (semua role)
// Query params: ?search=&kategori=&kondisi=&page=&limit=
router.get('/', allRoles, barangController.getAllBarang);

// GET /api/barang/:id           — Detail satu barang (semua role)
router.get('/:id', allRoles, barangController.getBarangById);

// POST /api/barang              — Tambah barang (admin, operator)
router.post('/', adminOrOperator, createBarangValidator, barangController.createBarang);

// PUT /api/barang/:id           — Edit barang (admin, operator)
router.put('/:id', adminOrOperator, updateBarangValidator, barangController.updateBarang);

// DELETE /api/barang/:id        — Hapus barang (admin only)
router.delete('/:id', adminOnly, barangController.deleteBarang);

// POST /api/barang/:id/upload   — Upload foto (admin, operator)
router.post('/:id/upload', adminOrOperator, handleUpload, barangController.uploadFoto);

export default router;
