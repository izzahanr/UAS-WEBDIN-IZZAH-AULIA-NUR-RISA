/**
 * src/middlewares/upload.middleware.ts
 * --------------------------------------
 * Middleware upload foto barang menggunakan Multer.
 *
 * Fitur:
 * - Validasi ekstensi file: hanya jpg, jpeg, png, webp
 * - Validasi ukuran file: maksimal 2MB (sesuai .env)
 * - Nama file unik: timestamp + random + ekstensi asli
 * - File disimpan ke folder /uploads/
 * - Error message yang jelas dan informatif
 *
 * Cara pakai di route:
 *   router.post('/:id/upload', authMiddleware, roleMiddleware, uploadMiddleware, controller)
 */

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// ---------------------------------------------------------------
// Konfigurasi folder upload
// ---------------------------------------------------------------
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Pastikan folder uploads ada (buat jika belum ada)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ---------------------------------------------------------------
// Ekstensi yang diizinkan
// ---------------------------------------------------------------
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIMETYPES  = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// ---------------------------------------------------------------
// Storage Engine: DiskStorage
// File disimpan di /uploads/ dengan nama yang unik
// ---------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (_req, file, cb) => {
    /**
     * Format nama file: barang-{timestamp}-{random}.{ext}
     * Contoh: barang-1721820000000-a3f7.jpg
     *
     * Alasan rename:
     * 1. Hindari nama file yang sama (overwrite)
     * 2. Hindari karakter spesial dari nama asli user
     * 3. Lebih mudah di-manage
     */
    const ext      = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const random   = Math.random().toString(36).substring(2, 6);
    const newName  = `barang-${timestamp}-${random}${ext}`;
    cb(null, newName);
  },
});

// ---------------------------------------------------------------
// File Filter: Validasi tipe file
// ---------------------------------------------------------------
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const ext     = path.extname(file.originalname).toLowerCase();
  const isValidExt      = ALLOWED_EXTENSIONS.includes(ext);
  const isValidMimetype = ALLOWED_MIMETYPES.includes(file.mimetype);

  if (isValidExt && isValidMimetype) {
    cb(null, true);
  } else {
    // Tolak file — kirim error ke multer error handler
    cb(
      new Error(
        `Format file tidak didukung. ` +
        `File yang diizinkan: ${ALLOWED_EXTENSIONS.join(', ')}`
      )
    );
  }
};

// ---------------------------------------------------------------
// Konfigurasi Multer
// ---------------------------------------------------------------
const MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE || '2097152'); // 2MB default

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE, // Batas ukuran file dalam bytes
    files:    1,        // Hanya izinkan 1 file per request
  },
}).single('foto'); // Field name 'foto' sesuai soal UAS

/**
 * Wrapper middleware: Tangani error Multer dan konversi ke format
 * error handler kita (AppError).
 *
 * Multer melempar error lewat callback, bukan next() — jadi perlu
 * wrapper agar error bisa ditangani oleh global error handler Express.
 */
export function handleUpload(
  req: Request,
  res: any,
  next: any
): void {
  uploadMiddleware(req, res, (err: any) => {
    if (!err) {
      // Upload berhasil, lanjut ke controller
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      // Error dari Multer (ukuran, jumlah file, dll)
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxMB = (MAX_SIZE / 1024 / 1024).toFixed(0);
        return next({
          statusCode: 413,
          message:    `Ukuran file terlalu besar. Maksimal ${maxMB}MB`,
        });
      }
      return next({
        statusCode: 400,
        message:    `Upload error: ${err.message}`,
      });
    }

    if (err instanceof Error) {
      // Error dari fileFilter (ekstensi tidak valid)
      return next({
        statusCode: 415,
        message:    err.message,
      });
    }

    next(err);
  });
}

/**
 * Helper: Hapus file lama dari folder uploads.
 * Digunakan saat user mengganti foto dengan foto baru.
 *
 * @param filename - Nama file yang akan dihapus (bukan full path)
 */
export function deleteUploadedFile(filename: string | null): void {
  if (!filename) return;

  const filePath = path.join(UPLOAD_DIR, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export { UPLOAD_DIR };
