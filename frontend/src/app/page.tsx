"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Root URL otomatis redirect ke dashboard
    // Jika belum login, AuthContext yang akan melemparnya ke /login
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Memuat aplikasi...</p>
      </div>
    </div>
  );
}
