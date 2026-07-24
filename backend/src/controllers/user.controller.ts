/**
 * src/controllers/user.controller.ts
 * ------------------------------------
 * Controller untuk CRUD User — hanya dapat diakses oleh Admin.
 *
 * Endpoint:
 *   GET    /api/users          → Daftar semua user
 *   GET    /api/users/:id      → Detail satu user
 *   POST   /api/users          → Tambah user baru
 *   PUT    /api/users/:id      → Edit user (nama, email, role)
 *   DELETE /api/users/:id      → Hapus user
 *   POST   /api/users/:id/reset-password → Reset password (Tahap 10)
 *
 * Keamanan:
 *   - Password tidak pernah dikembalikan dalam response
 *   - Admin tidak bisa hapus akun dirinya sendiri
 *   - Admin tidak bisa downgrade role dirinya sendiri
 *   - Semua query menggunakan prepared statement
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import { createError } from '../middlewares/error.middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Tipe data row tabel users
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

// Helper: Hapus field sensitif dari response
function sanitizeUser(user: UserRow) {
  const { password, reset_token, reset_token_expired_at, ...safe } = user;
  return safe;
}

// ---------------------------------------------------------------
// GET /api/users
// Daftar semua user
// ---------------------------------------------------------------
export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [rows] = await pool.execute<UserRow[]>(
      `SELECT id, nama, email, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      data:    rows,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// GET /api/users/:id
// Detail satu user berdasarkan ID
// ---------------------------------------------------------------
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute<UserRow[]>(
      `SELECT id, nama, email, role, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      throw createError(404, 'User tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      data:    rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// POST /api/users
// Tambah user baru (admin only)
// ---------------------------------------------------------------
export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nama, email, password, role } = req.body;

    // 1. Cek email duplikat
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existing.length > 0) {
      throw createError(409, 'Email sudah terdaftar');
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert user baru
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (nama, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [nama.trim(), email.toLowerCase(), hashedPassword, role]
    );

    // 4. Ambil data user yang baru dibuat (tanpa password)
    const [newUser] = await pool.execute<UserRow[]>(
      `SELECT id, nama, email, role, created_at, updated_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: `User "${nama}" berhasil ditambahkan`,
      data:    newUser[0],
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// PUT /api/users/:id
// Edit user: nama, email, role (TIDAK termasuk password)
// Admin tidak bisa mengubah role dirinya sendiri
// ---------------------------------------------------------------
export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id }  = req.params;
    const adminId = req.user!.id;

    // 1. Cek user ada
    const [existing] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw createError(404, 'User tidak ditemukan');
    }

    const current = existing[0];

    // 2. Proteksi: Admin tidak bisa mengubah role dirinya sendiri
    if (parseInt(id) === adminId && req.body.role && req.body.role !== current.role) {
      throw createError(403, 'Admin tidak dapat mengubah role akun sendiri');
    }

    // 3. Merge data — hanya update field yang dikirim
    const nama  = req.body.nama  ? req.body.nama.trim() : current.nama;
    const email = req.body.email ? req.body.email.toLowerCase() : current.email;
    const role  = req.body.role  || current.role;

    // 4. Cek email duplikat (kecuali dirinya sendiri)
    if (req.body.email && email !== current.email) {
      const [dupEmail] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      if (dupEmail.length > 0) {
        throw createError(409, 'Email sudah digunakan oleh user lain');
      }
    }

    // 5. Update user
    await pool.execute<ResultSetHeader>(
      `UPDATE users SET nama = ?, email = ?, role = ?
       WHERE id = ?`,
      [nama, email, role, id]
    );

    // 6. Ambil data terbaru
    const [updated] = await pool.execute<UserRow[]>(
      `SELECT id, nama, email, role, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Data user berhasil diperbarui',
      data:    updated[0],
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// DELETE /api/users/:id
// Hapus user (admin only)
// Admin tidak bisa menghapus akun dirinya sendiri
// ---------------------------------------------------------------
export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id }  = req.params;
    const adminId = req.user!.id;

    // Proteksi: Admin tidak bisa hapus dirinya sendiri
    if (parseInt(id) === adminId) {
      throw createError(403, 'Tidak dapat menghapus akun Anda sendiri');
    }

    // Cek user ada
    const [existing] = await pool.execute<UserRow[]>(
      'SELECT id, nama, email, role FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw createError(404, 'User tidak ditemukan');
    }

    const user = existing[0];

    // Hapus user
    await pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: `User "${user.nama}" (${user.email}) berhasil dihapus`,
    });
  } catch (error) {
    next(error);
  }
}
