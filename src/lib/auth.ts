interface AuthData {
  user_id: string;
  token: string;
  username: string;
  name: string;
}

const KEY = 'trackex_auth';

export function getAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthData;
  } catch {
    return null;
  }
}

export function setAuth(data: AuthData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearAuth(): void {
  localStorage.removeItem(KEY);
}

export function isAuthenticated(): boolean {
  return getAuth() !== null;
}
