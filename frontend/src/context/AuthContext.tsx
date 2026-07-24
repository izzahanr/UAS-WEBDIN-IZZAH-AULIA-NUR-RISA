"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ApiResponse } from '../types';
import { fetchApi } from '../utils/fetchApi';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load token dan user dari localStorage saat pertama kali mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verifikasi ke backend apakah token masih valid
        try {
          // fetchApi otomatis menggunakan token dari localStorage
          const response = await fetchApi<ApiResponse<User>>('/api/auth/me');
          if (response.success && response.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch (error) {
          // Token tidak valid atau expired
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Proteksi Route Otomatis
  useEffect(() => {
    if (!isLoading) {
      const isPublicPath = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname.startsWith('/reset-password');
      
      if (!user && !isPublicPath) {
        // Belum login tapi akses halaman private -> redirect ke login
        router.push('/login');
      } else if (user && pathname === '/login') {
        // Sudah login tapi akses halaman login -> redirect ke dashboard
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    router.push('/dashboard');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const checkAuth = async () => {
    try {
      const response = await fetchApi<ApiResponse<User>>('/api/auth/me');
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
