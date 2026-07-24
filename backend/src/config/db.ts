/**
 * src/config/db.ts
 * -----------------
 * Konfigurasi koneksi MySQL menggunakan mysql2/promise (pool connection).
 *
 * Menggunakan Pool (bukan single connection) karena:
 * - Lebih efisien: koneksi di-reuse, tidak buat baru tiap request
 * - Thread-safe untuk concurrent requests
 * - Auto reconnect jika koneksi putus
 *
 * Semua query WAJIB menggunakan prepared statement (?) bukan string concat
 * untuk mencegah SQL Injection.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Buat connection pool ke MySQL
const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            parseInt(process.env.DB_PORT || '3306'),
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'inventaris_lab',
  waitForConnections: true,
  connectionLimit:    10,   // max 10 koneksi bersamaan
  queueLimit:         0,    // unlimited queue
  charset:           'utf8mb4',
});

/**
 * Test koneksi database saat startup.
 * Jika gagal, server tidak akan berjalan.
 */
export async function testConnection(): Promise<void> {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Koneksi MySQL berhasil — database:', process.env.DB_NAME);
    conn.release();
  } catch (error) {
    console.error('❌ Gagal koneksi ke MySQL:', error);
    process.exit(1); // hentikan server jika DB tidak bisa diakses
  }
}

export default pool;
