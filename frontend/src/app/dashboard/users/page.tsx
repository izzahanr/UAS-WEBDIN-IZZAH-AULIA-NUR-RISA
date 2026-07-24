"use client";

import React, { useState, useEffect } from 'react';
import { fetchApi, FetchError } from '@/utils/fetchApi';
import { ApiResponse, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ nama: '', email: '', password: '', role: 'viewer' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Keamanan sisi client: Jika bukan admin, tendang ke dashboard overview
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    } else {
      loadUsers();
    }
  }, [user, router]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi<ApiResponse<User[]>>('/api/users');
      if (response.success && response.data) {
        setUsersList(response.data);
      }
    } catch (err) {
      setError('Gagal memuat data pengguna. Pastikan Anda memiliki hak akses Admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ nama: '', email: '', password: '', role: 'viewer' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: User) => {
    setModalMode('edit');
    setCurrentId(item.id);
    setFormData({ nama: item.nama, email: item.email, password: '', role: item.role });
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
        await fetchApi('/api/users', { data: formData });
      } else if (modalMode === 'edit' && currentId) {
        // Jika password kosong, hapus dari payload agar tidak diubah
        const { password, ...rest } = formData;
        const payload = password ? formData : rest;
        
        await fetchApi(`/api/users/${currentId}`, { data: payload, method: 'PUT' });
      }
      closeModal();
      loadUsers();
    } catch (err: any) {
      if (err instanceof FetchError) alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus pengguna ini? Tindakan ini bersifat permanen.')) return;
    try {
      await fetchApi(`/api/users/${id}`, { method: 'DELETE' });
      loadUsers();
    } catch (err: any) {
      if (err instanceof FetchError) alert(err.message);
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Manajemen Pengguna</h2>
          <p className="text-slate-500 mt-1">Kontrol penuh atas akses dan peran dalam sistem (Admin Only).</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Registrasi Akun Baru
        </button>
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
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300">Nama</th>
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300">Email</th>
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300">Role</th>
                <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Memuat data pengguna...</td></tr>
              ) : usersList.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Tidak ada pengguna lain.</td></tr>
              ) : (
                usersList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 text-slate-500">#{item.id}</td>
                    <td className="py-4 px-6 font-medium text-foreground">
                      {item.nama}
                      {item.id === user?.id && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">Anda</span>}
                    </td>
                    <td className="py-4 px-6 text-slate-500">{item.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                        item.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        item.role === 'operator' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 flex justify-end gap-2 items-center">
                      <button onClick={() => openEditModal(item)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        disabled={item.id === user?.id} // Tidak bisa hapus diri sendiri (frontend lock, backend jg udh di lock)
                        className={`p-2 rounded-lg transition-colors ${item.id === user?.id ? 'text-slate-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`} 
                        title={item.id === user?.id ? "Tidak bisa menghapus akun sendiri" : "Hapus Pengguna"}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
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
            <h3 className="text-xl font-bold text-foreground mb-6">
              {modalMode === 'create' ? 'Daftarkan Pengguna Baru' : 'Edit Data Pengguna'}
            </h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                <input type="text" required
                  value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input type="email" required
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {modalMode === 'create' ? 'Password' : 'Password Baru (Kosongkan jika tidak diubah)'}
                </label>
                <input type={modalMode === 'create' ? "password" : "text"} 
                  required={modalMode === 'create'}
                  value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                  placeholder={modalMode === 'create' ? "Minimal 6 karakter" : "Biarkan kosong..."}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Role / Peran</label>
                <select required
                  value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                >
                  <option value="viewer">Viewer (Hanya Lihat)</option>
                  <option value="operator">Operator (Kelola Barang)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
                {modalMode === 'edit' && currentId === user?.id && (
                  <p className="text-xs text-amber-600 mt-1">* Backend akan menolak jika Anda mencoba menurunkan role Anda sendiri.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-md shadow-primary-500/20 disabled:opacity-70 transition-colors">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
