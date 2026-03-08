import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import CONFIG from '../config';

// Dedicated instance for Auth and Public routes (No interceptors, no tokens)
const authApi = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

let currentToken: string | null = null;

/**
 * Universal error parser for backend responses
 */
const parseError = (error: any): string => {
  if (error.response?.data) {
    const data = error.response.data;
    // Handle nested structure: { data: { message: "..." } }
    if (data.data?.message) return data.data.message;
    // Handle standard structure: { message: "..." }
    if (data.message) return data.message;
    // Handle structure: { error: "..." }
    if (data.error) return data.error;
    // Fallback to stringified data
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
  return error.message || 'An unexpected error occurred';
};

const authService = {
  async signup(data: any): Promise<any> {
    try {
      console.log('--- SIGNUP ATTEMPT ---', data.email);
      const payload = {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password,
        role: data.role
      };

      const response = await authApi.post('/auth/signup', payload);
      console.log('Signup success. Response keys:', Object.keys(response.data));
      console.log('Signup data content:', JSON.stringify(response.data.data));

      // Deep scan specialized for Supabase/Nested response structure
      const token = response.data.token ||
        response.data.data?.session?.access_token ||
        response.data.data?.token ||
        response.data.data?.access_token ||
        response.data.access_token;

      if (token) {
        console.log('--- TOKEN EXTRACTED FROM SIGNUP ---');
        await this.setToken(token);
      } else {
        console.log('--- Signup successful, waiting for OTP verification ---');
      }
      return response.data;
    } catch (error: any) {
      const msg = parseError(error);
      console.error('Signup error:', msg);
      throw new Error(msg);
    }
  },

  async signin(data: any): Promise<any> {
    try {
      console.log('--- SIGNIN ATTEMPT ---', data.email);
      const payload = {
        email: data.email.trim().toLowerCase(),
        password: data.password
      };

      const response = await authApi.post('/auth/signin', payload);
      console.log('Signin success. Response keys:', Object.keys(response.data));
      console.log('Signin data content keys:', response.data.data ? Object.keys(response.data.data) : 'null');

      // Deep scan specialized for Supabase/Nested response structure
      const token = response.data.token ||
        response.data.data?.session?.access_token ||
        response.data.data?.token ||
        response.data.data?.access_token ||
        response.data.access_token;

      if (token) {
        console.log('--- TOKEN EXTRACTED FROM SIGNIN ---');
        await this.setToken(token);
      } else {
        console.error('FAILED to extract token from Signin structure:', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error: any) {
      const msg = parseError(error);
      console.error('Signin failure:', msg);
      throw new Error(msg);
    }
  },

  async verifyOTP(data: { email: string; otp: string }): Promise<any> {
    try {
      console.log('--- VERIFY OTP ATTEMPT ---', data.email);
      const response = await authApi.post('/auth/verify-otp', {
        email: data.email,
        token: data.otp // Backend expects 'token' for the 6-digit code
      });

      const token = response.data.token ||
        response.data.data?.session?.access_token ||
        response.data.data?.token ||
        response.data.data?.access_token ||
        response.data.access_token;

      if (token) {
        console.log('--- TOKEN EXTRACTED FROM OTP ---');
        await this.setToken(token);
      }

      return response.data;
    } catch (error: any) {
      const msg = parseError(error);
      console.error('Verify OTP failure:', msg);
      throw new Error(msg);
    }
  },

  async resendOTP(data: { email: string }): Promise<any> {
    try {
      console.log('--- RESEND OTP ATTEMPT ---', data.email);
      const response = await authApi.post('/auth/resend-otp', data);
      return response.data;
    } catch (error: any) {
      const msg = parseError(error);
      console.error('Resend OTP failure:', msg);
      throw new Error(msg);
    }
  },

  async forgotPassword(data: { email: string }): Promise<any> {
    try {
      console.log('--- FORGOT PASSWORD ATTEMPT ---', data.email);
      const response = await authApi.post('/auth/forgot-password', data);
      return response.data;
    } catch (error: any) {
      const msg = parseError(error);
      console.error('Forgot PW failure:', msg);
      throw new Error(msg);
    }
  },

  async resetPassword(data: any): Promise<any> {
    try {
      console.log('--- RESET PASSWORD ATTEMPT ---', data.email);
      const response = await authApi.post('/auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      const msg = parseError(error);
      console.error('Reset PW failure:', msg);
      throw new Error(msg);
    }
  },

  async isAuthenticated(): Promise<boolean> {
    if (currentToken) {
      console.log('--- Auth confirmed from memory ---');
      return true;
    }
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      console.log('--- Checking storage for token ---:', token ? 'Token exists' : 'Storage EMPTY');
      if (token) {
        currentToken = token;
        return true;
      }
    } catch (e) {
      console.error('--- SecureStore Read Error ---:', e);
    }
    return false;
  },

  async wakeUp(): Promise<void> {
    try {
      await authApi.get('/health', { timeout: 15000 });
    } catch (e) { }
  },

  getToken(): string | null {
    return currentToken;
  },

  async logout(): Promise<void> {
    currentToken = null;
    await SecureStore.deleteItemAsync('auth_token');
  },

  async setToken(token: string): Promise<void> {
    try {
      console.log('--- Persisting new token to storage (Length: ' + token.length + ') ---');
      currentToken = token;
      await SecureStore.setItemAsync('auth_token', token);

      // Immediate verification read-back
      const verifyToken = await SecureStore.getItemAsync('auth_token');
      if (verifyToken === token) {
        console.log('--- SESSION PERSISTENCE VERIFIED ---');
      } else {
        console.error('--- SESSION PERSISTENCE FAILURE: Read-back failed ---');
      }
    } catch (e) {
      console.error('--- SecureStore Write Error ---:', e);
    }
  },

  async getUser(): Promise<any> {
    try {
      if (!currentToken) {
        const hasToken = await this.isAuthenticated();
        if (!hasToken) {
          console.log('getUser: No token found, skipping profile fetch');
          return null;
        }
      }

      console.log('getUser: Fetching live profile data...');
      const response = await authApi.get('/auth/profile', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      console.log('getUser RAW RESPONSE:', JSON.stringify(response.data));

      // Attempt extraction
      const userData = response.data.data?.user || response.data.user || response.data.data || response.data;
      console.log('getUser EXTRACTED DATA:', JSON.stringify(userData));

      return userData;
    } catch (e: any) {
      console.error('getUser error:', e.response?.status || e.message);
      // Fallback for UI stability during network issues
      return null;
    }
  }
};

export default authService;
export { authApi };