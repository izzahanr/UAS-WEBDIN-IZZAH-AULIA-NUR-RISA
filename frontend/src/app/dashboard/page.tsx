"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/utils/fetchApi';
import { ApiResponse } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, baik: 0, rusak: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetchApi<ApiResponse<any[]>>('/api/barang');
        if (response.success && response.data) {
          const barang = response.data;
          setStats({
            total: response.pagination?.total || barang.length,
            baik: barang.filter(b => b.kondisi === 'baik').length,
            rusak: barang.filter(b => b.kondisi !== 'baik').length,
          });
        }
      } catch (error) {
        console.error("Gagal mengambil data statistik", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-foreground">Selamat Datang, {user?.nama}! 👋</h2>
        <p className="text-slate-500 mt-2">Berikut adalah ringkasan inventaris laboratorium komputer saat ini.</p>
      </header>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="glass-card p-6 border-l-4 border-l-primary-500 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Total Barang</h3>
          {isLoading ? (
            <div className="h-9 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
          ) : (
            <p className="text-4xl font-extrabold text-foreground relative z-10">{stats.total}</p>
          )}
        </div>
        
        {/* Stat Card 2 */}
        <div className="glass-card p-6 border-l-4 border-l-emerald-500 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Kondisi Baik</h3>
          {isLoading ? (
            <div className="h-9 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
          ) : (
            <p className="text-4xl font-extrabold text-foreground relative z-10">{stats.baik}</p>
          )}
        </div>
        
        {/* Stat Card 3 */}
        <div className="glass-card p-6 border-l-4 border-l-rose-500 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Rusak / Perbaikan</h3>
          {isLoading ? (
            <div className="h-9 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
          ) : (
            <p className="text-4xl font-extrabold text-foreground relative z-10">{stats.rusak}</p>
          )}
        </div>
      </div>

      <div className="mt-12 glass-card p-10 text-center border-dashed border-2 border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Pusat Kendali Inventaris</h3>
        <p className="text-slate-500 max-w-lg mx-auto">
          Gunakan menu navigasi di sebelah kiri untuk mengelola data master Kategori, inventaris Barang, dan Pengguna sistem.
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
