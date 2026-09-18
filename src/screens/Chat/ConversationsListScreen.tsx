import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useChat, ConversationShell } from '../../context/ChatContext';
import ConversationsSkeleton from '../../components/ConversationsSkeleton';

const AVATAR_COLORS = ['#9CA3AF', '#6B7280', '#4B5563', '#93C5FD', '#F59E0B', '#10B981'];

const colorForId = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initialsFor = (name: string) =>
    name.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

// Matches the design brief's examples ("5 min ago", "Yesterday", "Jul 28")
// using only client-side data, since the chat engine sends a plain ISO
// created_at/last_updated with no separate "relative time" field.
const formatTimestamp = (iso: string): string => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    const isYesterday =
        date.getDate() === now.getDate() - 1 &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
    if (isYesterday) return 'Yesterday';

    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const EmptyState = ({ onBrowse }: { onBrowse: () => void }) => (
    <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
            <Ionicons name="chatbubbles-outline" size={48} color="#1972ca" />
        </View>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptySubtitle}>
            Start a conversation by messaging a worker or employer from their profile.
        </Text>
        <TouchableOpacity style={styles.emptyCta} onPress={onBrowse} activeOpacity={0.85}>
            <Text style={styles.emptyCtaText}>Browse Jobs</Text>
        </TouchableOpacity>
    </View>
);

const ConversationsListScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { conversations, markConversationRead, deleteConversation, isLoadingConversations } = useChat();
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.trim().toLowerCase();
        return conversations.filter(
            (c) => c.otherUserName.toLowerCase().includes(q) || c.jobTitle.toLowerCase().includes(q)
        );
    }, [conversations, searchQuery]);

    const openThread = (item: ConversationShell) => {
        markConversationRead(item.id);
        navigation.navigate('ChatConversation', {
            conversationId: item.id,
            jobId: item.jobId,
            jobTitle: item.jobTitle,
            otherUserId: item.otherUserId,
            otherUserName: item.otherUserName,
            otherUserPhoto: item.otherUserPhoto,
        });
    };

    const renderItem = ({ item }: { item: ConversationShell }) => {
        const isUnread = item.unreadCount > 0;
        return (
            <TouchableOpacity
                style={styles.row}
                onPress={() => openThread(item)}
                activeOpacity={0.7}
                onLongPress={() => {
                    Alert.alert(
                        'Delete conversation',
                        'Are you sure you want to delete this conversation? This will remove it from your conversations list.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                    try {
                                        await deleteConversation(item.id);
                                    } catch (e) {
                                        console.warn('Failed to delete conversation:', e);
                                        Alert.alert('Unable to delete', 'Could not delete the conversation. Please try again.');
                                    }
                                },
                            },
                        ],
                        { cancelable: true }
                    );
                }}
            >
                <View style={styles.avatarWrap}>
                    {item.otherUserPhoto ? (
                        <Image source={{ uri: item.otherUserPhoto }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: colorForId(item.otherUserId) }]}>
                            <Text style={styles.avatarInitials}>{initialsFor(item.otherUserName)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.rowContent}>
                    <View style={styles.rowTopLine}>
                        <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
                            {item.otherUserName || 'Wakajob User'}
                        </Text>
                        <Text style={styles.timestamp}>{formatTimestamp(item.lastUpdated)}</Text>
                    </View>
                    {!!item.jobTitle && (
                        <View style={styles.jobTag}>
                            <Text style={styles.jobTagText} numberOfLines={1}>{item.jobTitle}</Text>
                        </View>
                    )}
                    <View style={styles.rowBottomLine}>
                        <Text
                            style={[styles.preview, isUnread && styles.previewUnread]}
                            numberOfLines={1}
                        >
                            {item.lastMessage ? item.lastMessage.slice(0, 40) : 'Say hello \u{1F44B}'}
                        </Text>
                        {isUnread && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>Messages</Text>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search conversations"
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCorrect
                        spellCheck
                        keyboardType="default"
                    />
                </View>
            </View>

            {isLoadingConversations ? (
                <ConversationsSkeleton />
            ) : filtered.length === 0 ? (
                <EmptyState onBrowse={() => navigation.navigate('Jobs')} />
            ) : (
   <FlatList
    data={filtered.filter(
        (item, index, array) =>
            array.findIndex(
                (other) => other.id === item.id
            ) === index
    )}
    keyExtractor={(item) => item.id}
    renderItem={renderItem}
    contentContainerStyle={styles.listContent}
    showsVerticalScrollIndicator={false}
/>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        backgroundColor: '#1972ca',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        paddingHorizontal: 20,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 42,
        gap: 8,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },
    listContent: { paddingVertical: 8 },
    row: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    avatarWrap: { width: 52, height: 52 },
    avatarImage: { width: 52, height: 52, borderRadius: 26 },
    avatarFallback: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    rowContent: { flex: 1, justifyContent: 'center' },
    rowTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 15, fontWeight: '500', color: '#374151', flexShrink: 1 },
    nameUnread: { fontWeight: '700', color: '#111827' },
    timestamp: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
    jobTag: { alignSelf: 'flex-start', backgroundColor: '#EBF5FF', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
    jobTagText: { fontSize: 11, color: '#1972ca', fontWeight: '600' },
    rowBottomLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    preview: { fontSize: 13, color: '#9CA3AF', flex: 1 },
    previewUnread: { color: '#374151', fontWeight: '600' },
    badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#1972ca', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: 8 },
    badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyIconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    emptyCta: { backgroundColor: '#1972ca', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
    emptyCtaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});

export default ConversationsListScreen;
