import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://wakajob-backend.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // 120 seconds to allow for extremely slow Render cold starts
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token in headers
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
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
            console.error('API Request Timeout:', error.config.url);
            error.message = 'The server is taking too long to respond. It might be starting up. Please try again in a few seconds.';
        }
        return Promise.reject(error);
    }
);

export default api;
