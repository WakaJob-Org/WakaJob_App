import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Dimensions,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Notification {
    id: string;
    type: 'application_received' | 'application_accepted' | 'job_match' | 'profile_viewed' | 'message';
    title: string;
    description: string;
    time: string;
    isUnread: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'application_received',
        title: 'Application Received!',
        description: 'Google has received your application for Software Engineer.',
        time: '2 hours ago',
        isUnread: true,
    },
    {
        id: '1b',
        type: 'application_received',
        title: 'Application Received!',
        description: 'Google has received your application for Software Engineer.',
        time: '2 hours ago',
        isUnread: false,
    },
    {
        id: '2',
        type: 'application_accepted',
        title: 'Application Accepted!',
        description: 'Meta has moved your application for Product Designer to the next stage.',
        time: '5 hours ago',
        isUnread: false,
    },
    {
        id: '3',
        type: 'job_match',
        title: 'New Job Match',
        description: 'A new Senior Developer role at Amazon matches your profile and preferences.',
        time: '1 day ago',
        isUnread: false,
    },
    {
        id: '4',
        type: 'profile_viewed',
        title: 'Profile Viewed',
        description: 'A recruiter from Microsoft viewed your profile.',
        time: '2 days ago',
        isUnread: false,
    },
    {
        id: '5',
        type: 'message',
        title: 'New Message',
        description: 'You have a new direct message from Sarah Chen regarding the UX role.',
        time: '3 days ago',
        isUnread: false,
    },
];

interface NotificationsScreenProps {
    isVisible: boolean;
    onClose: () => void;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ isVisible, onClose }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('All');
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [refreshing, setRefreshing] = useState(false);

    const getIcon = (type: string) => {
        switch (type) {
            case 'application_received': return { name: 'send-outline', color: '#1972ca', bg: '#EBF4FF' };
            case 'application_accepted': return { name: 'checkmark-circle-outline', color: '#10B981', bg: '#DCFCE7' };
            case 'job_match': return { name: 'notifications-outline', color: '#1972ca', bg: '#EBF4FF' };
            case 'profile_viewed': return { name: 'briefcase-outline', color: '#6B7280', bg: '#F3F4F6' };
            case 'message': return { name: 'mail-outline', color: '#6B7280', bg: '#F3F4F6' };
            default: return { name: 'notifications-outline', color: '#1972ca', bg: '#EBF4FF' };
        }
    };

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
    };

    const handleNotificationPress = (id: string) => {
        setNotifications(notifications.map(n => 
            n.id === id ? { ...n, isUnread: false } : n
        ));
    };

    const onRefresh = () => {
        setRefreshing(true);
        // Simulate loading
        setTimeout(() => setRefreshing(false), 1500);
    };

    const renderItem = ({ item, index }: { item: Notification, index: number }) => {
        const iconConfig = getIcon(item.type);

        return (
            <TouchableOpacity 
                onPress={() => handleNotificationPress(item.id)}
                activeOpacity={0.7}
            >
                <Animated.View
                    entering={FadeInRight.delay(index * 100).duration(500)}
                    style={[
                        styles.notificationItem,
                        item.isUnread && styles.unreadItem
                    ]}
                >
                    {item.isUnread && <View style={styles.unreadIndicatorBar} />}

                    <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
                        <Ionicons name={iconConfig.name as any} size={24} color={iconConfig.color} />
                    </View>

                    <View style={styles.contentContainer}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.time}>{item.time}</Text>
                        </View>
                        <Text style={styles.description}>{item.description}</Text>

                        {item.isUnread && (
                            <View style={styles.unreadLabelContainer}>
                                <View style={styles.unreadDot} />
                                <Text style={styles.unreadText}>UNREAD</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    if (!isVisible) return null;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={handleMarkAllRead}>
                    <Text style={styles.markReadText}>Mark all as read</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
                {['All', 'Jobs', 'Alerts'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1972ca']} />
                }
                ListFooterComponent={
                    <TouchableOpacity style={styles.loadMoreBtn}>
                        <Text style={styles.loadMoreText}>LOAD OLDER NOTIFICATIONS</Text>
                    </TouchableOpacity>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        justifyContent: 'space-between',
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
    },
    markReadText: {
        fontSize: 14,
        color: '#1972ca',
        fontWeight: '600',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 10,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    activeTab: {
        backgroundColor: '#1972ca',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    listContent: {
        paddingBottom: 40,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    unreadItem: {
        backgroundColor: '#F8FAFF',
    },
    unreadIndicatorBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
        backgroundColor: '#1972ca',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contentContainer: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    time: {
        fontSize: 12,
        color: '#9BA4B1',
        marginLeft: 10,
    },
    description: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 8,
    },
    unreadLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#1972ca',
    },
    unreadText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1972ca',
        letterSpacing: 0.5,
    },
    loadMoreBtn: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    loadMoreText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#9BA4B1',
        letterSpacing: 1,
    },
});

export default NotificationsScreen;
