/**
 * src/routes/user.routes.ts
 * --------------------------
 * Routing untuk CRUD User.
 *
 * Base path: /api/users  (didaftarkan di app.ts)
 *
 * Hak Akses:
 *   Semua endpoint di bawah ini HANYA dapat diakses oleh Admin.
 */

import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import {
  createUserValidator,
  updateUserValidator,
} from '../validators/user.validator';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminOnly } from '../middlewares/role.middleware';

const router = Router();

// Semua route user wajib login dan HARUS admin
router.use(authMiddleware);
router.use(adminOnly);

// GET /api/users          — Daftar semua user
router.get('/', userController.getAllUsers);

// GET /api/users/:id      — Detail satu user
router.get('/:id', userController.getUserById);

// POST /api/users         — Tambah user baru
router.post('/', createUserValidator, userController.createUser);

// PUT /api/users/:id      — Edit user (nama, email, role)
router.put('/:id', updateUserValidator, userController.updateUser);

// DELETE /api/users/:id   — Hapus user
router.delete('/:id', userController.deleteUser);

// POST /api/users/:id/reset-password — Tahap 10
// router.post('/:id/reset-password', userController.resetPassword);

export default router;
