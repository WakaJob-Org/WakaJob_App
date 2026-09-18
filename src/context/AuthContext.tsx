import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import authService from '../services/authService';
import chatService from '../services/chatService';
import { isExpoGo } from '../utils/isExpoGo';

// Lazy: pushNotificationService.ts pulls in expo-notifications, which throws
// during module evaluation under Expo Go (SDK 53+) - see src/utils/isExpoGo.ts.
const registerPushTokenAfterLogin = () => {
    if (isExpoGo) return;
    require('../services/pushNotificationService').registerPushTokenAfterLogin();
};

interface User {
    id?: string;
    email?: string;
    full_name?: string;
    role?: 'seeker' | 'employer' | 'worker';
    avatar_url?: string | null;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    signup: (data: any) => Promise<any>;
    verifyOTP: (data: { email: string; otp: string }) => Promise<any>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] =
        useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    /**
     * Sync the authenticated user's profile with
     * the WakaJob Chat microservice.
     *
     * Backend endpoint:
     * POST /users/sync
     */
    const syncUserWithChat = async (userData: User | null) => {
        if (!userData?.id) {
            console.warn(
                '[CHAT] Cannot sync user: missing user ID'
            );
            return;
        }

        try {
            /**
             * The chat backend expects:
             *
             * role: "employer" OR "worker"
             *
             * Your main app may currently use "seeker"
             * for workers, so convert it here.
             */
            const chatRole =
                userData.role === 'employer'
                    ? 'employer'
                    : 'worker';

            const payload = {
                id: userData.id,
                name:
                    userData.full_name ||
                    userData.name ||
                    '',
                email:
                    userData.email ||
                    '',
                role: chatRole as 'employer' | 'worker',
                ...(userData.avatar_url
                    ? {
                          avatar_url:
                              userData.avatar_url,
                      }
                    : {}),
            };

            console.log(
                '[CHAT] Syncing user with chat service:',
                {
                    id: payload.id,
                    role: payload.role,
                }
            );

            await chatService.syncUser(payload);

            console.log(
                '[CHAT] User profile synced successfully'
            );
        } catch (error: any) {
            /**
             * Chat sync must NOT prevent the user from
             * logging into WakaJob.
             */
            console.warn(
                '[CHAT] User sync failed:',
                error?.response?.data ||
                    error?.message ||
                    error
            );
        }
    };

    /**
     * Initialize authentication when the app starts.
     */
    useEffect(() => {
        const initAuth = async () => {
            try {
                const authenticated =
                    await authService.isAuthenticated();

                setIsAuthenticated(authenticated);

                if (authenticated) {
                    const userData =
                        await authService.getUser();

                    setUser(userData);

                    /**
                     * Required by chat backend:
                     * sync user after app startup/login.
                     */
                    if (userData) {
                        await syncUserWithChat(userData);
                    }
                }
            } catch (error) {
                console.error(
                    'Auth initialization error:',
                    error
                );
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    /**
     * Login
     */
    const login = async (data: any) => {
        try {
            await authService.signin(data);

            const userData =
                await authService.getUser();

            setUser(userData);
            setIsAuthenticated(true);

            /**
             * Sync user with chat microservice.
             */
            await syncUserWithChat(userData);

            /**
             * Push notifications remain fire-and-forget.
             */
            registerPushTokenAfterLogin();
        } catch (error) {
            throw error;
        }
    };

    /**
     * Signup
     */
    const signup = async (data: any) => {
        try {
            const response =
                await authService.signup(data);

            return response;
        } catch (error) {
            throw error;
        }
    };

    /**
     * OTP verification
     */
    const verifyOTP = async (data: {
        email: string;
        otp: string;
    }) => {
        try {
            const response =
                await authService.verifyOTP(data);

            const authenticated =
                await authService.isAuthenticated();

            setIsAuthenticated(authenticated);

            if (authenticated) {
                const userData =
                    await authService.getUser();

                setUser(userData);

                /**
                 * If OTP verification created the
                 * authenticated session, sync the
                 * user with chat now.
                 */
                await syncUserWithChat(userData);

                registerPushTokenAfterLogin();
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    /**
     * Logout
     */
    const logout = async () => {
        try {
            await authService.logout();

            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error(
                'Logout error:',
                error
            );
        }
    };

    /**
     * Update local user state.
     */
    const updateUser = (
        data: Partial<User>
    ) => {
        setUser((prev) =>
            prev
                ? {
                      ...prev,
                      ...data,
                  }
                : null
        );
    };

    /**
     * Refresh user profile.
     */
    const refreshUser = async () => {
        try {
            const userData =
                await authService.getUser(true);

            setUser(userData);

            /**
             * Keep chat profile synchronized
             * when profile information changes.
             */
            if (userData) {
                await syncUserWithChat(userData);
            }
        } catch (error) {
            console.error(
                'Refresh user error:',
                error
            );
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                login,
                signup,
                verifyOTP,
                logout,
                updateUser,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context =
        useContext(AuthContext);

    if (context === undefined) {
        throw new Error(
            'useAuth must be used within an AuthProvider'
        );
    }

    return context;
};