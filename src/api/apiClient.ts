import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import CONFIG from '../config';

const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * Universal error parser
 */
export const parseError = (error: any): string => {
  if (error.response?.data) {
    const data = error.response.data;
    // Handle HTML (Server 500)
    if (typeof data === 'string' && data.toLowerCase().includes('<!doctype html>')) {
      return 'Server error (500). Please try again or contact support.';
    }
    // Deep extraction
    const msg = data.data?.message || data.message || data.error || 
                (typeof data === 'string' ? data : JSON.stringify(data));
    return msg;
  }
  return error.message || 'An unexpected network error occurred';
};

// Request Interceptor: Inject Token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Auto-handle FormData vs JSON
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      } else if (config.data) {
        config.headers['Content-Type'] = 'application/json';
      }
    } catch (e) {
      console.error('API Interceptor Error:', e);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle Session Expiry (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await SecureStore.deleteItemAsync('auth_token');
        // Future: Add Refresh Token logic here if backend supports it
        return Promise.reject(error);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    // Friendly Timeout Messages
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      error.message = 'The server is still waking up. Please try again in a few seconds.';
    }

    return Promise.reject(error);
  }
);

export default api;
