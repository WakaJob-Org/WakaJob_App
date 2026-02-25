import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

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

export interface ForgotPasswordData {
    email: string;
}

export interface ResetPasswordData {
    email: string;
    otp: string;
    new_password: string;
}

export interface VerifyOtpData {
    email: string;
    otp: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        full_name: string;
        email: string;
        role: string;
        is_verified?: boolean;
    };
    message?: string;
}

const authService = {
    signup: async (data: SignupData) => {
        try {
            const payload = {
                full_name: data.full_name,
                email: data.email,
                password: data.password,
                confirm_password: data.confirmPassword,
                role: data.role
            };
            console.log('Attempting signup with payload:', { ...payload, password: '***' });
            const response = await api.post<AuthResponse>('/auth/signup', payload);

            // Note: Signup might not return a token if OTP is required next.
            if (response.data.token) {
                await SecureStore.setItemAsync('auth_token', response.data.token);
                await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
            console.error('Signup Service Error:', errorMessage);
            throw errorMessage;
        }
    },

    verifyOtp: async (data: VerifyOtpData) => {
        try {
            console.log('Attempting verify OTP for email:', data.email);
            const response = await api.post<AuthResponse>('/auth/verify-otp', data);
            if (response.data.token) {
                await SecureStore.setItemAsync('auth_token', response.data.token);
                await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'OTP Verification failed';
            console.error('Verify OTP Service Error:', errorMessage);
            throw errorMessage;
        }
    },

    signin: async (data: SigninData) => {
        try {
            console.log('Attempting signin with:', { email: data.email, password: '***' });
            const response = await api.post<AuthResponse>('/auth/signin', data);
            if (response.data.token) {
                await SecureStore.setItemAsync('auth_token', response.data.token);
                await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Signin failed';
            console.error('Signin Service Error:', errorMessage);
            throw errorMessage;
        }
    },

    forgotPassword: async (data: ForgotPasswordData) => {
        try {
            console.log('Attempting forgot password for email:', data.email);
            const response = await api.post('/auth/forgot-password', data);
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset code';
            console.error('Forgot Password Service Error:', errorMessage);
            throw errorMessage;
        }
    },

    resetPassword: async (data: ResetPasswordData) => {
        try {
            console.log('Attempting reset password for email:', data.email);
            const response = await api.post('/auth/reset-password', data);
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password';
            console.error('Reset Password Service Error:', errorMessage);
            throw errorMessage;
        }
    },

    logout: async () => {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_data');
    },

    getUser: async () => {
        const userData = await SecureStore.getItemAsync('user_data');
        return userData ? JSON.parse(userData) : null;
    },

    isAuthenticated: async () => {
        const token = await SecureStore.getItemAsync('auth_token');
        return !!token;
    },

    wakeUp: async () => {
        try {
            await api.get('https://wakajob-backend.onrender.com/health');
            console.log('Backend wake-up ping successful');
        } catch (error) {
            console.log('Backend wake-up ping (expected if cold):', error instanceof Error ? error.message : 'timeout');
        }
    },
};

export default authService;
