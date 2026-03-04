import api from './api';

export interface VerifyOTPData {
    email: string;
    otp: string;
}

export interface ResendOTPData {
    email: string;
}

const otpService = {
    async verifyOTP(data: VerifyOTPData): Promise<any> {
        try {
            // Using 'token' based on the backend error message "required token"
            // Most likely the 6-digit code is expected in a field named 'token'
            const response = await api.post('/auth/verify-otp', {
                email: data.email,
                token: data.otp
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'OTP verification failed');
        }
    },

    async resendOTP(data: ResendOTPData): Promise<any> {
        try {
            const response = await api.post('/auth/resend-otp', data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to resend OTP');
        }
    }
};

export default otpService;