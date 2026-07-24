/**
 * src/controllers/barang.controller.ts
 * ---------------------------------------
 * Controller untuk CRUD Barang Inventaris.
 *
 * Endpoint:
 *   GET    /api/barang              → Daftar barang (search + filter + pagination — Tahap 8)
 *   GET    /api/barang/:id          → Detail satu barang
 *   POST   /api/barang              → Tambah barang baru (admin, operator)
 *   PUT    /api/barang/:id          → Edit barang (admin, operator)
 *   DELETE /api/barang/:id          → Hapus barang (admin only)
 *   POST   /api/barang/:id/upload   → Upload foto (Tahap 7)
 *
 * Semua query menggunakan prepared statement mysql2 (?) — anti SQL Injection.
 */

import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { createError } from '../middlewares/error.middleware';
import { deleteUploadedFile } from '../middlewares/upload.middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Tipe data row JOIN barang + kategori
interface BarangRow extends RowDataPacket {
  id:            number;
  kode_barang:   string;
  nama_barang:   string;
  kategori_id:   number;
  nama_kategori: string;
  kondisi:       'baik' | 'rusak_ringan' | 'rusak_berat';
  lokasi:        string;
  jumlah:        number;
  foto:          string | null;
  created_at:    Date;
  updated_at:    Date;
}

// ---------------------------------------------------------------
// GET /api/barang
// Daftar semua barang dengan JOIN kategori
// Search + Filter + Pagination ditambahkan di Tahap 8
// ---------------------------------------------------------------
export async function getAllBarang(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // ── Query params ──────────────────────────────────────────
    const search     = (req.query.search     as string) || '';
    const kategori   = (req.query.kategori   as string) || '';
    const kondisi    = (req.query.kondisi     as string) || '';
    const page       = Math.max(1, parseInt(req.query.page   as string) || 1);
    const limit      = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset     = (page - 1) * limit;

    // ── Build WHERE clause secara dinamis ─────────────────────
    const conditions: string[] = [];
    const params:     any[]    = [];

    if (search) {
      conditions.push('(b.kode_barang LIKE ? OR b.nama_barang LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (kategori) {
      conditions.push('b.kategori_id = ?');
      params.push(parseInt(kategori));
    }

    if (kondisi && ['baik', 'rusak_ringan', 'rusak_berat'].includes(kondisi)) {
      conditions.push('b.kondisi = ?');
      params.push(kondisi);
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    // ── Query total data (untuk pagination) ──────────────────
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM barang b
       JOIN kategori_barang k ON b.kategori_id = k.id
       ${whereClause}`,
      params as any
    );
    const total      = (countRows[0] as any).total as number;
    const totalPages = Math.ceil(total / limit);

    // ── Query data utama ──────────────────────────────────────
    const [rows] = await pool.execute<BarangRow[]>(
      `SELECT
         b.id,
         b.kode_barang,
         b.nama_barang,
         b.kategori_id,
         k.nama_kategori,
         b.kondisi,
         b.lokasi,
         b.jumlah,
         b.foto,
         b.created_at,
         b.updated_at
       FROM barang b
       JOIN kategori_barang k ON b.kategori_id = k.id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset] as any
    );

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// GET /api/barang/:id
// Detail satu barang berdasarkan ID
// ---------------------------------------------------------------
export async function getBarangById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute<BarangRow[]>(
      `SELECT
         b.id,
         b.kode_barang,
         b.nama_barang,
         b.kategori_id,
         k.nama_kategori,
         b.kondisi,
         b.lokasi,
         b.jumlah,
         b.foto,
         b.created_at,
         b.updated_at
       FROM barang b
       JOIN kategori_barang k ON b.kategori_id = k.id
       WHERE b.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      throw createError(404, 'Barang tidak ditemukan');
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
// POST /api/barang
// Tambah barang baru (admin & operator)
// ---------------------------------------------------------------
export async function createBarang(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      kode_barang,
      nama_barang,
      kategori_id,
      kondisi,
      lokasi,
      jumlah,
    } = req.body;

    // 1. Cek kode barang unik
    const [existingKode] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM barang WHERE kode_barang = ?',
      [kode_barang.trim().toUpperCase()]
    );

    if (existingKode.length > 0) {
      throw createError(409, `Kode barang "${kode_barang}" sudah digunakan`);
    }

    // 2. Cek kategori_id valid & ada di database
    const [kategoriExists] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM kategori_barang WHERE id = ?',
      [kategori_id]
    );

    if (kategoriExists.length === 0) {
      throw createError(422, 'Kategori tidak ditemukan');
    }

    // 3. Insert barang baru
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO barang
         (kode_barang, nama_barang, kategori_id, kondisi, lokasi, jumlah)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        kode_barang.trim().toUpperCase(),
        nama_barang.trim(),
        kategori_id,
        kondisi,
        lokasi.trim(),
        jumlah,
      ]
    );

    // 4. Ambil data yang baru dibuat (dengan JOIN kategori)
    const [newRows] = await pool.execute<BarangRow[]>(
      `SELECT b.*, k.nama_kategori
       FROM barang b
       JOIN kategori_barang k ON b.kategori_id = k.id
       WHERE b.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Barang berhasil ditambahkan',
      data:    newRows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// PUT /api/barang/:id
// Edit barang (admin & operator)
// Mendukung partial update — hanya field yang dikirim yang diupdate
// ---------------------------------------------------------------
export async function updateBarang(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // 1. Cek barang ada
    const [existing] = await pool.execute<BarangRow[]>(
      'SELECT * FROM barang WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw createError(404, 'Barang tidak ditemukan');
    }

    const current = existing[0];

    // 2. Merge: pakai nilai lama jika field tidak dikirim (partial update)
    const {
      kode_barang  = current.kode_barang,
      nama_barang  = current.nama_barang,
      kategori_id  = current.kategori_id,
      kondisi      = current.kondisi,
      lokasi       = current.lokasi,
      jumlah       = current.jumlah,
    } = req.body;

    // 3. Cek kode duplikat (kecuali dirinya sendiri)
    if (req.body.kode_barang) {
      const [dupKode] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM barang WHERE kode_barang = ? AND id != ?',
        [kode_barang.trim().toUpperCase(), id]
      );
      if (dupKode.length > 0) {
        throw createError(409, `Kode barang "${kode_barang}" sudah digunakan oleh barang lain`);
      }
    }

    // 4. Cek kategori valid jika diubah
    if (req.body.kategori_id) {
      const [katExists] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM kategori_barang WHERE id = ?',
        [kategori_id]
      );
      if (katExists.length === 0) {
        throw createError(422, 'Kategori tidak ditemukan');
      }
    }

    // 5. Update
    await pool.execute<ResultSetHeader>(
      `UPDATE barang
       SET kode_barang = ?,
           nama_barang = ?,
           kategori_id = ?,
           kondisi     = ?,
           lokasi      = ?,
           jumlah      = ?
       WHERE id = ?`,
      [
        (typeof kode_barang === 'string' ? kode_barang.trim().toUpperCase() : kode_barang),
        (typeof nama_barang === 'string' ? nama_barang.trim() : nama_barang),
        kategori_id,
        kondisi,
        (typeof lokasi === 'string' ? lokasi.trim() : lokasi),
        jumlah,
        id,
      ]
    );

    // 6. Ambil data terbaru
    const [updatedRows] = await pool.execute<BarangRow[]>(
      `SELECT b.*, k.nama_kategori
       FROM barang b
       JOIN kategori_barang k ON b.kategori_id = k.id
       WHERE b.id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Barang berhasil diperbarui',
      data:    updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// DELETE /api/barang/:id
// Hapus barang (admin only)
// ---------------------------------------------------------------
export async function deleteBarang(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Cek apakah barang ada
    const [existing] = await pool.execute<BarangRow[]>(
      'SELECT id, kode_barang, nama_barang, foto FROM barang WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw createError(404, 'Barang tidak ditemukan');
    }

    const barang = existing[0];

    // Hapus file foto jika ada
    if (barang.foto) {
      deleteUploadedFile(barang.foto);
    }

    // Hapus record dari database
    await pool.execute<ResultSetHeader>(
      'DELETE FROM barang WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: `Barang "${barang.nama_barang}" (${barang.kode_barang}) berhasil dihapus`,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------
// POST /api/barang/:id/upload
// Upload / ganti foto barang (admin & operator)
// ---------------------------------------------------------------
export async function uploadFoto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // 1. Pastikan ada file yang diupload
    if (!req.file) {
      throw createError(400, 'Tidak ada file yang diupload. Pastikan menggunakan field "foto"');
    }

    // 2. Cek apakah barang ada
    const [existing] = await pool.execute<BarangRow[]>(
      'SELECT id, nama_barang, foto FROM barang WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      // Hapus file yang sudah terlanjur diupload
      deleteUploadedFile(req.file.filename);
      throw createError(404, 'Barang tidak ditemukan');
    }

    const oldFoto = existing[0].foto;

    // 3. Update kolom foto di database
    await pool.execute<ResultSetHeader>(
      'UPDATE barang SET foto = ? WHERE id = ?',
      [req.file.filename, id]
    );

    // 4. Hapus foto LAMA setelah DB berhasil diupdate
    if (oldFoto) {
      deleteUploadedFile(oldFoto);
    }

    // 5. Return info foto baru
    const fotoUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success:  true,
      message:  'Foto barang berhasil diupload',
      data: {
        id:           parseInt(id),
        nama_barang:  existing[0].nama_barang,
        foto:         req.file.filename,
        foto_url:     fotoUrl,
        size_bytes:   req.file.size,
        original_name: req.file.originalname,
      },
    });
  } catch (error) {
    // Jika ada error setelah file diupload, hapus file tersebut
    if (req.file) {
      deleteUploadedFile(req.file.filename);
    }
    next(error);
  }
}
