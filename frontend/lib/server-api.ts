import 'server-only';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// --- Token storage helpers
async function getToken() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('token') || null;
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

async function clearAuthToken() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
  } catch {
    /* noop */
  }
}

async function getAuthToken(): Promise<string | null> {
  const token = await getToken();
  if (!token) return null;
  // If the token is clearly expired, ignore it and clear client-side copy.
  if (isTokenExpired(token.value)) {
    await clearAuthToken();
    return null;
  }
  return token.value;
}

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

const serverAPI: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
});

serverAPI.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();
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

serverAPI.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as RetriableConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark to avoid loops and clear any bad token; allow caller to handle auth.
      originalRequest._retry = true;
      await clearAuthToken();
    }

    return Promise.reject(error);
  },
);

export { serverAPI };
