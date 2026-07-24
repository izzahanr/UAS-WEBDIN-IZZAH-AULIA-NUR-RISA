Sistem Informasi Inventaris Laboratorium Komputer

Proyek ini adalah tugas **UAS Pemrograman Web Dinamis**. Sistem ini dibangun dengan arsitektur **Full-Stack (Terpisah Backend & Frontend)** menggunakan arsitektur RESTful API.

**Nama:** Izzah Aulia Nur Risa (NIM: 0102523029)  
**Program Studi:** Informatika / Universitas Al Azhar Indonesia

---

## Teknologi yang Digunakan
- **Backend**: Node.js, Express.js, TypeScript, MySQL2 (Raw Query / Prepared Statements), JSON Web Token (JWT), Multer.
- **Frontend**: React, Next.js (App Router), Tailwind CSS v4.

---

## 1. Cara Instalasi

Pastikan komputer Anda sudah terinstal **Node.js** dan **XAMPP** (untuk MySQL).

1. Clone repositori ini:
   ```bash
   git clone https://github.com/izzahanr/UAS-WEBDIN-IZZAH-AULIA-NUR-RISA.git
   cd UAS-WEBDIN-IZZAH-AULIA-NUR-RISA
   ```
2. Instal *dependencies* untuk Backend:
   ```bash
   cd backend
   npm install
   cd ..
   ```
3. Instal *dependencies* untuk Frontend:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
4. Impor database:
   Buka `phpMyAdmin`, buat database bernama `inventaris_lab`, lalu impor file `database/inventaris_lab.sql`.

---

## 2. Konfigurasi `.env`

Di dalam folder `backend/`, buat sebuah file baru bernama `.env` (atau cukup *copy-paste* file `.env.example` lalu ubah namanya menjadi `.env`).

Isi file `.env` tersebut dengan konfigurasi berikut:

```env
# Server Port
PORT=3000

# Database Configuration (Sesuaikan dengan XAMPP masing-masing)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=inventaris_lab

# JWT Secret Key untuk Keamanan Token
JWT_SECRET=rahasia_super_aman_untuk_jwt_token_inventaris
```

---

##3. Cara Menjalankan Backend & Frontend

Anda perlu membuka **dua terminal** terpisah di VS Code.

**Terminal 1 (Menjalankan Backend / Port 3000):**
```bash
cd backend
npx ts-node src/app.ts
```
*(Pastikan XAMPP MySQL sudah dalam status "Start" sebelum menjalankan backend).*

**Terminal 2 (Menjalankan Frontend / Port 3001):**
```bash
cd frontend
npm run dev -- -p 3001
```

Setelah keduanya berjalan, buka browser dan akses aplikasi melalui: **http://localhost:3001**

---

## 4. Daftar Akun Uji Coba

Database sudah memiliki data bawaan (*seeder*). Silakan gunakan akun berikut untuk masuk ke dalam sistem:

| Role | Email Login | Password | Hak Akses |
|---|---|---|---|
| **Admin** | `admin@inventaris.lab` | `Admin@123` | *Full Access* (CRUD User, Barang, Kategori). |
| **Operator** | `operator@inventaris.lab` | `Operator@123` | Bisa menambah/edit Barang & Kategori. Tidak bisa kelola User. |
| **Viewer** | `viewer@inventaris.lab` | `Viewer@123` | Hanya bisa melihat data (*Read-Only*). |

---

## 5. Daftar Endpoint API (Backend)

Seluruh request yang membutuhkan otentikasi wajib menyertakan token JWT pada *Headers*:  
`Authorization: Bearer <token_anda>`

### A. Autentikasi (`/api/auth`)
- `POST /api/auth/register` — Registrasi akun baru.
- `POST /api/auth/login` — Login pengguna dan mendapatkan token JWT.
- `GET /api/auth/me` — Mengambil data profil pengguna yang sedang login.
- `POST /api/auth/logout` — Proses logout (penghapusan token di *client*).

### B. Manajemen Pengguna (`/api/users`) — *Admin Only*
- `GET /api/users` — Mengambil semua daftar pengguna.
- `POST /api/users` — Admin mendaftarkan pengguna/operator baru.
- `PUT /api/users/:id` — Mengubah data atau *role* pengguna.
- `DELETE /api/users/:id` — Menghapus pengguna (Aman: Admin tidak bisa menghapus dirinya sendiri).
- `POST /api/users/:id/reset-password` — (Tahap 10) Meng-generate *token reset password*.

### C. Manajemen Kategori (`/api/kategori`) — *Admin & Operator*
- `GET /api/kategori` — Mengambil semua data kategori (Bisa diakses Viewer).
- `POST /api/kategori` — Membuat kategori baru.
- `PUT /api/kategori/:id` — Mengedit kategori yang ada.
- `DELETE /api/kategori/:id` — Menghapus kategori (Hanya Admin).

### D. Manajemen Barang (`/api/barang`) — *Admin & Operator*
- `GET /api/barang` — Mengambil daftar barang (*Support query* `?search=`, `?page=`, `?limit=`, `?kategori=`, `?kondisi=`).
- `GET /api/barang/:id` — Mengambil detail spesifik satu barang.
- `POST /api/barang` — Menambah barang baru (Mendukung upload `multipart/form-data` untuk **Foto**).
- `PUT /api/barang/:id` — Memperbarui data barang.
- `DELETE /api/barang/:id` — Menghapus barang (Hanya Admin).
