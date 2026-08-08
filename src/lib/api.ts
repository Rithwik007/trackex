import { getAuth } from './auth';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || '';
const BASE = RAW_BASE.replace(/\/+$/, '');

function headers(auth?: { user_id: string; token: string }) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const a = auth ?? getAuth();
  if (a) { h['x-user-id'] = a.user_id; h['x-token'] = a.token; }
  return h;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}
