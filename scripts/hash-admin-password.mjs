import { subtle } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Kullanım: node scripts/hash-admin-password.mjs "SIFRE"');
  process.exit(1);
}

const iterations = 120000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const keyMaterial = await subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
const hashBuffer = await subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256);
const saltB64 = Buffer.from(salt).toString('base64');
const hashB64 = Buffer.from(new Uint8Array(hashBuffer)).toString('base64');
console.log(`PBKDF2$${iterations}$${saltB64}$${hashB64}`);
