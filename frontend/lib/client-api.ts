import 'client-only';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import * as jwt from 'jsonwebtoken';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

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

function clearAuthToken() {
  try {
    deleteCookie('token');
  } catch {
    /* noop */
  }
}

function getAuthToken(): string | null {
  const token = getToken();
  if (!token) return null;
  // If the token is clearly expired, ignore it and clear client-side copy.
  if (isTokenExpired(token)) {
    clearAuthToken();
    return null;
  }
  return token;
}

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

const clientAPI: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
});

clientAPI.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>)[
        'Authorization'
      ] = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error),
);

clientAPI.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as RetriableConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark to avoid loops and clear any bad token; allow caller to handle auth.
      originalRequest._retry = true;
      clearAuthToken();
    }

    return Promise.reject(error);
  },
);

export { clientAPI };
