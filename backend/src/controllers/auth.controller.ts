/**
 * src/controllers/auth.controller.ts
 * ------------------------------------
 * Controller untuk endpoint autentikasi:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *   POST /api/auth/logout
 *
 * Semua query menggunakan prepared statement mysql2 (parameter ?)
 * untuk mencegah SQL Injection.
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/db';
import { createError } from '../middlewares/error.middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Tipe data row tabel users dari MySQL
interface UserRow extends RowDataPacket {
  id:                     number;
  nama:                   string;
  email:                  string;
  password:               string;
  role:                   'admin' | 'operator' | 'viewer';
  reset_token:            string | null;
  reset_token_expired_at: Date | null;
  created_at:             Date;
  updated_at:             Date;
}

// Helper: Generate JWT token
function generateToken(payload: { id: number; email: string; role: string }): string {
  const secret  = process.env.JWT_SECRET!;
  const expires = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn: expires } as jwt.SignOptions);
}

// Helper: Sanitize user (hilangkan password dari response)
function sanitizeUser(user: UserRow) {
  const { password, reset_token, reset_token_expired_at, ...safe } = user;
  return safe;
}

// ---------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nama, email, password, role = 'viewer' } = req.body;

    // 1. Cek apakah email sudah terdaftar
    const [existingRows] = await pool.execute<UserRow[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingRows.length > 0) {
      throw createError(409, 'Email sudah terdaftar');
    }

    // 2. Hash password dengan bcrypt (10 salt rounds)
    const SALT_ROUNDS = 10;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Insert user baru ke database (prepared statement)
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (nama, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [nama, email.toLowerCase(), hashedPassword, role]
    );

    const newUserId = result.insertId;

    // 4. Ambil data user yang baru dibuat
    const [newUserRows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE id = ?',
      [newUserId]
    );

    // 5. Generate JWT
    const token = generateToken({
      id:    newUserRows[0].id,
      email: newUserRows[0].email,
      role:  newUserRows[0].role,
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        token,
        user: sanitizeUser(newUserRows[0]),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    // 1. Cari user berdasarkan email (prepared statement)
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      // Gunakan pesan generik agar tidak bocorkan info "email tidak terdaftar"
      throw createError(401, 'Email atau password salah');
    }

    const user = rows[0];

    // 2. Verifikasi password dengan bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createError(401, 'Email atau password salah');
    }

    // 3. Generate JWT token
    const token = generateToken({
      id:    user.id,
      email: user.email,
      role:  user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// GET /api/auth/me  (Protected — butuh authMiddleware)
// ---------------------------------------------------------------
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // req.user sudah diisi oleh authMiddleware dari JWT payload
    const userId = req.user!.id;

    // Ambil data terbaru dari DB (bukan dari token yang bisa stale)
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      throw createError(404, 'User tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(rows[0]),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    /**
     * JWT adalah stateless — server tidak menyimpan token.
     * Logout dilakukan di sisi client dengan menghapus token.
     * Endpoint ini ada untuk:
     * 1. Konsistensi API (frontend bisa panggil logout endpoint)
     * 2. Keperluan audit log jika diperlukan di masa depan
     * 3. Memenuhi ketentuan soal UAS
     */
    res.status(200).json({
      success: true,
      message: 'Logout berhasil. Silakan hapus token di sisi client.',
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// POST /api/auth/forgot-password
// Request reset password
// ---------------------------------------------------------------
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    // 1. Cek user ada
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id, email FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      // Sama seperti login salah, jangan beri tahu apakah email ada/tidak 
      // demi keamanan (mencegah email enumeration). Tetap return success.
      res.status(200).json({
        success: true,
        message: 'Jika email terdaftar, instruksi reset telah dibuat',
      });
      return;
    }

    const user = rows[0];

    // 2. Buat token acak (hex) & expired dalam 1 jam
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiredAt  = new Date(Date.now() + 60 * 60 * 1000); // +1 Jam

    // 3. Simpan token ke database
    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expired_at = ? WHERE id = ?',
      [resetToken, expiredAt, user.id]
    );

    // 4. Return token di response API (Simulasi untuk mempermudah tes/UAS tanpa SMTP)
    res.status(200).json({
      success: true,
      message: 'Token reset berhasil dibuat',
      data: {
        token: resetToken, // di production nyata, token ini HANYA dikirim via email
        expired_at: expiredAt
      }
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// POST /api/auth/reset-password/:token
// Update password menggunakan token valid
// ---------------------------------------------------------------
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Cari user dengan token tersebut DAN token belum expired
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expired_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      throw createError(400, 'Token reset password tidak valid atau sudah kedaluwarsa');
    }

    const userId = rows[0].id;

    // 2. Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Update password & hapus token reset (null)
    await pool.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expired_at = NULL WHERE id = ?',
      [hashedPassword, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah. Silakan login dengan password baru',
    });
  } catch (error) {
    next(error);
  }
}
