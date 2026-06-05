import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import CONFIG from '../config';
import authService from './authService';

const api = axios.create({
    baseURL: CONFIG.API_BASE_URL,
    timeout: CONFIG.TIMEOUT,
    headers: {
        'Accept': 'application/json'
    },
});

// Request interceptor
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Stable FormData check for React Native (iOS/Android)
        const isFormData = config.data && (
            (typeof config.data === 'object' && ('_parts' in config.data || config.data.constructor?.name === 'FormData')) ||
            config.data instanceof FormData
        );

        if (isFormData && config.headers) {
            // REMOVE Content-Type to allow axios/browser to set the boundary correctly
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
            
            // Helpful for some Android implementations to explicitly expect JSON
            if (!config.headers['Accept']) {
                config.headers['Accept'] = 'application/json';
            }
            
            console.log(`[API REQUEST]: ${config.method?.toUpperCase()} ${config.url} (FormData)`);
        } else if (config.data && config.headers) {
            config.headers['Content-Type'] = 'application/json';
            console.log(`[API REQUEST]: ${config.method?.toUpperCase()} ${config.url} (JSON)`);
        } else {
            console.log(`[API REQUEST]: ${config.method?.toUpperCase()} ${config.url} (No Body)`);
        }
        
        return config;
    },
    (error) => {
        console.error('[API REQUEST ERROR]:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const method = originalRequest?.method?.toUpperCase() || 'UNKNOWN';
        const url = originalRequest?.url || 'UNKNOWN URL';

        if (error.response?.status === 401 && !originalRequest?._retry) {
            console.warn(`--- 401 UNAUTHORIZED at ${url} ---`);
            originalRequest._retry = true;
            try {
                // Attempt to refresh the token
                const refreshed = await authService.refreshToken();
                if (refreshed) {
                    const newToken = authService.getToken();
                    if (newToken && originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    }
                    return api(originalRequest);
                }
                
                // If refresh fails, log out
                await SecureStore.deleteItemAsync('auth_token');
                await SecureStore.deleteItemAsync('refresh_token');
                return Promise.reject(error);
            } catch (err) {
                return Promise.reject(err);
            }
        }

        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            error.message = 'The server is still waking up. Please wait and try again.';
        } else if (!error.response) {
            if (axios.isCancel(error)) {
                error.message = 'Request was cancelled.';
            } else {
                // This is the classic "Network Error"
                // On Android, this can mean a malformed field in FormData (like a file with no type)
                // or a TLS mismatch.
                error.message = `Network error at ${method} ${url}. Please check your connection and ensure the backend is reachable.`;
                
                console.error('[AXIOS NETWORK ERROR DEBUG]:', {
                   message: error.message,
                   code: error.code,
                   url: url,
                   method: method,
                   platform: Platform.OS,
                   hasData: !!originalRequest?.data,
                   isFormData: originalRequest?.data && ('_parts' in originalRequest.data || originalRequest.data.constructor?.name === 'FormData')
                });
            }
        } else {
            // Suppress console.error for expected 404s on empty lists
            const isExpected404 = error.response?.status === 404 && (url.includes('/applications') || url.includes('/jobs/saved'));
            
            if (!isExpected404) {
                console.error(`[API ERROR ${error.response?.status}]:`, {
                    url: url,
                    method: method,
                    data: error.response?.data
                });
            }
        }

        return Promise.reject(error);
    }
);

export default api;