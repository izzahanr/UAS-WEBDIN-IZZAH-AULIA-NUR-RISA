"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary-400/10 blur-[100px] pointer-events-none"></div>
      
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <main className="min-h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
