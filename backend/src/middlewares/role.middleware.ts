/**
 * src/middlewares/role.middleware.ts
 * ------------------------------------
 * Middleware pengecekan role / hak akses.
 *
 * HARUS digunakan SETELAH authMiddleware karena butuh req.user.
 *
 * Cara pakai:
 *   router.delete('/:id', authMiddleware, roleMiddleware('admin'), controller)
 *   router.post('/',      authMiddleware, roleMiddleware('admin', 'operator'), controller)
 *
 * Jika role tidak sesuai → 403 Forbidden
 */

import { Request, Response, NextFunction } from 'express';
import { createError } from './error.middleware';

type Role = 'admin' | 'operator' | 'viewer';

/**
 * Middleware factory: Buat middleware yang hanya mengizinkan role tertentu.
 *
 * @param allowedRoles - Satu atau lebih role yang diizinkan
 * @returns Express middleware function
 *
 * Contoh:
 *   roleMiddleware('admin')              → hanya admin
 *   roleMiddleware('admin', 'operator')  → admin atau operator
 */
export function roleMiddleware(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // req.user sudah diisi oleh authMiddleware sebelumnya
    if (!req.user) {
      next(createError(401, 'Tidak terautentikasi'));
      return;
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      next(
        createError(
          403,
          `Akses ditolak. Hak akses dibutuhkan: ${allowedRoles.join(' atau ')}`
        )
      );
      return;
    }

    next();
  };
}

// Shortcut middleware yang sudah jadi untuk dipakai di routes
export const adminOnly      = roleMiddleware('admin');
export const adminOrOperator = roleMiddleware('admin', 'operator');
export const allRoles        = roleMiddleware('admin', 'operator', 'viewer');
