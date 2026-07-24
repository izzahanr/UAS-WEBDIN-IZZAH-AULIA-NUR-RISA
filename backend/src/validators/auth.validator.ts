/**
 * src/validators/auth.validator.ts
 * ----------------------------------
 * Validasi input untuk endpoint autentikasi menggunakan express-validator.
 *
 * Setiap validator adalah array middleware:
 * [validationRules..., handleValidationErrors]
 *
 * Cara pakai:
 *   router.post('/register', registerValidator, authController.register)
 */

import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { createError, AppError } from '../middlewares/error.middleware';

/**
 * Middleware: Cek hasil validasi express-validator.
 * Jika ada error → lempar ke error handler dengan status 422.
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err: AppError = createError(422, 'Validasi input gagal');
    err.errors = errors.array().map((e) => ({
      field:   (e as any).path || (e as any).param,
      message: e.msg,
    }));
    next(err);
    return;
  }

  next();
}

// ---------------------------------------------------------------
// Validator: Register
// ---------------------------------------------------------------
export const registerValidator = [
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
    .optional()
    .isIn(['admin', 'operator', 'viewer'])
    .withMessage('Role tidak valid. Pilih: admin, operator, atau viewer'),

  handleValidationErrors,
];

// ---------------------------------------------------------------
// Validator: Login
// ---------------------------------------------------------------
export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password wajib diisi'),

  handleValidationErrors,
];

// ---------------------------------------------------------------
// Validator: Forgot Password
// ---------------------------------------------------------------
export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),

  handleValidationErrors,
];

// ---------------------------------------------------------------
// Validator: Reset Password
// ---------------------------------------------------------------
export const resetPasswordValidator = [
  body('password')
    .notEmpty().withMessage('Password baru wajib diisi')
    .isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),

  handleValidationErrors,
];

