import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://wakajob-backend.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 180000, // 180 seconds to allow for extremely slow Render cold starts
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token in headers
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle common errors like timeouts
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            console.error('API Request Timeout:', error.config?.url);
            error.message = 'The server is still waking up. Please wait another minute and try again. It can take up to 2-3 minutes on the first try.';
        } else if (!error.response) {
            console.error('Network Error / Server Unreachable:', error.message, 'URL:', error.config?.url);
            error.message = 'Cannot reach the server at ' + (error.config?.baseURL || '') + (error.config?.url || '') + '. Please check your internet connection.';
        }
        return Promise.reject(error);
    }
);

export default api;
