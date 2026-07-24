/**
 * src/validators/kategori.validator.ts
 * ---------------------------------------
 * Validasi input untuk endpoint kategori barang.
 */

import { body } from 'express-validator';
import { handleValidationErrors } from './auth.validator';

// ---------------------------------------------------------------
// Validator: Tambah & Edit Kategori
// ---------------------------------------------------------------
export const kategoriValidator = [
  body('nama_kategori')
    .trim()
    .notEmpty().withMessage('Nama kategori wajib diisi')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama kategori harus 2-100 karakter'),

  handleValidationErrors,
];
