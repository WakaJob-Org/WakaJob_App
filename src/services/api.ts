import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import CONFIG from '../config';

const api = axios.create({
    baseURL: CONFIG.API_BASE_URL,
    timeout: CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                console.log('Session expired, logging out...');
                await SecureStore.deleteItemAsync('auth_token');
                return Promise.reject(error);
            } catch (err) {
                return Promise.reject(err);
            }
        }

        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            error.message = 'The server is still waking up. Please wait and try again.';
        } else if (!error.response) {
            error.message = 'Network error. Please check your internet connection.';
        }

        return Promise.reject(error);
    }
);

export default api;