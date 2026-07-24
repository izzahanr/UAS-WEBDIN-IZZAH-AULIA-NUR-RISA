/**
 * generate-hash.mjs
 * ------------------
 * Script helper untuk generate bcrypt hash password.
 * Digunakan untuk mengisi seed data di inventaris_lab.sql
 *
 * Cara pakai:
 *   node database/generate-hash.mjs
 *
 * Atau untuk password custom:
 *   node database/generate-hash.mjs "PasswordKamu123"
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Password default jika tidak ada argumen
const passwords = process.argv[2]
  ? [process.argv[2]]
  : ['Admin@123', 'Operator@123', 'Viewer@123'];

console.log('\n====================================');
console.log(' BCrypt Hash Generator');
console.log(' Untuk Seed Data inventaris_lab.sql');
console.log('====================================\n');

for (const password of passwords) {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  console.log(`Password : ${password}`);
  console.log(`Hash     : ${hash}`);
  console.log('---');
}
