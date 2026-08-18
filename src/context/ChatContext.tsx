import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
    useCallback,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import CONFIG from '../config';
import { useAuth } from './AuthContext';
import chatService, {
    ChatMessage,
} from '../services/chatService';

export type MessageStatus =
    | 'sending'
    | 'sent'
    | 'failed';

export interface ClientChatMessage
    extends ChatMessage {
    status: MessageStatus;
    clientId: string;
}

export interface ConversationShell {
    id: string;
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

    openConversation: (
        shell: Omit<
            ConversationShell,
            'lastMessage' |
            'lastUpdated' |
            'unreadCount'
        >
    ) => ConversationShell;

    setActiveConversationId: (
        conversationId: string | null
    ) => void;

    markConversationRead: (
        conversationId: string
    ) => void;

    deleteConversation: (
        conversationId: string
    ) => Promise<void>;

    fetchHistory: (
        conversationId: string
    ) => Promise<ClientChatMessage[]>;

    sendMessage: (
        conversationId: string,
        recipientId: string,
        content: string
    ) => ClientChatMessage;

    retryMessage: (
        conversationId: string,
        message: ClientChatMessage
    ) => void;

    subscribe: (
        conversationId: string,
        callback: (
            message: ClientChatMessage
        ) => void
    ) => () => void;
}

const ChatContext =
    createContext<ChatContextType | undefined>(
        undefined
    );

const registryKey = (
    userId: string
) =>
    `wakajob_chat_conversations_${userId}`;

const messagesKey = (
    userId: string,
    conversationId: string
) =>
    `wakajob_chat_messages_${userId}_${conversationId}`;

const MAX_BACKOFF_MS = 30000;
const SEND_TIMEOUT_MS = 45000;

const MAX_LOCAL_MESSAGES = 500;

const getMessageId = (
    message: Partial<ClientChatMessage>
) =>
    message.id ||
    message._id ||
    message.clientId;

const dedupeMessages = (
    messages: ClientChatMessage[]
): ClientChatMessage[] => {
    const result: ClientChatMessage[] = [];
    const seen = new Set<string>();

    for (const message of messages) {
        const id = getMessageId(message);

        if (!id) {
            result.push(message);
            continue;
        }

        if (seen.has(id)) {
            continue;
        }

        seen.add(id);
        result.push(message);
    }

    return result;
};

const areLikelySameMessage = (
    a: ClientChatMessage,
    b: ClientChatMessage
) => {
    if (
        a.id &&
        b.id &&
        a.id === b.id
    ) {
        return true;
    }

    if (
        a._id &&
        b._id &&
        a._id === b._id
    ) {
        return true;
    }

    if (
        a.clientId &&
        b.clientId &&
        a.clientId === b.clientId
    ) {
        return true;
    }

    if (
        a.sender_id !==
        b.sender_id
    ) {
        return false;
    }

    if (
        a.content !==
        b.content
    ) {
        return false;
    }

    const aTime = new Date(
        a.created_at || ''
    ).getTime();

    const bTime = new Date(
        b.created_at || ''
    ).getTime();

    if (
        !Number.isFinite(aTime) ||
        !Number.isFinite(bTime)
    ) {
        return false;
    }

    return (
        Math.abs(aTime - bTime) <=
        2 * 60 * 1000
    );
};

export const ChatProvider: React.FC<{
    children: ReactNode;
}> = ({ children }) => {
    const {
        user,
        isAuthenticated,
    } = useAuth();

    const userId = user?.id;

    const [
        conversations,
        setConversations,
    ] = useState<
        ConversationShell[]
    >([]);

    const [
        isLoadingConversations,
        setIsLoadingConversations,
    ] = useState(true);

    const [
        isSocketConnected,
        setIsSocketConnected,
    ] = useState(false);

    const [
        isConnecting,
        setIsConnecting,
    ] = useState(false);

    const [
        hasEverConnected,
        setHasEverConnected,
    ] = useState(false);

    const wsRef =
        useRef<WebSocket | null>(
            null
        );

    const connectingRef =
        useRef(false);

    const reconnectAttempt =
        useRef(0);

    const reconnectTimer =
        useRef<
            ReturnType<typeof setTimeout> | null
        >(null);

    const closedByUs =
        useRef(false);

    const activeConversationRef =
        useRef<string | null>(
            null
        );

    const conversationsRef =
        useRef<
            ConversationShell[]
        >([]);

    const listeners =
        useRef<
            Map<
                string,
                Set<
                    (
                        message: ClientChatMessage
                    ) => void
                >
            >
        >(new Map());

    const pendingOptimistic =
        useRef<
            Map<
                string,
                ClientChatMessage
            >
        >(new Map());

    const sendQueue =
        useRef<
            Map<
                string,
                {
                    conversation_id: string;
                    recipient_id: string;
                    content: string;
                }
            >
        >(new Map());

    const sendTimeouts =
        useRef<
            Map<
                string,
                ReturnType<typeof setTimeout>
            >
        >(new Map());

    // Track how many automatic resend attempts we've made for a given
    // client-generated message. This prevents infinite automatic retries
    // when the server is down or the socket is being rejected.
    const sendAttempts =
        useRef<Map<string, number>>(new Map());

    useEffect(() => {
        conversationsRef.current =
            conversations;
    }, [conversations]);

    /**
     * =====================================================
     * LOCAL CONVERSATION STORAGE
     * =====================================================
     */

    const persist = useCallback(
        async (
            next: ConversationShell[]
        ) => {
            if (!userId) return;

            try {
                await AsyncStorage.setItem(
                    registryKey(userId),
                    JSON.stringify(next)
                );
            } catch (error) {
                console.error(
                    'Failed to persist chat conversation registry:',
                    error
                );
            }
        },
        [userId]
    );

    /**
     * =====================================================
     * LOCAL MESSAGE STORAGE
     * =====================================================
     */

    const persistMessages =
        useCallback(
            async (
                conversationId: string,
                messages: ClientChatMessage[]
            ) => {
                if (
                    !userId ||
                    !conversationId
                ) {
                    return;
                }

                try {
                    const cleaned =
                        dedupeMessages(
                            messages
                        );

                    const limited =
                        cleaned
                            .sort(
                                (
                                    a,
                                    b
                                ) =>
                                    new Date(
                                        a.created_at ||
                                            ''
                                    ).getTime() -
                                    new Date(
                                        b.created_at ||
                                            ''
                                    ).getTime()
                            )
                            .slice(
                                -MAX_LOCAL_MESSAGES
                            );

                    await AsyncStorage.setItem(
                        messagesKey(
                            userId,
                            conversationId
                        ),
                        JSON.stringify(
                            limited
                        )
                    );
                } catch (error) {
                    console.error(
                        'Failed to save local chat messages:',
                        error
                    );
                }
            },
            [userId]
        );

    const loadLocalMessages =
        useCallback(
            async (
                conversationId: string
            ): Promise<ClientChatMessage[]> => {
                if (
                    !userId ||
                    !conversationId
                ) {
                    return [];
                }

                try {
                    const raw =
                        await AsyncStorage.getItem(
                            messagesKey(
                                userId,
                                conversationId
                            )
                        );

                    if (!raw) {
                        return [];
                    }

                    const parsed =
                        JSON.parse(
                            raw
                        );

                    if (
                        !Array.isArray(
                            parsed
                        )
                    ) {
                        return [];
                    }

                    return dedupeMessages(
                        parsed
                    );
                } catch (error) {
                    console.error(
                        'Failed to load local chat messages:',
                        error
                    );

                    return [];
                }
            },
            [userId]
        );

    const deleteLocalMessages =
        useCallback(
            async (
                conversationId: string
            ) => {
                if (!userId) return;

                try {
                    await AsyncStorage.removeItem(
                        messagesKey(
                            userId,
                            conversationId
                        )
                    );
                } catch (error) {
                    console.error(
                        'Failed to delete local chat messages:',
                        error
                    );
                }
            },
            [userId]
        );

    const mergeMessages =
        useCallback(
            (
                localMessages: ClientChatMessage[],
                serverMessages: ClientChatMessage[]
            ) => {
                const merged =
                    [...localMessages];

                for (
                    const serverMessage of serverMessages
                ) {
                    const alreadyExists =
                        merged.some(
                            (
                                localMessage
                            ) =>
                                areLikelySameMessage(
                                    localMessage,
                                    serverMessage
                                )
                        );

                    if (
                        !alreadyExists
                    ) {
                        merged.push(
                            serverMessage
                        );
                    } else {
                        const index =
                            merged.findIndex(
                                (
                                    localMessage
                                ) =>
                                    areLikelySameMessage(
                                        localMessage,
                                        serverMessage
                                    )
                            );

                        if (
                            index >=
                            0
                        ) {
                            merged[
                                index
                            ] =
                                serverMessage;
                        }
                    }
                }

                merged.sort(
                    (
                        a,
                        b
                    ) =>
                        new Date(
                            a.created_at ||
                                ''
                        ).getTime() -
                        new Date(
                            b.created_at ||
                                ''
                        ).getTime()
                );

                return dedupeMessages(
                    merged
                );
            },
            []
        );

    /**
     * =====================================================
     * CONVERSATION MANAGEMENT
     * =====================================================
     */

    const upsertConversation =
        useCallback(
            (
                partial: Partial<ConversationShell> & {
                    id: string;
                }
            ) => {
                setConversations(
                    (previous) => {
                        const existingIndex =
                            previous.findIndex(
                                (
                                    conversation
                                ) =>
                                    conversation.id ===
                                    partial.id
                            );

                        let next:
                            ConversationShell[];

                        if (
                            existingIndex >=
                            0
                        ) {
                            next = [
                                ...previous,
                            ];

                            next[
                                existingIndex
                            ] = {
                                ...next[
                                    existingIndex
                                ],
                                ...partial,
                            };
                        } else {
                            next = [
                                {
                                    id: partial.id,
                                    jobId:
                                        partial.jobId ||
                                        '',
                                    jobTitle:
                                        partial.jobTitle ||
                                        '',
                                    otherUserId:
                                        partial.otherUserId ||
                                        '',
                                    otherUserName:
                                        partial.otherUserName ||
                                        '',
                                    otherUserPhoto:
                                        partial.otherUserPhoto ??
                                        null,
                                    lastMessage:
                                        partial.lastMessage ||
                                        '',
                                    lastUpdated:
                                        partial.lastUpdated ||
                                        new Date().toISOString(),
                                    unreadCount:
                                        partial.unreadCount ||
                                        0,
                                },
                                ...previous,
                            ];
                        }

                        next.sort(
                            (
                                a,
                                b
                            ) =>
                                new Date(
                                    b.lastUpdated
                                ).getTime() -
                                new Date(
                                    a.lastUpdated
                                ).getTime()
                        );

                        persist(next);

                        return next;
                    }
                );
            },
            [persist]
        );

    /**
     * =====================================================
     * LISTENER MANAGEMENT
     * =====================================================
     */

    const notifyListeners =
        useCallback(
            (
                conversationId: string,
                message: ClientChatMessage
            ) => {
                const callbacks =
                    listeners.current.get(
                        conversationId
                    );

                callbacks?.forEach(
                    (
                        callback
                    ) => {
                        callback(
                            message
                        );
                    }
                );
            },
            []
        );

    /**
     * =====================================================
     * INCOMING WEBSOCKET MESSAGE
     * =====================================================
     */

    const handleInboundFrame =
        useCallback(
            async (raw: any) => {
                if (!raw) return;

                if (
                    !raw.conversation_id
                ) {
                    return;
                }

                const incoming:
                    ChatMessage = raw;

                let reconciledClientId:
                    | string
                    | undefined;

                if (
                    incoming.sender_id ===
                    userId
                ) {
                    for (
                        const [
                            clientId,
                            pending,
                        ] of pendingOptimistic.current.entries()
                    ) {
                        if (
                            pending.conversation_id ===
                                incoming.conversation_id &&
                            pending.content ===
                                incoming.content &&
                            pending.status !==
                                'failed'
                        ) {
                            reconciledClientId =
                                clientId;
                            break;
                        }
                    }
                }

                const serverId =
                    incoming.id ||
                    incoming._id;

                const clientMessage:
                    ClientChatMessage = {
                    ...incoming,

                    status: 'sent',

                    clientId:
                        reconciledClientId ||
                        serverId ||
                        `server_${Date.now()}_${Math.random()
                            .toString(36)
                            .slice(2)}`,

                    created_at:
                        incoming.timestamp ||
                        incoming.created_at ||
                        new Date().toISOString(),
                };

                if (
                    reconciledClientId
                ) {
                    pendingOptimistic.current.delete(
                        reconciledClientId
                    );

                    const timeout =
                        sendTimeouts.current.get(
                            reconciledClientId
                        );

                    if (timeout) {
                        clearTimeout(
                            timeout
                        );
                    }

                    sendTimeouts.current.delete(
                        reconciledClientId
                    );
                }

                const localMessages =
                    await loadLocalMessages(
                        incoming.conversation_id
                    );

                const merged =
                    mergeMessages(
                        localMessages,
                        [
                            clientMessage,
                        ]
                    );

                await persistMessages(
                    incoming.conversation_id,
                    merged
                );

                notifyListeners(
                    incoming.conversation_id,
                    clientMessage
                );

                const isActive =
                    activeConversationRef.current ===
                    incoming.conversation_id;

                const isFromOther =
                    incoming.sender_id !==
                    userId;

                const existing =
                    conversationsRef.current.find(
                        (
                            conversation
                        ) =>
                            conversation.id ===
                            incoming.conversation_id
                    );

                upsertConversation({
                    id: incoming.conversation_id,

                    jobId:
                        existing?.jobId ||
                        '',

                    jobTitle:
                        existing?.jobTitle ||
                        '',

                    otherUserId:
                        existing?.otherUserId ||
                        (isFromOther
                            ? incoming.sender_id
                            : incoming.recipient_id ||
                              ''),

                    otherUserName:
                        existing?.otherUserName ||
                        '',

                    otherUserPhoto:
                        existing?.otherUserPhoto,

                    lastMessage:
                        incoming.content,

                    lastUpdated:
                        incoming.timestamp ||
                        incoming.created_at ||
                        new Date().toISOString(),

                    unreadCount:
                        isFromOther &&
                        !isActive
                            ? (existing?.unreadCount ||
                                  0) +
                              1
                            : existing?.unreadCount ||
                              0,
                });
            },
            [
                userId,
                notifyListeners,
                upsertConversation,
                loadLocalMessages,
                mergeMessages,
                persistMessages,
            ]
        );

    /**
     * =====================================================
     * GET VALID CHAT TOKEN
     * =====================================================
     *
     * This is different from auth_token.
     *
     * auth_token:
     * Used to authenticate REST API requests.
     *
     * chat_token:
     * Used to authenticate the WebSocket.
     */
    const getValidChatToken =
        useCallback(
            async (): Promise<string | null> => {
                try {
                    const existingToken =
                        await SecureStore.getItemAsync(
                            'chat_token'
                        );

                    const expiresAt =
                        await SecureStore.getItemAsync(
                            'chat_token_expires_at'
                        );

                    /**
                     * If a token exists and
                     * we don't have expiry information,
                     * use it.
                     */
                    if (
                        existingToken &&
                        !expiresAt
                    ) {
                        return existingToken;
                    }

                    /**
                     * Check expiration.
                     *
                     * Refresh 30 seconds before
                     * the actual expiry time.
                     */
                    if (
                        existingToken &&
                        expiresAt
                    ) {
                        const expiryTime =
                            new Date(
                                expiresAt
                            ).getTime();

                        if (
                            Number.isFinite(
                                expiryTime
                            ) &&
                            Date.now() <
                                expiryTime -
                                    30000
                        ) {
                            return existingToken;
                        }
                    }

                    /**
                     * Token doesn't exist or
                     * has expired.
                     *
                     * Ask backend for a new one.
                     */
                    console.log(
                        '[CHAT] Requesting fresh chat token...'
                    );

                    const response =
                        await chatService.getChatToken();

                    if (
                        !response?.token
                    ) {
                        throw new Error(
                            'Backend did not return a chat token.'
                        );
                    }

                    return response.token;
                } catch (error) {
                    console.error(
                        '[CHAT] Failed to obtain valid chat token:',
                        error
                    );

                    return null;
                }
            },
            []
        );

    /**
     * =====================================================
     * WEBSOCKET
     * =====================================================
     */

    const clearReconnectTimer =
        useCallback(() => {
            if (
                reconnectTimer.current
            ) {
                clearTimeout(
                    reconnectTimer.current
                );

                reconnectTimer.current =
                    null;
            }
        }, []);

    const connect =
        useCallback(async () => {
            if (
                !userId ||
                connectingRef.current ||
                wsRef.current
            ) {
                return;
            }

            connectingRef.current =
                true;

            closedByUs.current =
                false;

            clearReconnectTimer();

            setIsConnecting(
                true
            );

            /**
             * =================================================
             * GET CHAT TOKEN
             * =================================================
             *
             * IMPORTANT:
             * We DO NOT use auth_token here.
             *
             * The backend now provides a separate
             * WebSocket/chat token through:
             *
             * GET /api/chat/token
             */
            const chatToken =
                await getValidChatToken();

            if (!chatToken) {
                console.error(
                    '[CHAT] Could not obtain chat token.'
                );

                connectingRef.current =
                    false;

                setIsConnecting(
                    false
                );

                return;
            }

            /**
             * =================================================
             * CREATE WEBSOCKET URL
             * =================================================
             */
            const wsUrl =
                `${CONFIG.CHAT_WS_BASE_URL}/ws?token=` +
                encodeURIComponent(
                    chatToken
                );

            /**
             * Never print the actual token
             * to the console.
             */
            console.log(
                '[CHAT] Connecting WebSocket:',
                `${CONFIG.CHAT_WS_BASE_URL}/ws?token=***`
            );

            const ws =
                new WebSocket(
                    wsUrl
                );

            wsRef.current =
                ws;

            ws.onopen = () => {
                console.log(
                    '[CHAT] WebSocket connected successfully.'
                );

                connectingRef.current =
                    false;

                reconnectAttempt.current =
                    0;

                setIsSocketConnected(
                    true
                );

                setIsConnecting(
                    false
                );

                setHasEverConnected(
                    true
                );

                /**
                 * Send queued messages.
                 */
                const queued =
                    Array.from(
                        sendQueue.current.entries()
                    );

                sendQueue.current.clear();

                for (
                    const [
                        clientId,
                        payload,
                    ] of queued
                ) {
                    try {
                        ws.send(
                            JSON.stringify(
                                payload
                            )
                        );
                    } catch (
                        error
                    ) {
                        console.warn(
                            'Failed to send queued chat message:',
                            error
                        );

                        const pending =
                            pendingOptimistic.current.get(
                                clientId
                            );

                        if (
                            pending
                        ) {
                            const failed:
                                ClientChatMessage =
                                {
                                    ...pending,
                                    status:
                                        'failed',
                                };

                            pendingOptimistic.current.set(
                                clientId,
                                failed
                            );

                            notifyListeners(
                                payload.conversation_id,
                                failed
                            );

                            loadLocalMessages(
                                payload.conversation_id
                            ).then(
                                (
                                    local
                                ) =>
                                    persistMessages(
                                        payload.conversation_id,
                                        mergeMessages(
                                            local,
                                            [
                                                failed,
                                            ]
                                        )
                                    )
                            );
                        }
                    }
                }
            };

            ws.onmessage = (
                event
            ) => {
                try {
                    const data =
                        typeof event.data ===
                        'string'
                            ? JSON.parse(
                                  event.data
                              )
                            : event.data;

                    console.log(
                        '[CHAT] WebSocket message received:',
                        data
                    );

                    handleInboundFrame(
                        data
                    );
                } catch (
                    error
                ) {
                    console.error(
                        'Failed to parse chat WebSocket frame:',
                        error
                    );
                }
            };

            ws.onerror = (
                event
            ) => {
                console.warn(
                    '[CHAT] WebSocket error:',
                    (event as any)
                        ?.message ||
                        event
                );
            };

            ws.onclose =
                async (
                    event
                ) => {
                    console.warn(
                        '[CHAT] WebSocket closed:',
                        event.code,
                        event.reason
                    );

                    if (
                        wsRef.current ===
                        ws
                    ) {
                        wsRef.current =
                            null;
                    }

                    connectingRef.current =
                        false;

                    setIsSocketConnected(
                        false
                    );

                    setIsConnecting(
                        false
                    );

                    if (
                        closedByUs.current
                    ) {
                        return;
                    }

                    /**
                     * 4001 is commonly used by
                     * the backend for authentication
                     * failure/expired WebSocket token.
                     *
                     * Since we now use a separate
                     * chat token, request a fresh
                     * chat token instead of refreshing
                     * the normal auth token.
                     */
                    if (
                        event.code === 4001
                    ) {
                        console.log(
                            '[CHAT] WebSocket authentication failed. Requesting a fresh chat token...'
                        );

                        try {
                            await SecureStore.deleteItemAsync(
                                'chat_token'
                            );

                            await SecureStore.deleteItemAsync(
                                'chat_token_expires_at'
                            );

                            const freshToken =
                                await chatService.getChatToken();

                            if (
                                freshToken?.token
                            ) {
                                reconnectAttempt.current =
                                    0;

                                connect();

                                return;
                            }
                        } catch (
                            error
                        ) {
                            console.warn(
                                '[CHAT] Failed to refresh chat token after WebSocket authentication failure:',
                                error
                            );
                        }

                        return;
                    }

                    // Strict reconnect policy:
                    // only authenticate-related close codes should trigger reconnects.
                    // 1001/1006 are normal/transient server-side disconnects that can loop
                    // indefinitely and are not actionable auth failures.
                    console.warn(
                        '[CHAT] WebSocket closed with non-auth code; skipping automatic reconnect to avoid reconnect loops.',
                        {
                            code: event.code,
                            reason: event.reason || 'no reason',
                        }
                    );

                    reconnectAttempt.current = 0;
                    clearReconnectTimer();
                    return;
                };
        }, [
            userId,
            clearReconnectTimer,
            handleInboundFrame,
            notifyListeners,
            loadLocalMessages,
            persistMessages,
            mergeMessages,
            getValidChatToken,
        ]);

    const ensureConnecting =
        useCallback(() => {
            if (
                wsRef.current ||
                connectingRef.current
            ) {
                return;
            }

            connect();
        }, [connect]);

    const disconnect =
        useCallback(() => {
            closedByUs.current =
                true;

            connectingRef.current =
                false;

            clearReconnectTimer();

            reconnectAttempt.current =
                0;

            if (
                wsRef.current
            ) {
                wsRef.current.close();

                wsRef.current =
                    null;
            }

            setIsSocketConnected(
                false
            );

            setIsConnecting(
                false
            );

            sendTimeouts.current.forEach(
                (
                    timeout
                ) =>
                    clearTimeout(
                        timeout
                    )
            );

            sendTimeouts.current.clear();
        }, [clearReconnectTimer]);

    useEffect(() => {
        if (
            isAuthenticated &&
            userId
        ) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [
        isAuthenticated,
        userId,
        connect,
        disconnect,
    ]);

    /**
     * =====================================================
     * LOAD CONVERSATIONS
     * =====================================================
     */

    useEffect(() => {
        if (!userId) {
            setConversations(
                []
            );

            setIsLoadingConversations(
                false
            );

            return;
        }

        setIsLoadingConversations(
            true
        );

        let cancelled =
            false;

        (async () => {
            try {
                const serverList =
                    await chatService.listConversations();

                if (
                    !cancelled &&
                    serverList.length >
                        0
                ) {
                    const mapped =
                        serverList
                            .map(
                                (
                                    c: any
                                ) => ({
                                    id:
                                        c.id ||
                                        c._id ||
                                        c.conversation_id,

                                    jobId:
                                        c.job_id ||
                                        c.jobId ||
                                        '',

                                    jobTitle:
                                        c.job_title ||
                                        c.jobTitle ||
                                        '',

                                    otherUserId:
                                        c.other_user_id ||
                                        c.otherUserId ||
                                        (c.employer_id ===
                                        userId
                                            ? c.worker_id
                                            : c.employer_id) ||
                                        '',

                                    otherUserName:
                                        c.other_user_name ||
                                        c.otherUserName ||
                                        c.other_user
                                            ?.full_name ||
                                        '',

                                    otherUserPhoto:
                                        c.avatar_url ||
                                        c.other_user_photo ||
                                        c.otherUserPhoto ||
                                        null,

                                    lastMessage:
                                        c.last_message ||
                                        c.lastMessage ||
                                        '',

                                    lastUpdated:
                                        c.last_updated ||
                                        c.lastUpdated ||
                                        c.updated_at ||
                                        c.created_at ||
                                        new Date().toISOString(),

                                    unreadCount:
                                        Number(
                                            c.unread_count ||
                                                c.unreadCount ||
                                                0
                                        ),
                                })
                            )
                            .filter(
                                (
                                    c
                                ) =>
                                    !!c.id
                            );

                    // Sort once and persist immediately so UI can render quickly.
                    const sorted = mapped.sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
                    setConversations(sorted);

                    // For any conversations missing a human-readable name, attempt to
                    // fetch the profile from the main API and upsert it so the UI shows
                    // the correct display name/avatar. This happens when the chat
                    // engine returns only IDs and not nested user objects.
                    (async () => {
                        try {
                            const missing = sorted.filter((c: any) => !c.otherUserName && c.otherUserId);
                            for (const conv of missing) {
                                try {
                                    const jobService = (await import('../services/jobService')).default;
                                    const profile = await jobService.getUserProfile(conv.otherUserId);
                                    if (profile && (profile.full_name || profile.profile_image_url)) {
                                        upsertConversation({
                                            id: conv.id,
                                            otherUserName: profile.full_name || '',
                                            otherUserPhoto: profile.profile_image_url || null,
                                        });
                                    }
                                } catch (e) {
                                    // ignore per-conversation failures
                                }
                            }
                        } catch (e) {
                            // ignore
                        }
                    })();

                    await persist(
                        mapped
                    );
                } else if (
                    !cancelled
                ) {
                    const raw =
                        await AsyncStorage.getItem(
                            registryKey(
                                userId
                            )
                        );

                    if (raw) {
                        setConversations(
                            JSON.parse(
                                raw
                            )
                        );
                    }
                }
            } catch (
                error
            ) {
                console.error(
                    'Failed to load conversations:',
                    error
                );

                try {
                    const raw =
                        await AsyncStorage.getItem(
                            registryKey(
                                userId
                            )
                        );

                    if (
                        raw &&
                        !cancelled
                    ) {
                        setConversations(
                            JSON.parse(
                                raw
                            )
                        );
                    }
                } catch (
                    localError
                ) {
                    console.error(
                        'Failed to load local conversations:',
                        localError
                    );
                }
            } finally {
                if (
                    !cancelled
                ) {
                    setIsLoadingConversations(
                        false
                    );
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        userId,
        persist,
    ]);

    /**
     * =====================================================
     * CONVERSATION FUNCTIONS
     * =====================================================
     */

    const openConversation =
        useCallback(
            (
                shell: Omit<
                    ConversationShell,
                    'lastMessage' |
                    'lastUpdated' |
                    'unreadCount'
                >
            ) => {
                const existing =
                    conversationsRef.current.find(
                        (
                            c
                        ) =>
                            c.id ===
                            shell.id
                    );

                if (
                    existing
                ) {
                    return existing;
                }

                const created:
                    ConversationShell =
                    {
                        ...shell,
                        lastMessage:
                            '',
                        lastUpdated:
                            new Date().toISOString(),
                        unreadCount:
                            0,
                    };

                upsertConversation(
                    created
                );

                return created;
            },
            [upsertConversation]
        );

    const setActiveConversationId =
        useCallback(
            (
                conversationId:
                    | string
                    | null
            ) => {
                activeConversationRef.current =
                    conversationId;
            },
            []
        );

    const markConversationRead =
        useCallback(
            (
                conversationId: string
            ) => {
                setConversations(
                    (
                        previous
                    ) => {
                        const next =
                            previous.map(
                                (
                                    c
                                ) =>
                                    c.id ===
                                    conversationId
                                        ? {
                                              ...c,
                                              unreadCount:
                                                  0,
                                          }
                                        : c
                            );

                        persist(
                            next
                        );

                        return next;
                    }
                );
            },
            [persist]
        );

    const deleteConversation =
        useCallback(
            async (
                conversationId: string
            ) => {
                setConversations(
                    (
                        previous
                    ) => {
                        const next =
                            previous.filter(
                                (
                                    c
                                ) =>
                                    c.id !==
                                    conversationId
                            );

                        persist(
                            next
                        );

                        return next;
                    }
                );

                await deleteLocalMessages(
                    conversationId
                );

                try {
                    await chatService.deleteConversation(
                        conversationId
                    );
                } catch (
                    error
                ) {
                    console.warn(
                        'Server conversation delete failed:',
                        error
                    );
                }
            },
            [
                persist,
                deleteLocalMessages,
            ]
        );

    /**
     * =====================================================
     * FETCH CHAT HISTORY
     * =====================================================
     */

    const fetchHistory =
        useCallback(
            async (
                conversationId: string
            ): Promise<
                ClientChatMessage[]
            > => {
                const localMessages =
                    await loadLocalMessages(
                        conversationId
                    );

                try {
                    const history =
                        await chatService.getConversationMessages(
                            conversationId
                        );

                    const serverMessages =
                        history.map(
                            (
                                message
                            ) => ({
                                ...message,

                                status:
                                    'sent' as MessageStatus,

                                clientId:
                                    message.id ||
                                    message._id ||
                                    `history_${Date.now()}_${Math.random()
                                        .toString(
                                            36
                                        )
                                        .slice(
                                            2
                                        )}`,

                                created_at:
                                    message.timestamp ||
                                    message.created_at ||
                                    new Date().toISOString(),
                            })
                        );

                    const merged =
                        mergeMessages(
                            localMessages,
                            serverMessages
                        );

                    await persistMessages(
                        conversationId,
                        merged
                    );

                    return merged;
                } catch (
                    error
                ) {
                    console.warn(
                        'Server history unavailable. Using local chat history:',
                        error
                    );

                    return localMessages;
                }
            },
            [
                loadLocalMessages,
                mergeMessages,
                persistMessages,
            ]
        );

    /**
     * =====================================================
     * SEND MESSAGE
     * =====================================================
     */

    const attemptSend =
        useCallback(
            (
                clientId: string,
                payload: {
                    conversation_id: string;
                    recipient_id: string;
                    content: string;
                }
            ) => {
                const oldTimeout =
                    sendTimeouts.current.get(
                        clientId
                    );

                if (
                    oldTimeout
                ) {
                    clearTimeout(
                        oldTimeout
                    );

                    sendTimeouts.current.delete(
                        clientId
                    );
                }

                if (
                    wsRef.current
                        ?.readyState ===
                    WebSocket.OPEN
                ) {
                    try {
                        wsRef.current.send(
                            JSON.stringify(
                                payload
                            )
                        );
                    } catch (
                        error
                    ) {
                        console.warn(
                            'WebSocket send failed:',
                            error
                        );

                        // On send failure, instead of immediately marking the
                        // message as failed, attempt a single automatic resend by
                        // queueing the payload and triggering a reconnect. Track
                        // attempts to avoid infinite retry loops.
                        try {
                            const attempts =
                                sendAttempts.current.get(
                                    clientId
                                ) || 0;

                            if (attempts < 2) {
                                sendAttempts.current.set(
                                    clientId,
                                    attempts + 1
                                );

                                sendQueue.current.set(
                                    clientId,
                                    payload
                                );

                                ensureConnecting();

                                // Don't mark as failed yet — give the reconnect
                                // logic time to deliver the queued message.
                                return;
                            }
                        } catch (e) {
                            // ignore bookkeeping errors
                        }

                        const pending =
                            pendingOptimistic.current.get(
                                clientId
                            );

                        if (
                            pending
                        ) {
                            const failed:
                                ClientChatMessage =
                                {
                                    ...pending,
                                    status:
                                        'failed',
                                };

                            pendingOptimistic.current.set(
                                clientId,
                                failed
                            );

                            notifyListeners(
                                payload.conversation_id,
                                failed
                            );

                            loadLocalMessages(
                                payload.conversation_id
                            ).then(
                                (
                                    local
                                ) =>
                                    persistMessages(
                                        payload.conversation_id,
                                        mergeMessages(
                                            local,
                                            [
                                                failed,
                                            ]
                                        )
                                    )
                            );
                        }

                        return;
                    }
                } else {
                    // If websocket is not open, queue and try connecting. Also
                    // reset attempt counter so the queued message gets two tries.
                    sendAttempts.current.set(clientId, 0);

                    sendQueue.current.set(
                        clientId,
                        payload
                    );

                    ensureConnecting();
                }

                const timeout =
                    setTimeout(
                        () => {
                            sendTimeouts.current.delete(
                                clientId
                            );

                            sendQueue.current.delete(
                                clientId
                            );

                            const pending =
                                pendingOptimistic.current.get(
                                    clientId
                                );

                            if (
                                pending &&
                                pending.status !==
                                    'sent'
                            ) {
                                const failed:
                                    ClientChatMessage =
                                    {
                                        ...pending,
                                        status:
                                            'failed',
                                    };

                                pendingOptimistic.current.set(
                                    clientId,
                                    failed
                                );

                                notifyListeners(
                                    payload.conversation_id,
                                    failed
                                );

                                loadLocalMessages(
                                    payload.conversation_id
                                ).then(
                                    (
                                        local
                                    ) =>
                                        persistMessages(
                                            payload.conversation_id,
                                            mergeMessages(
                                                local,
                                                [
                                                    failed,
                                                ]
                                            )
                                        )
                                );
                            }
                        },
                        SEND_TIMEOUT_MS
                    );

                sendTimeouts.current.set(
                    clientId,
                    timeout
                );
            },
            [
                ensureConnecting,
                notifyListeners,
                loadLocalMessages,
                persistMessages,
                mergeMessages,
            ]
        );

    const sendMessage =
        useCallback(
            (
                conversationId: string,
                recipientId: string,
                content: string
            ) => {
                const clientId =
                    `local_${Date.now()}_${Math.random()
                        .toString(
                            36
                        )
                        .slice(
                            2
                        )}`;

                const optimistic:
                    ClientChatMessage =
                    {
                        id: clientId,
                        clientId,

                        conversation_id:
                            conversationId,

                        sender_id:
                            userId || '',

                        recipient_id:
                            recipientId,

                        content,

                        created_at:
                            new Date().toISOString(),

                        status:
                            'sending',
                    };

                pendingOptimistic.current.set(
                    clientId,
                    optimistic
                );

                loadLocalMessages(
                    conversationId
                ).then(
                    (
                        local
                    ) => {
                        const merged =
                            mergeMessages(
                                local,
                                [
                                    optimistic,
                                ]
                            );

                        return persistMessages(
                            conversationId,
                            merged
                        );
                    }
                );

                notifyListeners(
                    conversationId,
                    optimistic
                );

                attemptSend(
                    clientId,
                    {
                        conversation_id:
                            conversationId,

                        recipient_id:
                            recipientId,

                        content,
                    }
                );

                const existing =
                    conversationsRef.current.find(
                        (
                            c
                        ) =>
                            c.id ===
                            conversationId
                    );

                upsertConversation({
                    id: conversationId,

                    jobId:
                        existing?.jobId ||
                        '',

                    jobTitle:
                        existing?.jobTitle ||
                        '',

                    otherUserId:
                        existing?.otherUserId ||
                        recipientId,

                    otherUserName:
                        existing?.otherUserName ||
                        '',

                    otherUserPhoto:
                        existing?.otherUserPhoto,

                    lastMessage:
                        content,

                    lastUpdated:
                        optimistic.created_at!,

                    unreadCount:
                        existing?.unreadCount ||
                        0,
                });

                return optimistic;
            },
            [
                userId,
                attemptSend,
                upsertConversation,
                notifyListeners,
                loadLocalMessages,
                persistMessages,
                mergeMessages,
            ]
        );

    /**
     * =====================================================
     * RETRY MESSAGE
     * =====================================================
     */

    const retryMessage =
        useCallback(
            (
                conversationId: string,
                message: ClientChatMessage
            ) => {
                const pending:
                    ClientChatMessage =
                    {
                        ...message,
                        status:
                            'sending',
                    };

                pendingOptimistic.current.set(
                    message.clientId,
                    pending
                );

                loadLocalMessages(
                    conversationId
                ).then(
                    (
                        local
                    ) =>
                        persistMessages(
                            conversationId,
                            mergeMessages(
                                local,
                                [
                                    pending,
                                ]
                            )
                        )
                );

                notifyListeners(
                    conversationId,
                    pending
                );

                attemptSend(
                    message.clientId,
                    {
                        conversation_id:
                            conversationId,

                        recipient_id:
                            message.recipient_id ||
                            '',

                        content:
                            message.content,
                    }
                );
            },
            [
                notifyListeners,
                attemptSend,
                loadLocalMessages,
                persistMessages,
                mergeMessages,
            ]
        );

    /**
     * =====================================================
     * SUBSCRIBE
     * =====================================================
     */

    const subscribe =
        useCallback(
            (
                conversationId: string,
                callback: (
                    message: ClientChatMessage
                ) => void
            ) => {
                if (
                    !listeners.current.has(
                        conversationId
                    )
                ) {
                    listeners.current.set(
                        conversationId,
                        new Set()
                    );
                }

                listeners.current
                    .get(
                        conversationId
                    )!
                    .add(callback);

                return () => {
                    listeners.current
                        .get(
                            conversationId
                        )
                        ?.delete(
                            callback
                        );
                };
            },
            []
        );

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

                deleteConversation,

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

export const useChat =
    () => {
        const context =
            useContext(
                ChatContext
            );

        if (!context) {
            throw new Error(
                'useChat must be used within a ChatProvider'
            );
        }

        return context;
    };