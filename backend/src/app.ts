/**
 * src/app.ts
 * -----------
 * Entry point aplikasi Express.js backend.
 *
 * Urutan middleware sangat penting di Express:
 * 1. Security & Parsing middleware (cors, json, urlencoded)
 * 2. Static files (untuk serve foto upload)
 * 3. Routes
 * 4. 404 handler
 * 5. Global error handler (HARUS paling terakhir)
 */

import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Config
import { testConnection } from './config/db';

// Middlewares
import { errorHandler, notFound } from './middlewares/error.middleware';

// Routes
import authRoutes     from './routes/auth.routes';
import kategoriRoutes from './routes/kategori.routes';
import barangRoutes   from './routes/barang.routes';
import userRoutes     from './routes/user.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------
// 1. CORS — izinkan request dari frontend (localhost:3001)
// ---------------------------------------------------------------
app.use(
  cors({
    origin: [
      'http://localhost:3001',       // Next.js dev server
      'http://127.0.0.1:3001',
    ],
    credentials: true,               // Izinkan cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---------------------------------------------------------------
// 2. Body Parsing
// ---------------------------------------------------------------
app.use(express.json());                          // Parse JSON body
app.use(express.urlencoded({ extended: true }));  // Parse form-urlencoded

// ---------------------------------------------------------------
// 3. Static Files — serve foto barang yang di-upload
//    Akses via: http://localhost:3000/uploads/nama-file.jpg
// ---------------------------------------------------------------
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'))
);

// ---------------------------------------------------------------
// 4. Health Check Route
// ---------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sistem Inventaris Laboratorium Komputer API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------
// 5. API Routes
// ---------------------------------------------------------------
app.use('/api/auth',     authRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/barang',   barangRoutes);
app.use('/api/users',    userRoutes);

// ---------------------------------------------------------------
// 6. 404 & Global Error Handler (HARUS di paling bawah)
// ---------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ---------------------------------------------------------------
// 7. Start Server
// ---------------------------------------------------------------
async function bootstrap(): Promise<void> {
  // Test koneksi database sebelum server mulai
  await testConnection();

  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🖥️  INVENTARIS LAB — BACKEND SERVER    ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║   Port   : http://localhost:${PORT}         ║`);
    console.log(`║   Mode   : ${process.env.NODE_ENV}                ║`);
    console.log(`║   DB     : ${process.env.DB_NAME}          ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
  });
}

bootstrap().catch((err) => {
  console.error('❌ Gagal menjalankan server:', err);
  process.exit(1);
});

export default app;
