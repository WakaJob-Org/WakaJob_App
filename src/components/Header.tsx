import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
    title: string;
    userName?: string;
    onSettingsPress?: () => void;
    onNotificationPress?: () => void;
    showBackButton?: boolean;
    onBackPress?: () => void;
    showSettings?: boolean;
}

const Header: React.FC<HeaderProps> = ({
    title,
    userName,
    onSettingsPress,
    onNotificationPress,
    showBackButton,
    onBackPress,
    showSettings = true
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
            <View style={styles.headerContent}>
                <View style={styles.leftSection}>
                    {showBackButton ? (
                        <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
                            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.greetingContainer}>
                            <Text style={styles.headerTitle}>{title}</Text>
                            {userName && <Text style={styles.userName}>Welcome, {userName}</Text>}
                        </View>
                    )}
                </View>

                <View style={styles.rightSection}>
                    <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
                        <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    {showSettings && (
                        <TouchableOpacity onPress={onSettingsPress} style={styles.iconButton}>
                            <View style={styles.profileIndicator}>
                                <Ionicons name="settings-outline" size={26} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#1972ca',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    leftSection: {
        flex: 1,
    },
    greetingContainer: {
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    userName: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    iconButton: {
        padding: 5,
    },
    profileIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default Header;
