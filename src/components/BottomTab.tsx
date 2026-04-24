// src/components/BottomTab.tsx
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabType = 'jobs' | 'saved' | 'applications' | 'profile';

interface BottomTabProps {
    activeTab: TabType;
    onTabPress: (tab: TabType) => void;
}

const BottomTab: React.FC<BottomTabProps> = ({ activeTab, onTabPress }) => {
    const insets = useSafeAreaInsets();

    const tabs: { type: TabType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
        { type: 'jobs', icon: 'home-outline', label: 'Home' },
        { type: 'saved', icon: 'bookmark-outline', label: 'Saved' },
        { type: 'applications', icon: 'briefcase-outline', label: 'Applications' },
        { type: 'profile', icon: 'person-outline', label: 'Profile' },
    ];

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.type}
                    style={styles.tabItem}
                    onPress={() => onTabPress(tab.type)}
                >
                    <Ionicons
                        name={activeTab === tab.type ? (tab.icon.replace('-outline', '') as any) : tab.icon}
                        size={24}
                        color={activeTab === tab.type ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                    />
                    <Text style={[
                        styles.tabLabel,
                        { color: activeTab === tab.type ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)' }
                    ]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#1972ca',
        paddingTop: 15,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 20,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
});

export default BottomTab;
