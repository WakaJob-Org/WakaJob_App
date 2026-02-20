import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabType = 'jobs' | 'save' | 'applications' | 'profile';

interface BottomTabProps {
    activeTab: TabType;
    onTabPress: (tab: TabType) => void;
}

const BottomTab: React.FC<BottomTabProps> = ({ activeTab, onTabPress }) => {
    const insets = useSafeAreaInsets();

    const tabs: { type: TabType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
        { type: 'jobs', icon: 'home-outline', label: 'Jobs' },
        { type: 'save', icon: 'bookmark-outline', label: 'Save' },
        { type: 'applications', icon: 'document-text-outline', label: 'Applications' },
        { type: 'profile', icon: 'person-outline', label: 'Profile' },
    ];

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 15) }]}>
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
                    {activeTab === tab.type && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#1972ca',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 15,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFFFFF',
        marginTop: 4,
    },
});

export default BottomTab;
