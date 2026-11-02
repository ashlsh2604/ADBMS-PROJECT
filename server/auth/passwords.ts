import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [algorithm, salt, hash] = stored.split(':');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== KEY_LENGTH) return false;
  const actual = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return timingSafeEqual(expected, actual);
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}
