import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import CONFIG from '../config';

const authApi = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json'
  }
});

let currentToken: string | null = null;

const authService = {
  async signup(data: any): Promise<any> {
    try {
      console.log('--- SIGNUP ATTEMPT ---');
      const payload = {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password,
        role: data.role
      };

      console.log('Final Payload:', JSON.stringify(payload, null, 2));

      // Attempt signup
      const response = await authApi.post('/auth/signup', payload);

      console.log('Signup Success:', response.data);

      if (response.data.token || response.data.data?.token) {
        const token = response.data.token || response.data.data?.token;
        currentToken = token;
        await SecureStore.setItemAsync('auth_token', token);
      }

      return response.data;
    } catch (error: any) {
      console.error('Signup Failure:', {
        status: error.response?.status,
        data: error.response?.data,
        msg: error.message
      });

      if (error.response?.data) {
        // Force the official error message to be the one we show
        const serverMsg = error.response.data.message || JSON.stringify(error.response.data);
        throw new Error(serverMsg);
      }

      throw error;
    }
  },

  async signin(data: any): Promise<any> {
    try {
      console.log('--- SIGNIN ATTEMPT ---');
      const sanitizedEmail = data.email.trim().toLowerCase();

      const payload = {
        email: sanitizedEmail,
        password: data.password
      };

      console.log('Signin Payload:', JSON.stringify(payload, null, 2));

      const response = await authApi.post('/auth/signin', payload);

      console.log('Signin Success:', response.status);

      if (response.data.token || response.data.data?.token) {
        const token = response.data.token || response.data.data?.token;
        currentToken = token;
        await SecureStore.setItemAsync('auth_token', token);
      }

      return response.data;
    } catch (error: any) {
      console.error('Signin Failure:', {
        status: error.response?.status,
        data: error.response?.data,
        msg: error.message
      });

      if (error.response?.data) {
        const serverMsg = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
        throw new Error(serverMsg);
      }

      throw error;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    if (currentToken) return true;
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        currentToken = token;
        return true;
      }
    } catch (e) { }
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
    currentToken = token;
    await SecureStore.setItemAsync('auth_token', token);
  },

  async getUser(): Promise<any> {
    try {
      if (!currentToken) {
        const hasToken = await this.isAuthenticated();
        if (!hasToken) return null;
      }
      const response = await authApi.get('/auth/profile', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      return response.data.user || response.data;
    } catch (e) {
      return null;
    }
  }
};

export default authService;