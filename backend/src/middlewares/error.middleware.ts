/**
 * src/middlewares/error.middleware.ts
 * ------------------------------------
 * Global error handler Express.
 *
 * Harus di-register PALING TERAKHIR di app.ts (setelah semua routes).
 * Menangkap semua error yang di-throw dengan next(error) dari controller.
 *
 * Format response error yang konsisten:
 * {
 *   success: false,
 *   message: "Pesan error",
 *   errors: [...] // opsional, untuk validation errors
 * }
 */

import { Request, Response, NextFunction } from 'express';

// Interface untuk custom error dengan status code
export interface AppError extends Error {
  statusCode?: number;
  errors?: object[];
}

/**
 * Global error handler middleware.
 * Express mengenali ini sebagai error handler karena memiliki 4 parameter (err, req, res, next).
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal Server Error';

  // Log error di server (jangan tampilkan stack trace di production)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${req.method} ${req.path} — ${statusCode}: ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
  });
}

/**
 * Helper: Buat error dengan status code kustom.
 * Contoh: throw createError(404, 'Barang tidak ditemukan');
 */
export function createError(statusCode: number, message: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Middleware: 404 Not Found — untuk route yang tidak terdaftar.
 * Letakkan sebelum errorHandler di app.ts.
 */
export function notFound(req: Request, res: Response, next: NextFunction): void {
  const error: AppError = createError(
    404,
    `Route tidak ditemukan: ${req.method} ${req.originalUrl}`
  );
  next(error);
}
