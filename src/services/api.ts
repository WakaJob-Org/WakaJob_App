import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import CONFIG from '../config';
import authService from './authService';
import { fetchJson, HttpConfig, HttpResponse, isFormDataBody } from './httpClient';

async function request<T = any>(
    method: string,
    url: string,
    data?: any,
    config: HttpConfig = {},
    isRetry = false
): Promise<HttpResponse<T>> {
    const token = await SecureStore.getItemAsync('auth_token');
    const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...config.headers,
    };

    if (data !== undefined) {
        console.log(`[API REQUEST]: ${method} ${url} (${isFormDataBody(data) ? 'FormData' : 'JSON'})`);
    } else {
        console.log(`[API REQUEST]: ${method} ${url} (No Body)`);
    }

    try {
        return await fetchJson<T>(CONFIG.API_BASE_URL, method, url, data, { ...config, headers }, CONFIG.TIMEOUT);
    } catch (error: any) {
        if (error.response?.status === 401 && !isRetry) {
            console.warn(`--- 401 UNAUTHORIZED at ${url} ---`);
            try {
                const refreshed = await authService.refreshToken();
                if (refreshed) {
                    return request<T>(method, url, data, config, true);
                }
                await SecureStore.deleteItemAsync('auth_token');
                await SecureStore.deleteItemAsync('refresh_token');
            } catch {
                // fall through to the throw below
            }
        }

        if (!error.response) {
            // Network/timeout error - already has a friendly message from fetchJson.
            console.error('[API NETWORK ERROR DEBUG]:', {
                message: error.message,
                code: error.code,
                url,
                method,
                platform: Platform.OS,
                hasData: data !== undefined,
                isFormData: isFormDataBody(data),
            });
        } else {
            // Suppress console.error for expected 404s on empty lists
            const isExpected404 = error.response.status === 404 && (url.includes('/applications') || url.includes('/jobs/saved'));
            if (!isExpected404) {
                console.error(`[API ERROR ${error.response.status}]:`, { url, method, data: error.response.data });
            }
        }

        throw error;
    }
}

const api = {
    get: <T = any>(url: string, config?: HttpConfig) => request<T>('GET', url, undefined, config),
    post: <T = any>(url: string, data?: any, config?: HttpConfig) => request<T>('POST', url, data, config),
    put: <T = any>(url: string, data?: any, config?: HttpConfig) => request<T>('PUT', url, data, config),
    patch: <T = any>(url: string, data?: any, config?: HttpConfig) => request<T>('PATCH', url, data, config),
    delete: <T = any>(url: string, config?: HttpConfig) => request<T>('DELETE', url, undefined, config),
};

export default api;
