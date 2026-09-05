import { authApi } from './authService';

export interface VerifyOTPData {
    email: string;
    otp: string;
}

export interface ResendOTPData {
    email: string;
}

/**
 * OTP Service using the public authApi (No tokens/interceptors)
 */
const otpService = {
    async verifyOTP(data: VerifyOTPData): Promise<any> {
        try {
            console.log('--- PUBLIC VERIFY OTP ---', data.email);
            const response = await authApi.post('/auth/verify-otp', {
                email: data.email,
                token: data.otp // Backend expects 'token'
            });
            return response.data;
        } catch (error: any) {
            // Rethrow the clean error message from authApi
            const msg = error.response?.data?.data?.message ||
                error.response?.data?.message ||
                error.message ||
                'OTP verification failed';
            throw new Error(msg);
        }
    },

    async resendOTP(data: ResendOTPData): Promise<any> {
        try {
            console.log('--- PUBLIC RESEND OTP ---', data.email);
            const response = await authApi.post('/auth/resend-otp', data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Backend Missing Endpoint: The backend developer needs to implement POST /auth/resend-otp. It is currently returning 404 Not Found.');
            }
            const msg = error.response?.data?.data?.message ||
                error.response?.data?.message ||
                error.message ||
                'Failed to resend OTP';
            throw new Error(msg);
        }
    }
};

export default otpService;