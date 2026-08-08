import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import CONFIG from '../config';
import { useAuth } from './AuthContext';
import chatService, { ChatMessage } from '../services/chatService';

export type MessageStatus = 'sending' | 'sent' | 'failed';

// Extends the wire ChatMessage with client-only bookkeeping. The engine spec
// has no delivered/read acks and no typing/presence events, so those design-
// brief states are intentionally not modeled here - only what the backend
// can actually confirm (sending -> sent once the socket accepts the frame,
// or failed if it couldn't be sent).
export interface ClientChatMessage extends ChatMessage {
    status: MessageStatus;
    clientId: string;
}

export interface ConversationShell {
    id: string; // conversation_id
    jobId: string;
    jobTitle: string;
    otherUserId: string;
    otherUserName: string;
    otherUserPhoto?: string | null;
    lastMessage: string;
    lastUpdated: string;
    unreadCount: number;
}

interface ChatContextType {
    conversations: ConversationShell[];
    isLoadingConversations: boolean;
    isSocketConnected: boolean;
    isConnecting: boolean;
    hasEverConnected: boolean;
    openConversation: (shell: Omit<ConversationShell, 'lastMessage' | 'lastUpdated' | 'unreadCount'>) => ConversationShell;
    setActiveConversationId: (conversationId: string | null) => void;
    markConversationRead: (conversationId: string) => void;
    fetchHistory: (conversationId: string) => Promise<ClientChatMessage[]>;
    sendMessage: (conversationId: string, recipientId: string, content: string) => ClientChatMessage;
    retryMessage: (conversationId: string, message: ClientChatMessage) => void;
    subscribe: (conversationId: string, callback: (message: ClientChatMessage) => void) => () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const registryKey = (userId: string) => `wakajob_chat_conversations_${userId}`;

const MAX_BACKOFF_MS = 30000;
// Generous enough to ride out a Render free-tier cold start (documented as
// 30-50s) without prematurely flipping a queued message to "failed" while
// the connection is still legitimately coming up.
const SEND_TIMEOUT_MS = 45000;

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const userId = user?.id;

    const [conversations, setConversations] = useState<ConversationShell[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [hasEverConnected, setHasEverConnected] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const connectingRef = useRef(false);
    const reconnectAttempt = useRef(0);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closedByUs = useRef(false);
    const activeConversationRef = useRef<string | null>(null);
    const conversationsRef = useRef<ConversationShell[]>([]);
    const listeners = useRef<Map<string, Set<(message: ClientChatMessage) => void>>>(new Map());
    const pendingOptimistic = useRef<Map<string, ClientChatMessage>>(new Map()); // clientId -> message, awaiting echo
    const sendQueue = useRef<Map<string, object>>(new Map()); // clientId -> wire payload, waiting for the socket to open
    const sendTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    const persist = useCallback(async (next: ConversationShell[]) => {
        if (!userId) return;
        try {
            await AsyncStorage.setItem(registryKey(userId), JSON.stringify(next));
        } catch (e) {
            console.error('Failed to persist chat conversation registry:', e);
        }
    }, [userId]);

    const upsertConversation = useCallback((partial: Partial<ConversationShell> & { id: string }) => {
        setConversations((prev) => {
            const existingIndex = prev.findIndex((c) => c.id === partial.id);
            let next: ConversationShell[];
            if (existingIndex >= 0) {
                next = [...prev];
                next[existingIndex] = { ...next[existingIndex], ...partial };
            } else {
                next = [
                    {
                        id: partial.id,
                        jobId: partial.jobId || '',
                        jobTitle: partial.jobTitle || '',
                        otherUserId: partial.otherUserId || '',
                        otherUserName: partial.otherUserName || '',
                        otherUserPhoto: partial.otherUserPhoto ?? null,
                        lastMessage: partial.lastMessage || '',
                        lastUpdated: partial.lastUpdated || new Date().toISOString(),
                        unreadCount: partial.unreadCount || 0,
                    },
                    ...prev,
                ];
            }
            next.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
            persist(next);
            return next;
        });
    }, [persist]);

    const notifyListeners = useCallback((conversationId: string, message: ClientChatMessage) => {
        listeners.current.get(conversationId)?.forEach((cb) => cb(message));
    }, []);

    const handleInboundFrame = useCallback((raw: any) => {
        if (!raw || !raw.conversation_id) return;
        const incoming: ChatMessage = raw;

        // Reconcile against our own optimistic send if this is the server echo
        // of a message we just sent (same conversation + sender + content).
        let reconciledClientId: string | undefined;
        if (incoming.sender_id === userId) {
            for (const [clientId, pending] of pendingOptimistic.current.entries()) {
                if (
                    pending.conversation_id === incoming.conversation_id &&
                    pending.content === incoming.content &&
                    pending.status !== 'failed'
                ) {
                    reconciledClientId = clientId;
                    break;
                }
            }
        }

        const clientMessage: ClientChatMessage = {
            ...incoming,
            status: 'sent',
            clientId: reconciledClientId || incoming.id,
        };

        if (reconciledClientId) {
            pendingOptimistic.current.delete(reconciledClientId);
        }

        notifyListeners(incoming.conversation_id, clientMessage);

        const isActive = activeConversationRef.current === incoming.conversation_id;
        const isFromOther = incoming.sender_id !== userId;
        const existing = conversationsRef.current.find((c) => c.id === incoming.conversation_id);

        upsertConversation({
            id: incoming.conversation_id,
            jobId: existing?.jobId || '',
            jobTitle: existing?.jobTitle || '',
            otherUserId: existing?.otherUserId || (isFromOther ? incoming.sender_id : incoming.recipient_id),
            otherUserName: existing?.otherUserName || '',
            otherUserPhoto: existing?.otherUserPhoto,
            lastMessage: incoming.content,
            lastUpdated: incoming.created_at || new Date().toISOString(),
            unreadCount: isFromOther && !isActive ? (existing?.unreadCount || 0) + 1 : existing?.unreadCount || 0,
        });
    }, [userId, upsertConversation, notifyListeners]);

    const clearReconnectTimer = () => {
        if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
        }
    };

    const connect = useCallback(async () => {
        // Guards the window between calling connect() and wsRef.current being
        // set (the SecureStore read below is async) so a burst of sends while
        // offline can't spin up several concurrent sockets.
        if (!userId || connectingRef.current) return;
        connectingRef.current = true;
        clearReconnectTimer();
        closedByUs.current = false;
        setIsConnecting(true);

        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
            connectingRef.current = false;
            setIsConnecting(false);
            return;
        }

        const ws = new WebSocket(`${CONFIG.CHAT_WS_BASE_URL}/ws?token=${encodeURIComponent(token)}`);
        wsRef.current = ws;

        ws.onopen = () => {
            connectingRef.current = false;
            reconnectAttempt.current = 0;
            setIsSocketConnected(true);
            setIsConnecting(false);
            setHasEverConnected(true);

            // Flush anything typed while we were still connecting/reconnecting
            // instead of leaving it stranded as "failed" - see sendMessage.
            sendQueue.current.forEach((payload, clientId) => {
                ws.send(JSON.stringify(payload));
                const pending = pendingOptimistic.current.get(clientId);
                if (pending) {
                    const updated: ClientChatMessage = { ...pending, status: 'sent' };
                    pendingOptimistic.current.set(clientId, updated);
                    notifyListeners(updated.conversation_id, updated);
                }
                const timeout = sendTimeouts.current.get(clientId);
                if (timeout) clearTimeout(timeout);
                sendTimeouts.current.delete(clientId);
            });
            sendQueue.current.clear();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleInboundFrame(data);
            } catch (e) {
                console.error('Failed to parse chat WS frame:', e);
            }
        };

        ws.onerror = (event) => {
            // onclose fires right after in RN's WebSocket implementation - the
            // actual reconnect scheduling lives there to avoid double-scheduling.
            // Logged here (not just swallowed) so a persistent failure - bad
            // token, wrong URL, server down - is visible in the device logs
            // instead of looking identical to a normal cold-start retry.
            console.warn('Chat WebSocket error:', (event as any)?.message || event);
        };

        ws.onclose = (event) => {
            connectingRef.current = false;
            setIsSocketConnected(false);
            setIsConnecting(false);
            wsRef.current = null;
            console.warn(`Chat WebSocket closed (code ${event.code}${event.reason ? `, reason: ${event.reason}` : ''})`);
            if (closedByUs.current) return;

            // Exponential backoff, capped, so a sleeping Render free-tier
            // container (or a flaky network) doesn't get hammered.
            const delay = Math.min(1000 * 2 ** reconnectAttempt.current, MAX_BACKOFF_MS);
            reconnectAttempt.current += 1;
            reconnectTimer.current = setTimeout(() => {
                connect();
            }, delay);
        };
    }, [userId, handleInboundFrame, notifyListeners]);

    const ensureConnecting = useCallback(() => {
        if (wsRef.current || connectingRef.current) return;
        connect();
    }, [connect]);

    const disconnect = useCallback(() => {
        closedByUs.current = true;
        connectingRef.current = false;
        clearReconnectTimer();
        reconnectAttempt.current = 0;
        wsRef.current?.close();
        wsRef.current = null;
        setIsSocketConnected(false);
        setIsConnecting(false);
        sendTimeouts.current.forEach((timeout) => clearTimeout(timeout));
        sendTimeouts.current.clear();
        sendQueue.current.clear();
    }, []);

    // Single long-lived connection for the whole session, per the chat engine's
    // own recommended lifecycle (connect once at session init, not per-screen).
    useEffect(() => {
        if (isAuthenticated && userId) {
            connect();
        } else {
            disconnect();
        }
        return () => disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, userId]);

    // Load this user's locally-persisted conversation registry. There is no
    // "list conversations" endpoint on the chat engine, so this registry -
    // built from conversations the user has opened, kept live via the socket
    // above - is the source of truth for the Conversations List screen.
    useEffect(() => {
        if (!userId) {
            setConversations([]);
            setIsLoadingConversations(false);
            return;
        }
        setIsLoadingConversations(true);
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(registryKey(userId));
                if (raw) setConversations(JSON.parse(raw));
            } catch (e) {
                console.error('Failed to load chat conversation registry:', e);
            } finally {
                setIsLoadingConversations(false);
            }
        })();
    }, [userId]);

    const openConversation: ChatContextType['openConversation'] = useCallback((shell) => {
        const existing = conversationsRef.current.find((c) => c.id === shell.id);
        if (existing) return existing;
        const created: ConversationShell = {
            ...shell,
            lastMessage: '',
            lastUpdated: new Date().toISOString(),
            unreadCount: 0,
        };
        upsertConversation(created);
        return created;
    }, [upsertConversation]);

    const setActiveConversationId = useCallback((conversationId: string | null) => {
        activeConversationRef.current = conversationId;
    }, []);

    const markConversationRead = useCallback((conversationId: string) => {
        setConversations((prev) => {
            const next = prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c));
            persist(next);
            return next;
        });
    }, [persist]);

    const fetchHistory = useCallback(async (conversationId: string): Promise<ClientChatMessage[]> => {
        const history = await chatService.getConversationMessages(conversationId);
        return history.map((m) => ({ ...m, status: 'sent' as MessageStatus, clientId: m.id }));
    }, []);

    // Shared by sendMessage and retryMessage. If the socket is open right
    // now, send immediately. Otherwise - most commonly a Render cold start
    // still in progress - queue it and keep it in "sending" rather than
    // failing outright, kick a connection attempt if one isn't already under
    // way, and only give up after SEND_TIMEOUT_MS with nothing to show for
    // it. This is what makes sending "just work" once the socket comes up,
    // instead of requiring the user to notice and tap "retry" themselves.
    const attemptSend = useCallback((clientId: string, payload: { conversation_id: string; sender_id?: string; recipient_id: string; content: string }) => {
        const existingTimeout = sendTimeouts.current.get(clientId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            sendTimeouts.current.delete(clientId);
        }
        sendQueue.current.delete(clientId);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
            const pending = pendingOptimistic.current.get(clientId);
            if (pending) {
                const updated: ClientChatMessage = { ...pending, status: 'sent' };
                pendingOptimistic.current.set(clientId, updated);
                notifyListeners(payload.conversation_id, updated);
            }
            return;
        }

        sendQueue.current.set(clientId, payload);
        ensureConnecting();

        const timeout = setTimeout(() => {
            sendQueue.current.delete(clientId);
            sendTimeouts.current.delete(clientId);
            const pending = pendingOptimistic.current.get(clientId);
            if (pending && pending.status !== 'sent') {
                const failed: ClientChatMessage = { ...pending, status: 'failed' };
                pendingOptimistic.current.set(clientId, failed);
                notifyListeners(payload.conversation_id, failed);
            }
        }, SEND_TIMEOUT_MS);
        sendTimeouts.current.set(clientId, timeout);
    }, [notifyListeners, ensureConnecting]);

    const sendMessage: ChatContextType['sendMessage'] = useCallback((conversationId, recipientId, content) => {
        const clientId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const optimistic: ClientChatMessage = {
            id: clientId,
            clientId,
            conversation_id: conversationId,
            sender_id: userId || '',
            recipient_id: recipientId,
            content,
            created_at: new Date().toISOString(),
            status: 'sending',
        };
        pendingOptimistic.current.set(clientId, optimistic);
        attemptSend(clientId, { conversation_id: conversationId, sender_id: userId, recipient_id: recipientId, content });

        const existing = conversationsRef.current.find((c) => c.id === conversationId);
        upsertConversation({
            id: conversationId,
            jobId: existing?.jobId || '',
            jobTitle: existing?.jobTitle || '',
            otherUserId: existing?.otherUserId || recipientId,
            otherUserName: existing?.otherUserName || '',
            otherUserPhoto: existing?.otherUserPhoto,
            lastMessage: content,
            lastUpdated: optimistic.created_at,
            unreadCount: existing?.unreadCount || 0,
        });

        return optimistic;
    }, [userId, upsertConversation, attemptSend]);

    const retryMessage: ChatContextType['retryMessage'] = useCallback((conversationId, message) => {
        const pending: ClientChatMessage = { ...message, status: 'sending' };
        pendingOptimistic.current.set(message.clientId, pending);
        notifyListeners(conversationId, pending);
        attemptSend(message.clientId, {
            conversation_id: conversationId,
            sender_id: userId,
            recipient_id: message.recipient_id,
            content: message.content,
        });
    }, [userId, notifyListeners, attemptSend]);

    const subscribe: ChatContextType['subscribe'] = useCallback((conversationId, callback) => {
        if (!listeners.current.has(conversationId)) {
            listeners.current.set(conversationId, new Set());
        }
        listeners.current.get(conversationId)!.add(callback);
        return () => {
            listeners.current.get(conversationId)?.delete(callback);
        };
    }, []);

    return (
        <ChatContext.Provider
            value={{
                conversations,
                isLoadingConversations,
                isSocketConnected,
                isConnecting,
                hasEverConnected,
                openConversation,
                setActiveConversationId,
                markConversationRead,
                fetchHistory,
                sendMessage,
                retryMessage,
                subscribe,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
