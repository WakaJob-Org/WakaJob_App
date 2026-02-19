import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SignupData {
    full_name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'worker' | 'employer';
}

export interface SigninData {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        full_name: string;
        email: string;
        role: string;
    };
}

const authService = {
    signup: async (data: SignupData) => {
        try {
            // Only send fields required by the official API spec
            const payload = {
                full_name: data.full_name,
                email: data.email,
                password: data.password,
                role: data.role
            };
            console.log('Attempting signup with payload:', { ...payload, password: '***' });
            const response = await api.post<AuthResponse>('/auth/signup', payload);
            if (response.data.token) {
                await AsyncStorage.setItem('auth_token', response.data.token);
                await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
            console.error('Signup Service Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw errorMessage;
        }
    },

    signin: async (data: SigninData) => {
        try {
            console.log('Attempting signin with:', { email: data.email, password: '***' });
            const response = await api.post<AuthResponse>('/auth/signin', data);
            if (response.data.token) {
                await AsyncStorage.setItem('auth_token', response.data.token);
                await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Signin failed';
            console.error('Signin Service Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw errorMessage;
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
    },

    getUser: async () => {
        const userData = await AsyncStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    },

    isAuthenticated: async () => {
        const token = await AsyncStorage.getItem('auth_token');
        return !!token;
    },
};

export default authService;
