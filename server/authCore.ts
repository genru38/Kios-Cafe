import crypto from 'node:crypto';

export interface StoredCredentials {
  username: string;
  passwordSalt: string;
  passwordHash: string;
  updatedAt: number;
}

export interface CredentialChangeInput {
  currentPassword: string;
  newUsername: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CredentialValidationErrors {
  currentPassword?: string;
  newUsername?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

export function hashPassword(password: string, salt?: string): {
  salt: string;
  hash: string;
} {
  const resolvedSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, resolvedSalt, 64);
  return {
    salt: resolvedSalt,
    hash: derived.toString('hex'),
  };
}

export function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): boolean {
  if (!password || !salt || !expectedHash) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function createInitialCredentials(
  username: string,
  password: string,
  nowMs: number = Date.now()
): StoredCredentials {
  const { salt, hash } = hashPassword(password);
  return {
    username: username.trim(),
    passwordSalt: salt,
    passwordHash: hash,
    updatedAt: nowMs,
  };
}

export function validateCredentialChange(
  input: CredentialChangeInput
): CredentialValidationErrors {
  const errors: CredentialValidationErrors = {};
  const trimmedUsername = input.newUsername.trim();

  if (!input.currentPassword) {
    errors.currentPassword = 'Password saat ini wajib diisi untuk konfirmasi.';
  }

  if (!USERNAME_PATTERN.test(trimmedUsername)) {
    errors.newUsername =
      'Username harus 3–32 karakter (huruf, angka, titik, garis bawah, atau strip).';
  }

  if (input.newPassword.length > 0) {
    if (input.newPassword.length < 4 || input.newPassword.length > 64) {
      errors.newPassword = 'Password baru harus antara 4 hingga 64 karakter.';
    }
    if (input.newPassword !== input.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password baru tidak cocok.';
    }
  } else if (input.confirmPassword.length > 0) {
    errors.newPassword = 'Isi password baru terlebih dahulu.';
  }

  return errors;
}

export function sanitizeImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('./src/assets/images/') ||
    trimmed.startsWith('/src/assets/images/')
  ) {
    return trimmed;
  }
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    // Reject invalid URLs
  }
  return '';
}
