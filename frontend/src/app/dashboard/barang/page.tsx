"use client";

import React, { useState, useEffect, useRef } from 'react';
import { fetchApi, FetchError } from '@/utils/fetchApi';
import { ApiResponse, Barang, Kategori } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function BarangPage() {
  const { user } = useAuth();
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination, Search & Filter state
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ 
    kode_barang: '', 
    nama_barang: '', 
    kategori_id: '',
    kondisi: 'baik',
    lokasi: '',
    jumlah: '1'
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fungsi untuk mengambil data barang dan kategori dari API Backend (Database)
  const loadData = async (currentPage = 1, searchQuery = '', katFilter = '', konFilter = '') => {
    setIsLoading(true);
    try {
      // Load Barang (dengan pagination, search, dan filter)
      let url = `/api/barang?page=${currentPage}&limit=5`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (katFilter) url += `&kategori=${encodeURIComponent(katFilter)}`;
      if (konFilter) url += `&kondisi=${encodeURIComponent(konFilter)}`;

      const resBarang = await fetchApi<ApiResponse<Barang[]>>(url);
      if (resBarang.success && resBarang.data) {
        setBarangList(resBarang.data);
        if (resBarang.pagination) {
          setTotalPages(resBarang.pagination.totalPages);
          setPage(resBarang.pagination.page);
        }
      }

      // Load Kategori untuk dropdown (jika belum diload)
      if (kategoriList.length === 0) {
        const resKategori = await fetchApi<ApiResponse<Kategori[]>>('/api/kategori');
        if (resKategori.success && resKategori.data) {
          setKategoriList(resKategori.data);
        }
      }
    } catch (err) {
      setError('Gagal memuat data barang');
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi yang otomatis berjalan saat teks pencarian atau filter diubah (dengan jeda 0.5 detik / debounce)
  useEffect(() => {
    // Debounce search
    const delay = setTimeout(() => {
      loadData(1, search, filterKategori, filterKondisi);
    }, 500);
    return () => clearTimeout(delay);
  }, [search, filterKategori, filterKondisi]);

  // Fungsi untuk membuka form (modal) dalam mode Tambah Barang Baru
  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ kode_barang: '', nama_barang: '', kategori_id: '', kondisi: 'baik', lokasi: '', jumlah: '1' });
    setFotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  // Fungsi untuk membuka form (modal) dalam mode Edit (Ubah) Barang beserta datanya
  const openEditModal = (item: Barang) => {
    setModalMode('edit');
    setCurrentId(item.id);
    setFormData({ 
      kode_barang: item.kode_barang, 
      nama_barang: item.nama_barang, 
      kategori_id: item.kategori_id.toString(), 
      kondisi: item.kondisi, 
      lokasi: item.lokasi || '',
      jumlah: item.jumlah.toString() 
    });
    setFotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentId(null);
  };

  // Fungsi yang dieksekusi saat tombol "Simpan" pada form ditekan (menambah/mengubah data ke backend)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let savedBarangId = currentId;

      const jsonData = {
        kode_barang: formData.kode_barang,
        nama_barang: formData.nama_barang,
        kategori_id: parseInt(formData.kategori_id, 10),
        kondisi: formData.kondisi,
        lokasi: formData.lokasi,
        jumlah: parseInt(formData.jumlah, 10)
      };

      if (modalMode === 'create') {
        const res = await fetchApi<ApiResponse<Barang>>('/api/barang', { data: jsonData });
        if (res.data) {
          savedBarangId = res.data.id;
        }
      } else if (modalMode === 'edit' && currentId) {
        await fetchApi(`/api/barang/${currentId}`, { data: jsonData, method: 'PUT' });
      }

      if (fotoFile && savedBarangId) {
        const uploadPayload = new FormData();
        uploadPayload.append('foto', fotoFile);
        await fetchApi(`/api/barang/${savedBarangId}/upload`, { 
          data: uploadPayload, 
          method: 'POST' 
        });
      }

      closeModal();
      loadData(page, search, filterKategori, filterKondisi);
    } catch (err: any) {
      if (err instanceof FetchError) alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi yang dieksekusi saat tombol Hapus (logo tempat sampah) ditekan (mengirim perintah hapus ke backend)
  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus barang ini? (Tindakan ini tidak bisa dibatalkan)')) return;
    try {
      await fetchApi(`/api/barang/${id}`, { method: 'DELETE' });
      loadData(page, search, filterKategori, filterKondisi);
    } catch (err: any) {
      if (err instanceof FetchError) alert(err.message);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) loadData(page - 1, search, filterKategori, filterKondisi);
  };

  const handleNextPage = () => {
    if (page < totalPages) loadData(page + 1, search, filterKategori, filterKondisi);
  };

  // Variabel pengecekan Hak Akses: Hanya admin/operator yang bisa tambah/edit, dan HANYA admin yang bisa hapus
  const canEdit = user?.role === 'admin' || user?.role === 'operator';
  const canDelete = user?.role === 'admin';

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Inventaris Barang</h2>
          <p className="text-slate-500 mt-1">Data master perangkat dan aset laboratorium.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-sm"
            />
          </div>

          {/* Filter Kategori */}
          <select 
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full sm:w-36 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-sm"
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map(k => (
              <option key={k.id} value={k.id}>{k.nama_kategori}</option>
            ))}
          </select>

          {/* Filter Kondisi */}
          <select 
            value={filterKondisi}
            onChange={(e) => setFilterKondisi(e.target.value)}
            className="w-full sm:w-36 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-sm"
          >
            <option value="">Semua Kondisi</option>
            <option value="baik">Baik</option>
            <option value="rusak_ringan">Rusak Ringan</option>
            <option value="rusak_berat">Rusak Berat</option>
          </select>

          {canEdit && (
            <button 
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5 whitespace-nowrap w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tambah Barang
            </button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300 w-24">Foto</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">Kode</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">Nama Barang</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">Kategori</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">Kondisi</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Jumlah</th>
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">Memuat data...</td></tr>
              ) : barangList.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">Tidak ada barang yang ditemukan.</td></tr>
              ) : (
                barangList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-6">
                      {item.foto_url ? (
                        <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden relative bg-white">
                          {/* Note: In real next.js, domain API must be added to next.config.ts if using next/image */}
                          <img src={item.foto_url} alt={item.nama_barang} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-sm text-slate-500">{item.kode_barang}</td>
                    <td className="py-4 px-4 font-medium text-foreground">{item.nama_barang}</td>
                    <td className="py-4 px-4 text-slate-500">{item.nama_kategori}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.kondisi === 'baik' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        item.kondisi === 'rusak_ringan' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}>
                        {item.kondisi.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-foreground">{item.jumlah}</td>
                    <td className="py-4 px-6 flex justify-end gap-2 items-center h-full mt-2">
                      {canEdit ? (
                        <button onClick={() => openEditModal(item)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      ) : <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>}
                      
                      {canDelete && (
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-500">Halaman {page} dari {totalPages}</p>
            <div className="flex gap-2">
              <button 
                onClick={handlePrevPage} disabled={page === 1}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              <button 
                onClick={handleNextPage} disabled={page === totalPages}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="glass-card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-foreground mb-6">
              {modalMode === 'create' ? 'Tambah Barang Baru' : 'Edit Barang'}
            </h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Kode Barang</label>
                <input type="text" required
                  value={formData.kode_barang} onChange={(e) => setFormData({...formData, kode_barang: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Barang</label>
                <input type="text" required
                  value={formData.nama_barang} onChange={(e) => setFormData({...formData, nama_barang: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                <select required
                  value={formData.kategori_id} onChange={(e) => setFormData({...formData, kategori_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                >
                  <option value="" disabled>Pilih Kategori</option>
                  {kategoriList.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Kondisi</label>
                <select required
                  value={formData.kondisi} onChange={(e) => setFormData({...formData, kondisi: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                >
                  <option value="baik">Baik</option>
                  <option value="rusak_ringan">Rusak Ringan</option>
                  <option value="rusak_berat">Rusak Berat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Lokasi</label>
                <input type="text" required
                  value={formData.lokasi} onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Jumlah</label>
                <input type="number" required min="1"
                  value={formData.jumlah} onChange={(e) => setFormData({...formData, jumlah: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Foto Barang (Opsional)</label>
                <input type="file" accept="image/*" ref={fileInputRef}
                  onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white/50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-md shadow-primary-500/20 disabled:opacity-70 transition-colors">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
