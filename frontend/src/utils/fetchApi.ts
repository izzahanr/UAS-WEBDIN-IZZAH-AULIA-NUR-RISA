// src/utils/fetchApi.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  data?: any;
  requireAuth?: boolean; // Jika true, otomatis ambil token dari localStorage
}

export class FetchError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'FetchError';
  }
}

/**
 * Custom wrapper untuk Fetch API agar mudah digunakan dan terstandardisasi.
 */
export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, requireAuth = true, headers: customHeaders, ...customConfig } = options;

  const headers: HeadersInit = {
    ...customHeaders,
  };

  // Jika mengirim data berupa JSON (bukan FormData), set Content-Type
  if (data && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Jika butuh auth, set Bearer token
  if (requireAuth) {
    // Pastikan jalan di sisi client (browser)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    headers,
    ...customConfig,
  };

  if (data) {
    config.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Tangani response kosong (misal DELETE sukses 204 atau tanpa body)
    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      // Jika terjadi error dari API, lemparkan sebagai FetchError
      const errorMessage = result.message || result.errors?.[0]?.msg || 'Terjadi kesalahan pada server';
      throw new FetchError(response.status, errorMessage, result);
    }

    return result;
  } catch (error) {
    if (error instanceof FetchError) {
      throw error;
    }
    throw new FetchError(500, 'Gagal terhubung ke server');
  }
}
