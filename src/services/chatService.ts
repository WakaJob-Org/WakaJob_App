import * as SecureStore from 'expo-secure-store';
import CONFIG from '../config';

export interface ChatMessage {
    id?: string;
    _id?: string;

    conversation_id: string;

    sender_id: string;

    recipient_id?: string;

    content: string;

    created_at?: string;
    timestamp?: string;

    status?: string;
}

export interface ChatTokenResponse {
    token: string;
    user_id: string;
    expires_at: string;
}

interface ApiResponse<T> {
    success?: boolean;
    status?: string;
    message?: string;
    data?: T;
    error?: any;
}

const getToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync('auth_token');
};

const MAIN_API_BASE = CONFIG.API_BASE_URL.replace(/\/+$/, '');

/**
 * Ensure a valid chat_token exists in SecureStore. If missing or expired,
 * ask the Node generator (MAIN_API_BASE) to create one, falling back to
 * chat service endpoints if needed.
 */
const ensureChatToken = async (force = false): Promise<string | null> => {
    try {
        const existing = await SecureStore.getItemAsync('chat_token');
        const expiresAt = await SecureStore.getItemAsync('chat_token_expires_at');

        if (existing && !force) {
            if (!expiresAt) return existing;
            const expiryTime = new Date(expiresAt).getTime();
            if (Number.isFinite(expiryTime) && Date.now() < expiryTime - 30000) {
                return existing;
            }
        }

        // Try Node.js POST (force generation)
        const nodePostPaths = [`${MAIN_API_BASE}/chats/token`, `${MAIN_API_BASE}/chat/token`];
        const auth = await getToken();
        for (const p of nodePostPaths) {
            try {
                console.log('[CHAT] ensureChatToken: POST', p);
                const headers = new Headers();
                headers.set('Accept', 'application/json');
                headers.set('Content-Type', 'application/json');
                if (auth) headers.set('Authorization', 'Bearer ' + auth);
                const resp = await fetch(p, { method: 'POST', headers, body: JSON.stringify({ refresh: true }) });
                console.log('[CHAT] ensureChatToken HTTP STATUS:', resp.status, p);
                const text = await resp.text();
                console.log('[CHAT] ensureChatToken RAW RESPONSE:', text);
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}: ${text}`);
                }
                const parsed = text ? JSON.parse(text) : null;
                const data = parsed?.data || parsed;
                if (data?.token) {
                    await SecureStore.setItemAsync('chat_token', data.token);
                    if (data.expires_at) await SecureStore.setItemAsync('chat_token_expires_at', data.expires_at);
                    return data.token as string;
                }
            } catch (e: any) {
                console.warn('[CHAT] ensureChatToken node POST failed for', p, e?.message || e);
            }
        }

        // Try Node.js GET
        const nodeGetPaths = [`${MAIN_API_BASE}/chats/token`, `${MAIN_API_BASE}/chat/token`];
        for (const p of nodeGetPaths) {
            try {
                console.log('[CHAT] ensureChatToken: GET', p);
                const headers = new Headers();
                headers.set('Accept', 'application/json');
                headers.set('Content-Type', 'application/json');
                if (auth) headers.set('Authorization', 'Bearer ' + auth);
                const resp = await fetch(p, { method: 'GET', headers });
                console.log('[CHAT] ensureChatToken HTTP STATUS:', resp.status, p);
                const text = await resp.text();
                console.log('[CHAT] ensureChatToken RAW RESPONSE:', text);
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}: ${text}`);
                }
                const parsed = text ? JSON.parse(text) : null;
                const data = parsed?.data || parsed;
                if (data?.token) {
                    await SecureStore.setItemAsync('chat_token', data.token);
                    if (data.expires_at) await SecureStore.setItemAsync('chat_token_expires_at', data.expires_at);
                    return data.token as string;
                }
            } catch (e: any) {
                console.warn('[CHAT] ensureChatToken node GET failed for', p, e?.message || e);
            }
        }

        // As a last resort, try the chat microservice endpoints directly (GET then POST)
        const chatPathsGet = [`${CONFIG.CHAT_HTTP_BASE_URL}/api/chats/token`, `${CONFIG.CHAT_HTTP_BASE_URL}/api/chat/token`];
        for (const p of chatPathsGet) {
            try {
                console.log('[CHAT] ensureChatToken: GET chat service', p);
                const headers = new Headers();
                headers.set('Accept', 'application/json');
                headers.set('Content-Type', 'application/json');
                if (auth) headers.set('Authorization', 'Bearer ' + auth);
                const resp = await fetch(p, { method: 'GET', headers });
                console.log('[CHAT] ensureChatToken HTTP STATUS:', resp.status, p);
                const text = await resp.text();
                console.log('[CHAT] ensureChatToken RAW RESPONSE:', text);
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}: ${text}`);
                }
                const parsed = text ? JSON.parse(text) : null;
                const data = parsed?.data || parsed;
                if (data?.token) {
                    await SecureStore.setItemAsync('chat_token', data.token);
                    if (data.expires_at) await SecureStore.setItemAsync('chat_token_expires_at', data.expires_at);
                    return data.token as string;
                }
            } catch (e: any) {
                console.warn('[CHAT] ensureChatToken chat GET failed for', p, e?.message || e);
            }
        }

        const chatPathsPost = [`${CONFIG.CHAT_HTTP_BASE_URL}/api/chats/token`, `${CONFIG.CHAT_HTTP_BASE_URL}/api/chat/token`];
        for (const p of chatPathsPost) {
            try {
                console.log('[CHAT] ensureChatToken: POST chat service', p);
                const headers = new Headers();
                headers.set('Accept', 'application/json');
                headers.set('Content-Type', 'application/json');
                const auth = await getToken();
                if (auth) headers.set('Authorization', 'Bearer ' + auth);
                const resp = await fetch(p, { method: 'POST', headers, body: JSON.stringify({ refresh: true }) });
                console.log('[CHAT] ensureChatToken HTTP STATUS:', resp.status, p);
                const text = await resp.text();
                console.log('[CHAT] ensureChatToken RAW RESPONSE:', text);
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}: ${text}`);
                }
                const parsed = text ? JSON.parse(text) : null;
                const data = parsed?.data || parsed;
                if (data?.token) {
                    await SecureStore.setItemAsync('chat_token', data.token);
                    if (data.expires_at) await SecureStore.setItemAsync('chat_token_expires_at', data.expires_at);
                    return data.token as string;
                }
            } catch (e: any) {
                console.warn('[CHAT] ensureChatToken chat POST failed for', p, e?.message || e);
            }
        }

        return null;
    } catch (e) {
        console.warn('[CHAT] ensureChatToken fatal error', e);
        return null;
    }
};

/**
 * Authenticated request to the Chat API.
 */
import authService from './authService';

const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const url = `${CONFIG.CHAT_HTTP_BASE_URL}${endpoint}`;

    console.log('[CHAT] REQUEST:', options.method || 'GET', url);

    let lastError: any = null;

    // We'll attempt up to two attempts: initial, then one retry after either
    // regenerating chat_token (for chat service requests) or refreshing auth_token
    // (for main API requests).
    for (let attempt = 0; attempt < 2; attempt++) {
        // Decide which token to use.
        // For chat microservice endpoints (we call request with relative paths and url uses CHAT_HTTP_BASE_URL),
        // prefer using chat_token if available. Ensure it's present when calling chat endpoints.
        let usingChatToken = false;
        let tokenToUse: string | null = null;

        try {
            const chatToken = await SecureStore.getItemAsync('chat_token');
            if (chatToken) {
                tokenToUse = chatToken;
                usingChatToken = true;
            } else {
                // Try to obtain chat token (this will contact Node generator first)
                const generated = await ensureChatToken();
                if (generated) {
                    tokenToUse = generated;
                    usingChatToken = true;
                }
            }
        } catch (e) {
            console.warn('[CHAT] Failed reading/ensuring chat token', e);
        }

        // If no chat token available, fall back to auth_token (app's token)
        if (!tokenToUse) {
            const auth = await getToken();
            if (!auth) {
                if (attempt === 0) {
                    // try to refresh app auth once
                    try {
                        console.log('[CHAT] No auth token present, attempting to refresh auth token...');
                        const refreshed = await authService.refreshToken();
                        if (refreshed) {
                            // will loop to next attempt to pick up refreshed token
                            continue;
                        }
                    } catch (e) {
                        console.warn('[CHAT] auth refresh attempt failed', e);
                    }
                }
                throw new Error('No authentication token found.');
            }
            tokenToUse = auth;
            usingChatToken = false;
        }

        const headers = new Headers(options.headers as any);
        headers.set('Accept', 'application/json');
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer ' + (tokenToUse || ''));

        try {
            const response = await fetch(url, { ...options, headers });
            console.log('[CHAT] HTTP STATUS:', response.status);

            const responseText = await response.text();
            console.log('[CHAT] RAW RESPONSE:', responseText);

            let body: ApiResponse<T> | null = null;
            if (responseText.trim()) {
                try {
                    body = JSON.parse(responseText);
                } catch (e) {
                    if (!response.ok) {
                        throw new Error(`Chat server returned HTTP ${response.status}: ${responseText}`);
                    }
                    throw new Error(`Chat server returned an invalid response. HTTP ${response.status}`);
                }
            }

            if (response.status === 401) {
                // If we used chat token, attempt to regenerate it (node generator) and retry once.
                lastError = new Error(`Chat request failed with HTTP 401: ${body?.error || responseText}`);
                if (usingChatToken) {
                    console.warn('[CHAT] Received 401 from chat service using chat_token. Attempting to regenerate chat token and retry...');
                    try {
                        const regenerated = await ensureChatToken(true);
                        if (!regenerated) {
                            break;
                        }
                        // continue to next attempt which will pick up regenerated token
                        continue;
                    } catch (e) {
                        break;
                    }
                } else {
                    // We used app auth token; try refreshing app auth once
                    console.warn('[CHAT] Received 401 from chat service using auth_token. Attempting auth token refresh and retry...');
                    try {
                        const refreshed = await authService.refreshToken();
                        if (!refreshed) {
                            break;
                        }
                        continue;
                    } catch (e) {
                        break;
                    }
                }
            }

            if (!response.ok) {
                let errorMessage = body?.error;
                if (errorMessage === undefined || errorMessage === null) {
                    errorMessage = responseText || `Chat request failed with HTTP ${response.status}`;
                }
                if (typeof errorMessage !== 'string') {
                    try {
                        errorMessage = JSON.stringify(errorMessage);
                    } catch {
                        errorMessage = String(errorMessage);
                    }
                }
                throw new Error(`Chat request failed with HTTP ${response.status}: ${errorMessage}`);
            }

            if (!body) {
                throw new Error(`Chat server returned an empty response. HTTP ${response.status}`);
            }

            if (body.success === false || body.status === 'error') {
                let errorMessage = body.error || body.message || 'Chat server returned an unsuccessful response.';
                if (typeof errorMessage !== 'string') {
                    try {
                        errorMessage = JSON.stringify(errorMessage);
                    } catch {
                        errorMessage = String(errorMessage);
                    }
                }
                throw new Error(errorMessage);
            }

            return (body.data as T);
        } catch (err: any) {
            lastError = err;
            // If it's the first attempt and we got a 401 handled above, loop will retry.
            // Otherwise, break and throw at the end.
            break;
        }
    }

    throw lastError || new Error('Unknown chat request failure');
};

const chatService = {
    async getChatToken(): Promise<ChatTokenResponse> {
        console.log('[CHAT] Requesting chat WebSocket token...');

        // Candidate paths to try on the chat microservice first
        const candidateGetPaths = [
            `${CONFIG.CHAT_HTTP_BASE_URL}/api/chats/token`,
            `${CONFIG.CHAT_HTTP_BASE_URL}/api/chat/token`,
        ];

        // Candidate POST paths (force generation)
        const candidatePostPaths = [
            `${CONFIG.CHAT_HTTP_BASE_URL}/api/chats/token`,
            `${CONFIG.CHAT_HTTP_BASE_URL}/api/chat/token`,
        ];

        // If the chat microservice doesn't provide the token endpoints, the
        // Node.js main backend is responsible for generating/storing tokens.
        // Try the main API as a fallback. Note: API_BASE_URL already includes '/api'
        const MAIN_API_BASE = CONFIG.API_BASE_URL.replace(/\/+$/, '');

        const fallbackGetPaths = [
            `${MAIN_API_BASE}/chats/token`,
            `${MAIN_API_BASE}/chat/token`,
        ];

        const fallbackPostPaths = [
            `${MAIN_API_BASE}/chats/token`,
            `${MAIN_API_BASE}/chat/token`,
        ];

        let lastErr: any = null;

        const tryPaths = async (paths: string[], method: 'GET' | 'POST') => {
            for (const fullPath of paths) {
                try {
                    console.log(`[CHAT] Attempting ${method} ${fullPath}`);
                    // Use request() when path targets the chat microservice (so we can reuse auth handling)
                    if (fullPath.startsWith(CONFIG.CHAT_HTTP_BASE_URL)) {
                        const rel = fullPath.substring(CONFIG.CHAT_HTTP_BASE_URL.length) || '/';
                        console.log(`[CHAT] Using chat service request helper for ${rel}`);
                        const data = await request<ChatTokenResponse>(rel, {
                            method,
                            body: method === 'POST' ? JSON.stringify({ refresh: true }) : undefined,
                        });
                        if (!data?.token) throw new Error('Chat token was not returned by the server.');
                        await SecureStore.setItemAsync('chat_token', data.token);
                        if (data.expires_at) await SecureStore.setItemAsync('chat_token_expires_at', data.expires_at);
                        console.log('[CHAT] Chat token received and stored successfully (via chat service):', fullPath);
                        return data;
                    } else {
                        console.log(`[CHAT] Using direct fetch to alternate host for ${fullPath}`);
                        // Direct fetch to alternate API_BASE_URL (main node backend)
                        const headers = new Headers();
                        headers.set('Accept', 'application/json');
                        headers.set('Content-Type', 'application/json');
                        const auth = await getToken();
                        if (auth) headers.set('Authorization', 'Bearer ' + auth);

                        const resp = await fetch(fullPath, {
                            method,
                            headers,
                            body: method === 'POST' ? JSON.stringify({ refresh: true }) : undefined,
                        });

                        console.log('[CHAT] HTTP STATUS (fallback):', resp.status, fullPath);
                        const text = await resp.text();
                        console.log('[CHAT] RAW RESPONSE (fallback):', text);
                        if (!resp.ok) {
                            throw new Error(`Chat request failed with HTTP ${resp.status}: ${text}`);
                        }

                        const parsed = text ? JSON.parse(text) : null;
                        const data = parsed?.data || parsed;

                        if (!data?.token) throw new Error('Chat token was not returned by fallback server.');

                        await SecureStore.setItemAsync('chat_token', data.token);
                        if (data.expires_at) await SecureStore.setItemAsync('chat_token_expires_at', data.expires_at);
                        console.log('[CHAT] Chat token received and stored successfully (via main API):', fullPath);
                        return data as ChatTokenResponse;
                    }
                } catch (err: any) {
                    lastErr = err;
                    console.warn('[CHAT] Token attempt failed for', fullPath, err?.message || err);
                }
            }
            return null;
        };

        // Preferred sequence:
        // 1) Try Node.js backend POST to force generation (it is the token generator)
        // 2) Try Node.js backend GET (in case it caches the token)
        // 3) Fall back to chat microservice GET/POST (some deployments may expose it)
        console.log('[CHAT] Trying Node.js POST (force generation) paths...');
        let result = await tryPaths(fallbackPostPaths, 'POST');
        if (result) return result;

        console.log('[CHAT] Trying Node.js GET (cached) paths...');
        result = await tryPaths(fallbackGetPaths, 'GET');
        if (result) return result;

        console.log('[CHAT] Trying chat microservice GET paths...');
        result = await tryPaths(candidateGetPaths, 'GET');
        if (result) return result;

        console.log('[CHAT] Trying chat microservice POST paths as last resort...');
        result = await tryPaths(candidatePostPaths, 'POST');
        if (result) return result;

        throw lastErr || new Error('Failed to obtain chat token: no supported endpoint returned a token.');
    },



    async syncUser(payload: {
        id: string;
        name: string;
        email: string;
        role: 'employer' | 'worker';
        avatar_url?: string | null;
    }) {
        console.log('[CHAT] Syncing user:', payload);
        try {
            const data = await request<any>('/users/sync', {
                method: 'POST',
                body: JSON.stringify({
                    id: payload.id,
                    name: payload.name,
                    email: payload.email,
                    role: payload.role,
                    ...(payload.avatar_url ? { avatar_url: payload.avatar_url } : {}),
                }),
            });
            console.log('[CHAT] User synced successfully:', data);
            return data;
        } catch (error: any) {
            console.error('[CHAT] User sync failed:', error?.message || error);
            throw error;
        }
    },

    async createConversation(payload: {
        job_id: string;
        job_title: string;
        job_status?: string;
        employer_id: string;
        worker_id: string;
    }) {
        console.log('[CHAT] Creating conversation:', payload);
        const data = await request<any>('/conversations', {
            method: 'POST',
            body: JSON.stringify({
                job_id: payload.job_id,
                job_title: payload.job_title,
                job_status: payload.job_status || '',
                employer_id: payload.employer_id,
                worker_id: payload.worker_id,
            }),
        });
        console.log('[CHAT] Conversation created:', data);
        return data;
    },

    async listConversations(): Promise<any[]> {
        try {
            const data = await request<any[]>('/conversations', { method: 'GET' });
            if (!Array.isArray(data)) return [];
            return data;
        } catch (error) {
            console.warn('[CHAT] Failed to list conversations:', error);
            return [];
        }
    },

    async getConversationMessages(conversationId: string, page = 1, limit = 100): Promise<ChatMessage[]> {
        try {
            if (limit > 100) limit = 100;
            const data = await request<{ messages: ChatMessage[]; page: number; limit: number; total: number }>(
                `/conversations/${encodeURIComponent(conversationId)}/messages?page=${page}&limit=${limit}`,
                { method: 'GET' }
            );
            if (!data || !Array.isArray(data.messages)) return [];
            return data.messages;
        } catch (error) {
            console.warn('[CHAT] Failed to fetch conversation messages:', error);
            return [];
        }
    },

    async deleteConversation(conversationId: string) {
        console.log('[CHAT] Deleting conversation:', conversationId);
        return await request<any>(`/conversations/${encodeURIComponent(conversationId)}`, { method: 'DELETE' });
    },

    async blockConversation(conversationId: string) {
        console.log('[CHAT] Blocking conversation:', conversationId);
        return await request<any>(`/conversations/${encodeURIComponent(conversationId)}/block`, { method: 'POST' });
    },

    async unblockConversation(conversationId: string) {
        console.log('[CHAT] Unblocking conversation:', conversationId);
        return await request<any>(`/conversations/${encodeURIComponent(conversationId)}/unblock`, { method: 'POST' });
    },

    async getJobStatus(jobId: string) {
        console.log('[CHAT] Getting job status:', jobId);
        return await request<{ job_id: string; job_title: string; job_status: string }>(`/jobs/${encodeURIComponent(jobId)}/status`, { method: 'GET' });
    },

    /**
     * Debug helper: attempt to fetch/generate a chat token and return
     * diagnostic information about each attempted endpoint.
     * Useful for manual testing from a debug screen.
     */
    async debugFetchChatToken(): Promise<{ success: boolean; attempts: any[]; token?: string }>{
        const attempts: any[] = [];

        const pushAttempt = (url: string, ok: boolean, status: number | null, body: any, error?: string) => {
            attempts.push({ url, ok, status, body, error });
        };

        try {
            // Try the same sequence used by getChatToken but capture raw responses
            const paths = [
                `${CONFIG.CHAT_HTTP_BASE_URL}/api/chats/token`,
                `${CONFIG.CHAT_HTTP_BASE_URL}/api/chat/token`,
                `${CONFIG.API_BASE_URL.replace(/\/+$/, '')}/api/chats/token`,
                `${CONFIG.API_BASE_URL.replace(/\/+$/, '')}/api/chat/token`,
            ];

            for (const p of paths) {
                try {
                    const headers = new Headers();
                    headers.set('Accept', 'application/json');
                    headers.set('Content-Type', 'application/json');
                    const auth = await getToken();
                    if (auth) headers.set('Authorization', 'Bearer ' + auth);

                    // Prefer GET first
                    let resp = await fetch(p, { method: 'GET', headers });
                    const text = await resp.text();
                    let parsed = null;
                    try { parsed = text ? JSON.parse(text) : null; } catch {}
                    pushAttempt(p + ' [GET]', resp.ok, resp.status, parsed || text);
                    if (resp.ok && parsed) {
                        const data = parsed.data || parsed;
                        if (data?.token) {
                            await SecureStore.setItemAsync('chat_token', data.token);
                            if (data.expires_at) await SecureStore.setItemAsync('chat_token_expires_at', data.expires_at);
                            return { success: true, attempts, token: data.token };
                        }
                    }

                    // Try POST
                    resp = await fetch(p, { method: 'POST', headers, body: JSON.stringify({ refresh: true }) });
                    const text2 = await resp.text();
                    let parsed2 = null;
                    try { parsed2 = text2 ? JSON.parse(text2) : null; } catch {}
                    pushAttempt(p + ' [POST]', resp.ok, resp.status, parsed2 || text2);
                    if (resp.ok && parsed2) {
                        const data = parsed2.data || parsed2;
                        if (data?.token) {
                            await SecureStore.setItemAsync('chat_token', data.token);
                            if (data.expires_at) await SecureStore.setItemAsync('chat_token_expires_at', data.expires_at);
                            return { success: true, attempts, token: data.token };
                        }
                    }
                } catch (err: any) {
                    pushAttempt(p, false, null, null, err?.message || String(err));
                }
            }

            return { success: false, attempts };
        } catch (err: any) {
            attempts.push({ url: 'internal', ok: false, status: null, body: null, error: err?.message || String(err) });
            return { success: false, attempts };
        }
    }
};

export default chatService;
