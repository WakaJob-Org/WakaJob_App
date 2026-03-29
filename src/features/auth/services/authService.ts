import apiClient, { parseError } from '../../../api/apiClient';
import { AuthResponse, User } from '../types';

export const authService = {
  /**
   * Signup new user
   */
  async signup(data: any): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signup', data);
      return response.data;
    } catch (error: any) {
      throw new Error(parseError(error));
    }
  },

  /**
   * Signin user
   */
  async signin(data: any): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signin', data);
      return response.data;
    } catch (error: any) {
      throw new Error(parseError(error));
    }
  },

  /**
   * Verify OTP code
   */
  async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/verify-otp', {
        email,
        token: otp
      });
      return response.data;
    } catch (error: any) {
      throw new Error(parseError(error));
    }
  },

  /**
   * Get Current User Profile
   */
  async getProfile(): Promise<User> {
    try {
      // Try profile first, then me
      let response;
      try {
        response = await apiClient.get('/auth/profile');
      } catch (err: any) {
        if (err.response?.status === 404) {
          response = await apiClient.get('/auth/me');
        } else {
          throw err;
        }
      }

      // Extract User correctly
      const userData = response.data.data?.user || response.data.user || response.data.data || response.data;
      return userData;
    } catch (error: any) {
      throw new Error(parseError(error));
    }
  },

  /**
   * Resend OTP
   */
  async resendOTP(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/auth/resend-otp', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(parseError(error));
    }
  }
};

export default authService;
