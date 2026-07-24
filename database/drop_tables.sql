-- =============================================================
--  STRUKTUR DATABASE — Hanya DDL (tanpa seed data)
--  Gunakan file ini jika ingin reset schema saja
-- =============================================================

USE inventaris_lab;

-- Drop urutan terbalik agar tidak ada FK conflict
DROP TABLE IF EXISTS barang;
DROP TABLE IF EXISTS kategori_barang;
DROP TABLE IF EXISTS users;
