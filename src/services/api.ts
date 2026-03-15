import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import CONFIG from '../config';

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
        // Dynamically set content type based on payload
        if (config.data && config.data instanceof FormData) {
            // Delete Content-Type to let axios automatically set it with the correct boundary
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
        } else if (config.data) {
            config.headers['Content-Type'] = 'application/json';
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
            console.warn('--- 401 UNAUTHORIZED DETECTED ---', error.config.url);
            originalRequest._retry = true;
            try {
                console.log('Session expired, deleting token from storage...');
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