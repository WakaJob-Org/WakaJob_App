import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    Image,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useChat, ClientChatMessage } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { AppStackParamList } from '../../navigation/types';
import ChatBubblesSkeleton from '../../components/ChatBubblesSkeleton';

type ChatConversationRouteProp = RouteProp<AppStackParamList, 'ChatConversation'>;

const initialsFor = (name: string) =>
    name.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const formatBubbleTime = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const StatusIcon: React.FC<{ status: ClientChatMessage['status'] }> = ({ status }) => {
    if (status === 'sending') return <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.75)" />;
    if (status === 'failed') return <Ionicons name="alert-circle" size={13} color="#FCA5A5" />;
    return <Ionicons name="checkmark" size={13} color="rgba(255,255,255,0.85)" />;
};

const ChatScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<ChatConversationRouteProp>();
    const { conversationId, jobTitle, otherUserId, otherUserName, otherUserPhoto } = route.params;
    const { user } = useAuth();
    const myId = user?.id || '';

    const { fetchHistory, sendMessage, retryMessage, subscribe, setActiveConversationId, markConversationRead, isSocketConnected, hasEverConnected } = useChat();

    const [messages, setMessages] = useState<ClientChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const listRef = useRef<FlatList>(null);

    // The input bar's bottom padding only needs to clear the home indicator
    // when the keyboard is hidden - once it's up, the keyboard itself is the
    // bottom edge, so that same padding just becomes dead space between the
    // input bar and the keyboard (rather than the small predictive-text-bar
    // gap it should be).
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        setActiveConversationId(conversationId);
        markConversationRead(conversationId);

        let cancelled = false;
        (async () => {
            try {
                const history = await fetchHistory(conversationId);
                if (!cancelled) setMessages(history);
            } catch (e) {
                console.error('Failed to load conversation history:', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        const unsubscribe = subscribe(conversationId, (incoming) => {
            setMessages((prev) => {
                const idx = prev.findIndex((m) => m.clientId === incoming.clientId);
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = incoming;
                    return next;
                }
                return [...prev, incoming];
            });
            if (incoming.sender_id !== myId) {
                markConversationRead(conversationId);
            }
        });

        return () => {
            cancelled = true;
            unsubscribe();
            setActiveConversationId(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    const scrollToEnd = useCallback(() => {
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }, []);

    useEffect(() => {
        if (!loading) scrollToEnd();
    }, [messages.length, loading, scrollToEnd]);

    const handleSend = () => {
        const content = draft.trim();
        if (!content) return;
        setDraft('');
        const optimistic = sendMessage(conversationId, otherUserId, content);
        setMessages((prev) => [...prev, optimistic]);
    };

    const handleRetry = (message: ClientChatMessage) => {
        setMessages((prev) => prev.map((m) => (m.clientId === message.clientId ? { ...m, status: 'sent' } : m)));
        retryMessage(conversationId, message);
    };

    const renderItem = ({ item }: { item: ClientChatMessage }) => {
        const mine = item.sender_id === myId;
        return (
            <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.content}</Text>
                    <View style={styles.bubbleMeta}>
                        <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                            {formatBubbleTime(item.created_at)}
                        </Text>
                        {mine && <StatusIcon status={item.status} />}
                    </View>
                </View>
                {mine && item.status === 'failed' && (
                    <TouchableOpacity onPress={() => handleRetry(item)} style={styles.retryRow}>
                        <Ionicons name="warning" size={12} color="#EF4444" />
                        <Text style={styles.retryText}>Tap to retry</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={insets.top}
        >
            <StatusBar style="light" />
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                {otherUserPhoto ? (
                    <Image source={{ uri: otherUserPhoto }} style={styles.headerAvatarImage} />
                ) : (
                    <View style={styles.headerAvatarFallback}>
                        <Text style={styles.headerAvatarInitials}>{initialsFor(otherUserName)}</Text>
                    </View>
                )}
                <Text style={styles.headerName} numberOfLines={1}>{otherUserName || 'Wakajob User'}</Text>
            </View>

            {!!jobTitle && (
                <View style={styles.jobBanner}>
                    <Ionicons name="briefcase-outline" size={14} color="#1972ca" />
                    <Text style={styles.jobBannerText} numberOfLines={1}>{jobTitle}</Text>
                </View>
            )}

            {/* Only warn about a *lost* connection, not the first-time connect
                (which can legitimately take a while on a cold Render
                container) - messages queue and auto-send once it's up, so
                there's nothing to alarm the user about during that window. */}
            {hasEverConnected && !isSocketConnected && (
                <View style={styles.offlineBanner}>
                    <Text style={styles.offlineBannerText}>
                        No connection to Wakajob live engine. Messages will be sent when you're back online.
                    </Text>
                </View>
            )}

            {loading ? (
                <ChatBubblesSkeleton />
            ) : (
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(item) => item.clientId}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={scrollToEnd}
                />
            )}

            <View style={[styles.inputBar, { paddingBottom: isKeyboardVisible ? 8 : Math.max(insets.bottom, 12) }]}>
                <TouchableOpacity style={styles.attachBtn} disabled>
                    <Ionicons name="attach-outline" size={22} color="#9CA3AF" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message"
                    placeholderTextColor="#9CA3AF"
                    value={draft}
                    onChangeText={setDraft}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!draft.trim()}
                >
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        backgroundColor: '#1972ca',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 14,
        gap: 10,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backBtn: { padding: 4 },
    headerAvatarImage: { width: 38, height: 38, borderRadius: 19 },
    headerAvatarFallback: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
    headerAvatarInitials: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    headerName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', flex: 1 },
    jobBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EBF5FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    jobBannerText: { fontSize: 12, color: '#1972ca', fontWeight: '600', flex: 1 },
    offlineBanner: { backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 8 },
    offlineBannerText: { fontSize: 12, color: '#B45309', fontWeight: '600' },
    listContent: { padding: 16, gap: 4 },
    bubbleRow: { marginBottom: 8, maxWidth: '80%' },
    bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    bubbleRowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
    bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleMine: { backgroundColor: '#1972ca', borderBottomRightRadius: 4 },
    bubbleTheirs: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
    bubbleText: { fontSize: 14, color: '#111827', flexShrink: 1 },
    bubbleTextMine: { color: '#FFFFFF' },
    bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-end' },
    bubbleTime: { fontSize: 10, color: '#9CA3AF' },
    bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
    retryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    retryText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 10,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    attachBtn: { padding: 8 },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
        maxHeight: 100,
    },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1972ca', alignItems: 'center', justifyContent: 'center' },
    sendBtnDisabled: { backgroundColor: '#BFDBFE' },
});

export default ChatScreen;
