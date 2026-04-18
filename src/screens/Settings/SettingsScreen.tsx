import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import Header from '../../components/Header';

import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen: React.FC = () => {
    const { logout } = useAuth();
    const navigation = useNavigation();
    const [pushEnabled, setPushEnabled] = React.useState(true);
    const [emailEnabled, setEmailEnabled] = React.useState(true);

    ScreenCapture.usePreventScreenCapture();

    const renderSettingItem = (icon: any, title: string, subtitle?: string, onPress?: () => void, isDestructive?: boolean) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={[styles.iconContainer, isDestructive && styles.destructiveIconContainer]}>
                <Ionicons name={icon} size={22} color={isDestructive ? '#FF3B30' : '#1972ca'} />
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, isDestructive && styles.destructiveText]}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {onPress && <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />}
        </TouchableOpacity>
    );

    const renderToggleItem = (icon: any, title: string, subtitle: string, value: boolean, onValueChange: (v: boolean) => void) => (
        <View style={styles.settingItem}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={22} color="#1972ca" />
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingSubtitle}>{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#E2E8F0', true: '#1972ca' }}
                thumbColor="#FFFFFF"
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <Header
                title="Settings"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showSettings={false}
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.sectionCard}>
                        {renderSettingItem('person-outline', 'Personal Information', 'Change your name and contact details', () => { })}
                        <View style={styles.divider} />
                        {renderSettingItem('lock-closed-outline', 'Security', 'Update password and login methods', () => { })}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.sectionCard}>
                        {renderToggleItem('notifications-outline', 'Push Notifications', 'Receive job alerts and updates', pushEnabled, setPushEnabled)}
                        <View style={styles.divider} />
                        {renderToggleItem('mail-outline', 'Email Notifications', 'Summary of job activity and news', emailEnabled, setEmailEnabled)}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.sectionCard}>
                        {renderSettingItem('globe-outline', 'Language', 'English (US)', () => { })}
                        <View style={styles.divider} />
                        {renderSettingItem('color-palette-outline', 'Appearance', 'Light Mode', () => { })}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <View style={styles.sectionCard}>
                        {renderSettingItem('help-circle-outline', 'Help Center', 'FAQs and technical support', () => { })}
                        <View style={styles.divider} />
                        {renderSettingItem('shield-checkmark-outline', 'Privacy Policy', 'How we handle your data', () => { })}
                        <View style={styles.divider} />
                        {renderSettingItem('information-circle-outline', 'About WakaJob', 'v1.0.0', () => { })}
                    </View>
                </View>

                <View style={[styles.section, { marginBottom: 40 }]}>
                    <View style={styles.sectionCard}>
                        {renderSettingItem('log-out-outline', 'Log Out', 'Sign out of your account', logout, true)}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 5,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f1f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    destructiveIconContainer: {
        backgroundColor: '#FFF5F5',
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    destructiveText: {
        color: '#FF3B30',
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 15,
    },
});

export default SettingsScreen;
