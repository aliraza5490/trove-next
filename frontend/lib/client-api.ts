import 'client-only';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { clearAuthToken, getAuthToken } from './auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

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
