// src/types/index.ts

export interface User {
  id: number;
  nama: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface Kategori {
  id: number;
  nama_kategori: string;
  deskripsi: string | null;
  created_at: string;
  updated_at: string;
}

export interface Barang {
  id: number;
  kode_barang: string;
  nama_barang: string;
  kategori_id: number;
  nama_kategori?: string; // Dari hasil JOIN
  kondisi: 'baik' | 'rusak_ringan' | 'rusak_berat';
  lokasi: string;
  jumlah: number;
  foto: string | null;
  foto_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
}
