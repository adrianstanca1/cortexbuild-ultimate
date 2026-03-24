/**
 * ============================================
 * CORTEXBUILD ULTIMATE - Encryption Utilities
 * ============================================
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(KEY_LENGTH).toString('hex');

function deriveKey(key: string): Buffer {
  return crypto.scryptSync(key, 'salt', KEY_LENGTH);
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(encryptionKey);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex'),
  });
}

export function decrypt(encryptedData: string): string {
  const { iv, encrypted, authTag } = JSON.parse(encryptedData);
  
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');
  const key = deriveKey(encryptionKey);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(authTagBuffer);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const hashToCompare = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashToCompare, 'hex'));
}

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
