import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import CONFIG from '../config';

// Dedicated axios instance for the Wakajob Chat Engine microservice - it is a
// separate deployment from the main API (CONFIG.API_BASE_URL), with its own
// Render free-tier cold start, so it gets its own timeout/baseURL rather than
// reusing services/api.ts.
const chatApi = axios.create({
    baseURL: CONFIG.CHAT_HTTP_BASE_URL,
    timeout: CONFIG.CHAT_CONNECT_TIMEOUT,
    headers: { Accept: 'application/json' },
});

chatApi.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    created_at: string;
}

// The chat engine spec exposes no "create/list conversations" endpoint - only
// WS send and GET /conversations/:id/messages for a thread you already know
// the id of. So conversation_id is derived deterministically on the client
// from the job + the two participants, meaning both sides always compute the
// same id independently with no server round trip needed to "create" one.
export function buildConversationId(jobId: string, userIdA: string, userIdB: string): string {
    const [a, b] = [userIdA, userIdB].sort();
    return `job_${jobId}_${a}_${b}`;
}

const chatService = {
    async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
        const response = await chatApi.get(`/conversations/${conversationId}/messages`);
        return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
};

export default chatService;
export { chatApi };
