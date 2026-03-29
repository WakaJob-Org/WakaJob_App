import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'worker' | 'employer';
  verification_status?: 'pending' | 'verified' | 'unverified';
  [key: string]: any;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthenticated: (status: boolean) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setToken: async (token) => {
        if (token) {
          await secureStorage.setItem('auth_token', token);
          set({ token, isAuthenticated: true });
        } else {
          await secureStorage.removeItem('auth_token');
          set({ token: null, isAuthenticated: false, user: null });
        }
      },

      setUser: (user) => set({ user }),
      
      setAuthenticated: (status) => set({ isAuthenticated: status }),

      logout: async () => {
        await secureStorage.removeItem('auth_token');
        set({ token: null, user: null, isAuthenticated: false });
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          const token = await secureStorage.getItem('auth_token');
          if (token) {
            set({ token, isAuthenticated: true });
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage as any),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
