-- =============================================================
--  SISTEM INVENTARIS LABORATORIUM KOMPUTER
--  UAS Pemrograman Web Dinamis
--  Nama  : Izzah Aulia Nur Risa
--  NIM   : 0102523029
--  Prodi : Informatika — Universitas Al Azhar Indonesia
-- =============================================================
--  File  : inventaris_lab.sql
--  Desc  : Script DDL + DML untuk inisialisasi database
--  Cara pakai:
--    mysql -u root -p < inventaris_lab.sql
--  atau jalankan via phpMyAdmin / DBeaver / MySQL Workbench
-- =============================================================

-- ---------------------------------------------------------------
-- 1. CREATE & USE DATABASE
-- ---------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS inventaris_lab
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventaris_lab;

-- ---------------------------------------------------------------
-- 2. TABEL: users
--    Menyimpan data akun pengguna sistem (Admin, Operator, Viewer)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                     INT           NOT NULL AUTO_INCREMENT,
  nama                   VARCHAR(100)  NOT NULL,
  email                  VARCHAR(100)  NOT NULL,
  password               VARCHAR(255)  NOT NULL   COMMENT 'Hashed dengan bcrypt',
  role                   ENUM(
                           'admin',
                           'operator',
                           'viewer'
                         )             NOT NULL DEFAULT 'viewer',
  reset_token            VARCHAR(255)  NULL       DEFAULT NULL
                           COMMENT 'Token sementara untuk reset password',
  reset_token_expired_at DATETIME      NULL       DEFAULT NULL
                           COMMENT 'Waktu kedaluwarsa token reset',
  created_at             TIMESTAMP     NOT NULL   DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP     NOT NULL   DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabel akun pengguna sistem inventaris';

-- ---------------------------------------------------------------
-- 3. TABEL: kategori_barang
--    Menyimpan kategori/jenis perangkat laboratorium
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kategori_barang (
  id            INT          NOT NULL AUTO_INCREMENT,
  nama_kategori VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_kategori_nama (nama_kategori)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabel kategori perangkat laboratorium komputer';

-- ---------------------------------------------------------------
-- 4. TABEL: barang
--    Menyimpan data inventaris perangkat laboratorium
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS barang (
  id           INT           NOT NULL AUTO_INCREMENT,
  kode_barang  VARCHAR(50)   NOT NULL                COMMENT 'Kode unik barang, contoh: KMP-001',
  nama_barang  VARCHAR(200)  NOT NULL,
  kategori_id  INT           NOT NULL,
  kondisi      ENUM(
                 'baik',
                 'rusak_ringan',
                 'rusak_berat'
               )             NOT NULL DEFAULT 'baik',
  lokasi       VARCHAR(100)  NOT NULL                COMMENT 'Contoh: Lab A - Meja 01',
  jumlah       INT           NOT NULL DEFAULT 1,
  foto         VARCHAR(255)  NULL     DEFAULT NULL   COMMENT 'Nama file foto di folder /uploads',
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_barang_kode (kode_barang),

  -- Foreign Key ke kategori_barang
  CONSTRAINT fk_barang_kategori
    FOREIGN KEY (kategori_id)
    REFERENCES kategori_barang (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  -- Index untuk mempercepat query search & filter
  INDEX idx_barang_nama    (nama_barang),
  INDEX idx_barang_kondisi (kondisi),
  INDEX idx_barang_lokasi  (lokasi)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabel inventaris perangkat laboratorium komputer';

-- ---------------------------------------------------------------
-- 5. SEED DATA: Akun Default
--
--    PENTING: Hash di bawah ini adalah PLACEHOLDER sementara.
--    Setelah backend disetup (Tahap 3), jalankan:
--      cd backend && node database/generate-hash.mjs
--    lalu update nilai hash di bawah ini.
--
--    Untuk sementara (demo/development), hash di bawah adalah
--    bcrypt hash dari string 'password' dengan rounds=10:
--      $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh
--
--    Akun yang akan dibuat:
--      admin@inventaris.lab    → password: Admin@123
--      operator@inventaris.lab → password: Operator@123
--      viewer@inventaris.lab   → password: Viewer@123
--
--    Hash akan diganti saat menjalankan seeder Tahap 4.
-- ---------------------------------------------------------------

-- [PLACEHOLDER] Hash akan diperbarui di Tahap 4
-- Jalankan script: backend/src/seeders/seed-users.ts
-- untuk mengisi data dengan hash yang benar

-- Jika ingin manual via SQL langsung (setelah bcrypt tersedia):
-- INSERT INTO users (nama, email, password, role) VALUES
--   ('Administrator',    'admin@inventaris.lab',    'HASH_ADMIN',    'admin'),
--   ('Operator Lab',     'operator@inventaris.lab', 'HASH_OPERATOR', 'operator'),
--   ('Mahasiswa Viewer', 'viewer@inventaris.lab',   'HASH_VIEWER',   'viewer');

-- Untuk keperluan development sementara, isi password manual via:
--   node -e "require('bcrypt').hash('Admin@123',10).then(console.log)"
-- Lalu paste hasilnya ke query di atas.

-- ---------------------------------------------------------------
-- 6. SEED DATA: Kategori Barang
-- ---------------------------------------------------------------
INSERT INTO kategori_barang (nama_kategori) VALUES
  ('Komputer Desktop'),
  ('Laptop'),
  ('Monitor'),
  ('Keyboard & Mouse'),
  ('Printer & Scanner'),
  ('Jaringan (Network)'),
  ('Proyektor'),
  ('UPS & Power'),
  ('Penyimpanan (Storage)'),
  ('Lain-lain');

-- ---------------------------------------------------------------
-- 7. SEED DATA: Barang Contoh
-- ---------------------------------------------------------------
INSERT INTO barang (kode_barang, nama_barang, kategori_id, kondisi, lokasi, jumlah) VALUES
  ('KMP-001', 'PC Dell OptiPlex 7090',       1, 'baik',         'Lab A - Meja 01', 1),
  ('KMP-002', 'PC Dell OptiPlex 7090',       1, 'baik',         'Lab A - Meja 02', 1),
  ('KMP-003', 'PC Lenovo ThinkCentre M720',  1, 'rusak_ringan', 'Lab A - Meja 03', 1),
  ('LPT-001', 'Laptop Asus VivoBook 15',     2, 'baik',         'Ruang Instruktur', 1),
  ('LPT-002', 'Laptop Lenovo IdeaPad 3',     2, 'baik',         'Ruang Instruktur', 1),
  ('MON-001', 'Monitor Samsung 24" FHD',     3, 'baik',         'Lab A - Meja 01', 1),
  ('MON-002', 'Monitor LG 22" FHD',          3, 'rusak_berat',  'Gudang',          1),
  ('PRN-001', 'Printer HP LaserJet M402',    5, 'baik',         'Ruang Admin',     1),
  ('NET-001', 'Switch TP-Link 24 Port',      6, 'baik',         'Rak Server',      2),
  ('PRJ-001', 'Proyektor Epson EB-X51',      7, 'baik',         'Lab A - Depan',   1);

-- ---------------------------------------------------------------
-- 8. VERIFIKASI — Query cek hasil insert
-- ---------------------------------------------------------------
-- SELECT * FROM users;
-- SELECT * FROM kategori_barang;
-- SELECT b.*, k.nama_kategori FROM barang b JOIN kategori_barang k ON b.kategori_id = k.id;
