/**
 * src/seeders/seed-users.ts
 * --------------------------
 * Seeder untuk mengisi tabel users dengan akun default.
 *
 * Cara menjalankan (dari folder backend/):
 *   npx ts-node src/seeders/seed-users.ts
 *
 * Akun yang dibuat:
 *   admin@inventaris.lab    → Admin@123   (role: admin)
 *   operator@inventaris.lab → Operator@123 (role: operator)
 *   viewer@inventaris.lab   → Viewer@123  (role: viewer)
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import bcrypt from 'bcrypt';
import pool from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const SALT_ROUNDS = 10;

const defaultUsers = [
  {
    nama:     'Administrator',
    email:    'admin@inventaris.lab',
    password: 'Admin@123',
    role:     'admin',
  },
  {
    nama:     'Operator Lab',
    email:    'operator@inventaris.lab',
    password: 'Operator@123',
    role:     'operator',
  },
  {
    nama:     'Mahasiswa Viewer',
    email:    'viewer@inventaris.lab',
    password: 'Viewer@123',
    role:     'viewer',
  },
];

async function seedUsers(): Promise<void> {
  console.log('\n🌱 Menjalankan Seeder: Users\n');

  for (const userData of defaultUsers) {
    // Cek apakah user sudah ada
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [userData.email]
    );

    if (existing.length > 0) {
      console.log(`⏭️  Skip: ${userData.email} (sudah ada)`);
      continue;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Insert ke database
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (nama, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [userData.nama, userData.email, hashedPassword, userData.role]
    );

    console.log(`✅ Berhasil: ${userData.email} (ID: ${result.insertId}, Role: ${userData.role})`);
  }

  console.log('\n✅ Seeder selesai!\n');
  console.log('Akun yang dapat digunakan:');
  console.log('┌─────────────────────────────┬──────────────┬──────────┐');
  console.log('│ Email                       │ Password     │ Role     │');
  console.log('├─────────────────────────────┼──────────────┼──────────┤');
  console.log('│ admin@inventaris.lab        │ Admin@123    │ admin    │');
  console.log('│ operator@inventaris.lab     │ Operator@123 │ operator │');
  console.log('│ viewer@inventaris.lab       │ Viewer@123   │ viewer   │');
  console.log('└─────────────────────────────┴──────────────┴──────────┘\n');

  await pool.end();
}

seedUsers().catch((err) => {
  console.error('❌ Seeder gagal:', err);
  process.exit(1);
});
