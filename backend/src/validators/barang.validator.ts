/**
 * src/validators/barang.validator.ts
 * -------------------------------------
 * Validasi input untuk endpoint barang.
 */

import { body, param } from 'express-validator';
import { handleValidationErrors } from './auth.validator';

// ---------------------------------------------------------------
// Validator: Tambah Barang (POST)
// ---------------------------------------------------------------
export const createBarangValidator = [
  body('kode_barang')
    .trim()
    .notEmpty().withMessage('Kode barang wajib diisi')
    .isLength({ min: 2, max: 50 })
    .withMessage('Kode barang harus 2-50 karakter')
    .matches(/^[A-Za-z0-9\-_]+$/)
    .withMessage('Kode barang hanya boleh berisi huruf, angka, tanda hubung, dan underscore'),

  body('nama_barang')
    .trim()
    .notEmpty().withMessage('Nama barang wajib diisi')
    .isLength({ min: 2, max: 200 })
    .withMessage('Nama barang harus 2-200 karakter'),

  body('kategori_id')
    .notEmpty().withMessage('Kategori wajib dipilih')
    .isInt({ min: 1 }).withMessage('Kategori tidak valid'),

  body('kondisi')
    .notEmpty().withMessage('Kondisi wajib diisi')
    .isIn(['baik', 'rusak_ringan', 'rusak_berat'])
    .withMessage('Kondisi harus: baik, rusak_ringan, atau rusak_berat'),

  body('lokasi')
    .trim()
    .notEmpty().withMessage('Lokasi wajib diisi')
    .isLength({ min: 2, max: 100 })
    .withMessage('Lokasi harus 2-100 karakter'),

  body('jumlah')
    .notEmpty().withMessage('Jumlah wajib diisi')
    .isInt({ min: 0 }).withMessage('Jumlah harus berupa angka bulat positif atau nol'),

  handleValidationErrors,
];

// ---------------------------------------------------------------
// Validator: Edit Barang (PUT)
// Sama dengan create, tapi semua field opsional (partial update diizinkan)
// Namun jika field dikirim, tetap harus valid.
// ---------------------------------------------------------------
export const updateBarangValidator = [
  body('kode_barang')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Kode barang harus 2-50 karakter')
    .matches(/^[A-Za-z0-9\-_]+$/)
    .withMessage('Kode barang hanya boleh berisi huruf, angka, tanda hubung, dan underscore'),

  body('nama_barang')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nama barang harus 2-200 karakter'),

  body('kategori_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Kategori tidak valid'),

  body('kondisi')
    .optional()
    .isIn(['baik', 'rusak_ringan', 'rusak_berat'])
    .withMessage('Kondisi harus: baik, rusak_ringan, atau rusak_berat'),

  body('lokasi')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Lokasi harus 2-100 karakter'),

  body('jumlah')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Jumlah harus berupa angka bulat positif atau nol'),

  handleValidationErrors,
];
