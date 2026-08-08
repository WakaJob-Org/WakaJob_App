// src/components/BottomTab.tsx
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabType = 'jobs' | 'saved' | 'applications' | 'chat' | 'profile';

interface BottomTabProps {
    activeTab: TabType;
    onTabPress: (tab: TabType) => void;
    chatUnreadCount?: number;
}

// Chat sits in the center slot as a raised circular button (mirrors the
// floating pill nav pattern where the middle action pops above the bar),
// so it's ordered here rather than alphabetically/by nav flow.
const TABS: { type: TabType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { type: 'jobs', icon: 'home-outline', label: 'Home' },
    { type: 'saved', icon: 'bookmark-outline', label: 'Saved' },
    { type: 'chat', icon: 'chatbubble-outline', label: 'Chat' },
    { type: 'applications', icon: 'briefcase-outline', label: 'Apps' },
    { type: 'profile', icon: 'person-outline', label: 'Profile' },
];

const BottomTab: React.FC<BottomTabProps> = ({ activeTab, onTabPress, chatUnreadCount = 0 }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.container}>
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.type;

                    if (tab.type === 'chat') {
                        return (
                            <TouchableOpacity
                                key={tab.type}
                                style={styles.centerTabItem}
                                onPress={() => onTabPress(tab.type)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.centerCircle}>
                                    <Ionicons
                                        name={isActive ? 'chatbubble' : 'chatbubble-outline'}
                                        size={26}
                                        color="#1972ca"
                                    />
                                    {chatUnreadCount > 0 && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>
                                                {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text
                                    style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={tab.type}
                            style={styles.tabItem}
                            onPress={() => onTabPress(tab.type)}
                        >
                            <Ionicons
                                name={isActive ? (tab.icon.replace('-outline', '') as any) : tab.icon}
                                size={24}
                                color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                            />
                            <Text
                                style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)' }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Floating wrapper positions the pill above the screen edge (with side
    // margins) instead of the bar spanning edge-to-edge and sitting flush
    // against the bottom - no overflow:hidden here so the center circle can
    // pop up past the container's own top edge.
    wrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#1972ca',
        borderRadius: 28,
        paddingTop: 12,
        paddingBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
        elevation: 20,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerTabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    centerCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -34,
        marginBottom: 6,
        borderWidth: 4,
        borderColor: '#1972ca',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 10,
    },
    tabLabel: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    tabLabelActive: {
        color: '#FFFFFF',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
});

export default BottomTab;
