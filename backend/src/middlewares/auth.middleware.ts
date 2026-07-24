/**
 * src/middlewares/auth.middleware.ts
 * -----------------------------------
 * Middleware verifikasi JWT Token.
 *
 * Cara kerja:
 * 1. Ambil token dari header: Authorization: Bearer <token>
 * 2. Verifikasi token dengan JWT_SECRET
 * 3. Decode payload → simpan di req.user
 * 4. Lanjutkan ke middleware/controller berikutnya
 *
 * Jika token tidak ada atau tidak valid → 401 Unauthorized
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './error.middleware';

// Tambahkan properti 'user' ke Request object Express (type augmentation)
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: 'admin' | 'operator' | 'viewer';
      };
    }
  }
}

// Interface payload JWT
export interface JwtPayload {
  id: number;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  iat?: number;
  exp?: number;
}

/**
 * Middleware: Verifikasi JWT Token.
 * Gunakan di route yang membutuhkan autentikasi.
 * Contoh: router.get('/me', authMiddleware, controller)
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'Token autentikasi diperlukan');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw createError(401, 'Token tidak valid');
    }

    // Verifikasi token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw createError(500, 'JWT Secret tidak dikonfigurasi');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Simpan data user ke req.user untuk digunakan di controller
    req.user = {
      id:    decoded.id,
      email: decoded.email,
      role:  decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(createError(401, 'Token sudah kedaluwarsa, silakan login kembali'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(createError(401, 'Token tidak valid'));
    } else {
      next(error);
    }
  }
}
