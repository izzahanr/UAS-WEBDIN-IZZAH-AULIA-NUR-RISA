/**
 * src/validators/user.validator.ts
 * ----------------------------------
 * Validasi input untuk endpoint manajemen user (admin only).
 */

import { body } from 'express-validator';
import { handleValidationErrors } from './auth.validator';

// ---------------------------------------------------------------
// Validator: Tambah User Baru (POST /api/users)
// ---------------------------------------------------------------
export const createUserValidator = [
  body('nama')
    .trim()
    .notEmpty().withMessage('Nama wajib diisi')
    .isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password wajib diisi')
    .isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),

  body('role')
    .notEmpty().withMessage('Role wajib diisi')
    .isIn(['admin', 'operator', 'viewer'])
    .withMessage('Role tidak valid. Pilih: admin, operator, atau viewer'),

  handleValidationErrors,
];

// ---------------------------------------------------------------
// Validator: Edit User (PUT /api/users/:id)
// Semua field opsional — hanya yang dikirim yang divalidasi
// ---------------------------------------------------------------
export const updateUserValidator = [
  body('nama')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),

  body('role')
    .optional()
    .isIn(['admin', 'operator', 'viewer'])
    .withMessage('Role tidak valid. Pilih: admin, operator, atau viewer'),

  // Password tidak diubah lewat endpoint ini — gunakan reset-password
  body('password')
    .not().exists()
    .withMessage('Gunakan endpoint /reset-password untuk mengubah password'),

  handleValidationErrors,
];
