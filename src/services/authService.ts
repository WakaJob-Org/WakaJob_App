import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import CONFIG from '../config';
import api from './api';

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
    // If it's HTML (likely a 500 error), return a clean message
    if (typeof data === 'string' && data.toLowerCase().includes('<!doctype html>')) {
      return 'Server error (500). The backend might be having issues with the image format.';
    }
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
      if (error.response?.status === 404) {
        throw new Error('Backend Missing Endpoint: The backend developer needs to implement POST /auth/resend-otp.');
      }
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
      // Map incoming data to likely backend field names
      const payload = {
        email: data.email,
        token: data.otp || data.token,
        password: data.new_password || data.password
      };
      const response = await authApi.post('/auth/reset-password', payload);
      return response.data;
    } catch (error: any) {
      const msg = parseError(error);
      console.error('Reset PW failure:', msg);
      throw new Error(msg);
    }
  },

  async isAuthenticated(): Promise<boolean> {
    if (currentToken) {
      try {
        const decoded: any = jwtDecode(currentToken);
        if (decoded.exp && decoded.exp * 1000 > Date.now()) {
          return true;
        }
        console.log('--- Memory token expired ---');
        currentToken = null;
      } catch (e) { }
    }

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      console.log('--- Checking storage for token ---:', token ? 'Token exists' : 'Storage EMPTY');
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          if (decoded.exp && decoded.exp * 1000 > Date.now()) {
            currentToken = token;
            return true;
          }
          console.log('--- Storage token expired ---');
          await SecureStore.deleteItemAsync('auth_token');
        } catch (e) {
          // If decode fails, assume it's just a non-JWT string or corrupt and use as is (backward compat)
          // or just delete it if you want strict JWT. Let's be semi-strict.
          currentToken = token;
          return true;
        }
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

  clearMemoryToken(): void {
    currentToken = null;
  },

  async logout(): Promise<void> {
    console.log('--- LOGOUT INITIATED ---');
    this.clearMemoryToken();
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('cached_user_name');
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

      console.log('getUser: Fetching live profile data via main API...');
      // Try /auth/profile first, then /auth/me as common synonyms
      let response;
      try {
        response = await api.get('/auth/profile');
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.log('getUser: /auth/profile 404, trying /auth/me...');
          response = await api.get('/auth/me');
        } else {
          throw err;
        }
      }

      console.log('getUser RAW RESPONSE:', JSON.stringify(response.data));

      // Attempt extraction
      const userData = response.data.data?.user || response.data.user || response.data.data || response.data;

      if (userData && userData.full_name) {
        console.log('getUser: Captured name for cache:', userData.full_name);
        await SecureStore.setItemAsync('cached_user_name', userData.full_name);
      }

      console.log('getUser EXTRACTED DATA:', JSON.stringify(userData));
      return userData;
    } catch (e: any) {
      console.error('getUser error:', e.response?.status || e.message);

      // Try to return a skeleton user with the cached name if API fails
      try {
        const cachedName = await SecureStore.getItemAsync('cached_user_name');
        if (cachedName) {
          console.log('getUser: API failed, falling back to cache:', cachedName);
          return { full_name: cachedName };
        }
      } catch (cacheErr) { }

      return null;
    }
  },

  async updateProfile(userId: string, data: any): Promise<any> {
    try {
      let activeUserId = userId;
      if (!activeUserId || activeUserId === 'me') {
        const user = await this.getUser();
        activeUserId = user?.id || user?._id || 'me';
      }

      let payload = data;

      // Only append ID if data is a standard object, not FormData
      if (!(data instanceof FormData)) {
        payload = {
          id: activeUserId !== 'me' ? activeUserId : undefined,
          ...data
        };
      } else {
        // For FormData, inject ID specifically
        if (activeUserId !== 'me') {
          payload.append('id', activeUserId);
        }
      }

      console.log('--- UPDATING PROFILE at /profiles/' + activeUserId + ' ---');
      const response = await api.put('/profiles/' + activeUserId, payload);

      // Update local cache if full_name was provided in a standard object
      if (!(data instanceof FormData) && data.full_name) {
        await SecureStore.setItemAsync('cached_user_name', data.full_name);
      }

      return response.data;
    } catch (error: any) {
      // Fallback: some backends use /auth/profile for updates too
      try {
        let activeUserId = userId;
        if (!activeUserId || activeUserId === 'me') {
          const token = await SecureStore.getItemAsync('auth_token');
          if (token) {
            try {
              const decoded: any = jwtDecode(token);
              activeUserId = decoded.sub || decoded.id || 'me';
            } catch (e) { }
          }
        }

        let payload = data;
        if (!(data instanceof FormData)) {
          payload = {
            id: activeUserId !== 'me' ? activeUserId : undefined,
            ...data
          };
        } else {
          // For FormData, inject ID specifically if not already present
          if (activeUserId !== 'me' && !payload.has('id')) {
            payload.append('id', activeUserId);
          }
        }

        console.log('Profile update failed at /profiles/' + userId + ', trying /auth/profile...');
        const response = await api.patch('/auth/profile', payload);

        if (!(data instanceof FormData) && data.full_name) {
          await SecureStore.setItemAsync('cached_user_name', data.full_name);
        }

        return response.data;
      } catch (innerError) {
        const msg = parseError(error); // Return the original error msg
        console.error('Update Profile failure:', msg);
        throw new Error(msg);
      }
    }
  },

  async verifyEmployer(formData: FormData): Promise<any> {
    try {
      console.log('--- SUBMITTING EMPLOYER VERIFICATION TO /api/auth/verify-employer ---');
      const response = await api.post('/auth/verify-employer', formData);
      return response.data;
    } catch (error: any) {
      console.error('Employer Verification failure:', parseError(error));
      
      if (error.response?.status === 500) {
        throw new Error("Server error (500) during upload. This usually means the backend is missing one of required fields (business_photo, id_front, id_back, or business_certificate) or the file size is too large for the server's configuration.");
      }

      throw new Error(parseError(error));
    }
  }
};

export default authService;
export { authApi };