/**
 * src/controllers/kategori.controller.ts
 * -----------------------------------------
 * Controller untuk CRUD Kategori Barang.
 *
 * Endpoint:
 *   GET    /api/kategori        → Daftar semua kategori (semua role)
 *   GET    /api/kategori/:id    → Detail satu kategori (semua role)
 *   POST   /api/kategori        → Tambah kategori (admin, operator)
 *   PUT    /api/kategori/:id    → Edit kategori (admin, operator)
 *   DELETE /api/kategori/:id    → Hapus kategori (admin only)
 *
 * Semua query menggunakan prepared statement (?) — anti SQL Injection.
 */

import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { createError } from '../middlewares/error.middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Tipe data row tabel kategori_barang
interface KategoriRow extends RowDataPacket {
  id:            number;
  nama_kategori: string;
  created_at:    Date;
  updated_at:    Date;
  jumlah_barang?: number; // dari LEFT JOIN (opsional)
}

// ---------------------------------------------------------------
// GET /api/kategori
// Ambil semua kategori + jumlah barang per kategori
// ---------------------------------------------------------------
export async function getAllKategori(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    /**
     * LEFT JOIN ke tabel barang untuk menghitung jumlah barang per kategori.
     * Viewer butuh info ini untuk UI filter.
     */
    const [rows] = await pool.execute<KategoriRow[]>(
      `SELECT
         k.id,
         k.nama_kategori,
         k.created_at,
         k.updated_at,
         COUNT(b.id) AS jumlah_barang
       FROM kategori_barang k
       LEFT JOIN barang b ON b.kategori_id = k.id
       GROUP BY k.id, k.nama_kategori, k.created_at, k.updated_at
       ORDER BY k.nama_kategori ASC`
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// GET /api/kategori/:id
// Detail satu kategori berdasarkan ID
// ---------------------------------------------------------------
export async function getKategoriById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute<KategoriRow[]>(
      `SELECT
         k.id,
         k.nama_kategori,
         k.created_at,
         k.updated_at,
         COUNT(b.id) AS jumlah_barang
       FROM kategori_barang k
       LEFT JOIN barang b ON b.kategori_id = k.id
       WHERE k.id = ?
       GROUP BY k.id, k.nama_kategori, k.created_at, k.updated_at`,
      [id]
    );

    if (rows.length === 0) {
      throw createError(404, 'Kategori tidak ditemukan');
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// POST /api/kategori
// Tambah kategori baru (admin & operator)
// ---------------------------------------------------------------
export async function createKategori(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nama_kategori } = req.body;

    // Cek duplikat nama kategori (case-insensitive)
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM kategori_barang WHERE LOWER(nama_kategori) = LOWER(?)',
      [nama_kategori]
    );

    if (existing.length > 0) {
      throw createError(409, `Kategori "${nama_kategori}" sudah ada`);
    }

    // Insert kategori baru
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO kategori_barang (nama_kategori) VALUES (?)',
      [nama_kategori.trim()]
    );

    // Ambil data yang baru dibuat
    const [newRows] = await pool.execute<KategoriRow[]>(
      'SELECT * FROM kategori_barang WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success:  true,
      message:  'Kategori berhasil ditambahkan',
      data:     newRows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// PUT /api/kategori/:id
// Edit kategori (admin & operator)
// ---------------------------------------------------------------
export async function updateKategori(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id }           = req.params;
    const { nama_kategori } = req.body;

    // Cek apakah kategori ada
    const [existing] = await pool.execute<KategoriRow[]>(
      'SELECT id FROM kategori_barang WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw createError(404, 'Kategori tidak ditemukan');
    }

    // Cek duplikat nama (kecuali dirinya sendiri)
    const [duplicate] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM kategori_barang WHERE LOWER(nama_kategori) = LOWER(?) AND id != ?',
      [nama_kategori, id]
    );

    if (duplicate.length > 0) {
      throw createError(409, `Nama kategori "${nama_kategori}" sudah digunakan`);
    }

    // Update
    await pool.execute<ResultSetHeader>(
      'UPDATE kategori_barang SET nama_kategori = ? WHERE id = ?',
      [nama_kategori.trim(), id]
    );

    // Ambil data terbaru
    const [updatedRows] = await pool.execute<KategoriRow[]>(
      'SELECT * FROM kategori_barang WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success:  true,
      message:  'Kategori berhasil diperbarui',
      data:     updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// DELETE /api/kategori/:id
// Hapus kategori (admin only)
// ---------------------------------------------------------------
export async function deleteKategori(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Cek apakah kategori ada
    const [existing] = await pool.execute<KategoriRow[]>(
      'SELECT id, nama_kategori FROM kategori_barang WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw createError(404, 'Kategori tidak ditemukan');
    }

    /**
     * Cek apakah ada barang yang masih menggunakan kategori ini.
     * Jika ada → tolak penghapusan agar data barang tidak yatim (orphaned).
     * Constraint ON DELETE RESTRICT di FK juga akan mencegah ini di DB level,
     * tapi kita beri pesan error yang lebih informatif di sini.
     */
    const [barangRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM barang WHERE kategori_id = ?',
      [id]
    );

    const totalBarang = (barangRows[0] as any).total;

    if (totalBarang > 0) {
      throw createError(
        409,
        `Kategori tidak dapat dihapus karena masih digunakan oleh ${totalBarang} barang. ` +
        `Pindahkan atau hapus barang tersebut terlebih dahulu.`
      );
    }

    // Hapus kategori
    await pool.execute<ResultSetHeader>(
      'DELETE FROM kategori_barang WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: `Kategori "${existing[0].nama_kategori}" berhasil dihapus`,
    });
  } catch (error) {
    next(error);
  }
}
