import { getAuth } from './auth';

// Fallback to live Render backend URL when in production and VITE_API_BASE_URL is not set
const DEFAULT_PROD_API = 'https://trackex-api.onrender.com';
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : DEFAULT_PROD_API);
const BASE = RAW_BASE.replace(/\/+$/, '');

function headers(auth?: { user_id: string; token: string }) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const a = auth ?? getAuth();
  if (a) { h['x-user-id'] = a.user_id; h['x-token'] = a.token; }
  return h;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(`Server returned non-JSON response (Status ${res.status}). Service may be waking up.`);
  }

  if (!text || text.trim().length === 0) {
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return {} as T;
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse response JSON (Status ${res.status})`);
  }

  if (!res.ok) throw new Error(data.error ?? `Request failed with status ${res.status}`);
  return data as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() });
  return handleResponse<T>(res);
}
