import * as jwt from 'jsonwebtoken';

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

const deleteCookie = (name: string) => {
  const cookieStore = getCookie(name);
  if (cookieStore) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
};

// --- Token storage helpers
function getToken() {
  try {
    if (typeof window === 'undefined') return null;
    const cookieStore = getCookie('token');
    return cookieStore || null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = jwt.decode(token);
  if (!payload || typeof payload == 'string') return true;
  const now = Math.floor(Date.now() / 1000);
  return (payload?.exp || 0) <= now + skewSeconds;
}

export function clearAuthToken() {
  try {
    deleteCookie('token');
  } catch {
    /* noop */
  }
}

export function getAuthToken(): string | null {
  const token = getToken();
  if (!token) return null;
  // If the token is clearly expired, ignore it and clear client-side copy.
  if (isTokenExpired(token)) {
    clearAuthToken();
    return null;
  }
  return token;
}
