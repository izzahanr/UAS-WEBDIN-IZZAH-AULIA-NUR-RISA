"use client";

import React, { useState, useEffect } from 'react';
import { fetchApi, FetchError } from '@/utils/fetchApi';
import { ApiResponse, Kategori } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function KategoriPage() {
  const { user } = useAuth();
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ nama_kategori: '', deskripsi: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadKategori = async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi<ApiResponse<Kategori[]>>('/api/kategori');
      if (response.success && response.data) {
        setKategoriList(response.data);
      }
    } catch (err) {
      setError('Gagal memuat data kategori');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKategori();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ nama_kategori: '', deskripsi: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Kategori) => {
    setModalMode('edit');
    setCurrentId(item.id);
    setFormData({ nama_kategori: item.nama_kategori, deskripsi: item.deskripsi || '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await fetchApi('/api/kategori', { data: formData });
      } else if (modalMode === 'edit' && currentId) {
        await fetchApi(`/api/kategori/${currentId}`, { data: formData, method: 'PUT' });
      }
      closeModal();
      loadKategori();
    } catch (err: any) {
      if (err instanceof FetchError) {
        alert(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      await fetchApi(`/api/kategori/${id}`, { method: 'DELETE' });
      loadKategori();
    } catch (err: any) {
      if (err instanceof FetchError) alert(err.message);
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'operator';
  const canDelete = user?.role === 'admin';

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Kategori Barang</h2>
          <p className="text-slate-500 mt-1">Kelola jenis klasifikasi untuk setiap aset.</p>
        </div>
        {canEdit && (
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Kategori
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100">{error}</div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300">ID</th>
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300">Nama Kategori</th>
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300">Deskripsi</th>
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300">Tgl. Dibuat</th>
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : kategoriList.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada kategori terdaftar.</td></tr>
              ) : (
                kategoriList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 text-slate-500">#{item.id}</td>
                    <td className="py-4 px-6 font-medium text-foreground">{item.nama_kategori}</td>
                    <td className="py-4 px-6 text-slate-500">{item.deskripsi || '-'}</td>
                    <td className="py-4 px-6 text-slate-500 text-sm">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="py-4 px-6 flex justify-end gap-2">
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
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="glass-card w-full max-w-md p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">
              {modalMode === 'create' ? 'Tambah Kategori Baru' : 'Edit Kategori'}
            </h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Kategori</label>
                <input 
                  type="text" 
                  value={formData.nama_kategori}
                  onChange={(e) => setFormData({...formData, nama_kategori: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Deskripsi (Opsional)</label>
                <textarea 
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-md shadow-primary-500/20 disabled:opacity-70 transition-colors">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
