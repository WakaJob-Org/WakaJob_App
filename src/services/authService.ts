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
            const response = await api.post<AuthResponse>('/auth/signup', data);
            if (response.data.token) {
                await AsyncStorage.setItem('auth_token', response.data.token);
                await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Signup failed';
        }
    },

    signin: async (data: SigninData) => {
        try {
            const response = await api.post<AuthResponse>('/auth/signin', data);
            if (response.data.token) {
                await AsyncStorage.setItem('auth_token', response.data.token);
                await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Signin failed';
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
