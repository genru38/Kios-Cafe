import { resolveApiUrl } from './routing';
import type { MenuDraft } from './storeLogic';
import type { MenuItem } from '../types/kiosk';

export interface LoginResponse {
  token: string;
  username: string;
}

export interface CredentialsUpdatePayload {
  currentPassword: string;
  newUsername: string;
  newPassword: string;
  confirmPassword: string;
}

async function parseJsonSafe<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Respon server tidak valid.');
  }
}

export async function fetchServerMenu(): Promise<MenuItem[]> {
  const res = await fetch(resolveApiUrl('api/menu'), {
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonSafe<{ menuItems?: MenuItem[]; error?: string }>(
    res
  );
  if (!res.ok || !Array.isArray(data.menuItems)) {
    throw new Error(data.error || 'Gagal memuat katalog menu.');
  }
  return data.menuItems;
}

export async function loginMenuAdmin(
  username: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(resolveApiUrl('api/menu-admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJsonSafe<{
    token?: string;
    username?: string;
    error?: string;
  }>(res);
  if (!res.ok || !data.token || !data.username) {
    throw new Error(data.error || 'Username atau password salah.');
  }
  return { token: data.token, username: data.username };
}

export async function logoutMenuAdmin(token: string): Promise<void> {
  await fetch(resolveApiUrl('api/menu-admin/logout'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

export async function updateMenuAdminCredentials(
  token: string,
  payload: CredentialsUpdatePayload
): Promise<LoginResponse> {
  const res = await fetch(resolveApiUrl('api/menu-admin/credentials'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe<{
    token?: string;
    username?: string;
    error?: string;
  }>(res);
  if (!res.ok || !data.token || !data.username) {
    throw new Error(data.error || 'Gagal memperbarui akun admin.');
  }
  return { token: data.token, username: data.username };
}

export async function apiAddMenu(
  token: string,
  draft: MenuDraft
): Promise<MenuItem[]> {
  const res = await fetch(resolveApiUrl('api/menu'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(draft),
  });
  const data = await parseJsonSafe<{ menuItems?: MenuItem[]; error?: string }>(
    res
  );
  if (!res.ok || !Array.isArray(data.menuItems)) {
    throw new Error(data.error || 'Gagal menambah menu.');
  }
  return data.menuItems;
}

export async function apiUpdateMenu(
  token: string,
  itemId: string,
  draft: MenuDraft
): Promise<MenuItem[]> {
  const res = await fetch(resolveApiUrl(`api/menu/${encodeURIComponent(itemId)}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(draft),
  });
  const data = await parseJsonSafe<{ menuItems?: MenuItem[]; error?: string }>(
    res
  );
  if (!res.ok || !Array.isArray(data.menuItems)) {
    throw new Error(data.error || 'Gagal memperbarui menu.');
  }
  return data.menuItems;
}

export async function apiDeleteMenu(
  token: string,
  itemId: string
): Promise<MenuItem[]> {
  const res = await fetch(resolveApiUrl(`api/menu/${encodeURIComponent(itemId)}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonSafe<{ menuItems?: MenuItem[]; error?: string }>(
    res
  );
  if (!res.ok || !Array.isArray(data.menuItems)) {
    throw new Error(data.error || 'Gagal menghapus menu.');
  }
  return data.menuItems;
}

export async function apiResetMenuDefault(token: string): Promise<MenuItem[]> {
  const res = await fetch(resolveApiUrl('api/menu/reset'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonSafe<{ menuItems?: MenuItem[]; error?: string }>(
    res
  );
  if (!res.ok || !Array.isArray(data.menuItems)) {
    throw new Error(data.error || 'Gagal mereset katalog menu.');
  }
  return data.menuItems;
}

export async function apiToggleMenuStock(itemId: string): Promise<MenuItem[]> {
  const res = await fetch(
    resolveApiUrl(`api/menu/${encodeURIComponent(itemId)}/stock`),
    { method: 'PATCH' }
  );
  const data = await parseJsonSafe<{ menuItems?: MenuItem[]; error?: string }>(
    res
  );
  if (!res.ok || !Array.isArray(data.menuItems)) {
    throw new Error(data.error || 'Gagal mengubah status stok.');
  }
  return data.menuItems;
}
