// src/screens/Verification/VerificationFailedScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    Linking,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/authService';

interface VerificationFailedScreenProps {
    isVisible: boolean;
    onProfilePress?: () => void;
    onContactSupport?: () => void;
}

// Pure View-based illustration (no SVG dependency needed)
const VerificationIllustration = () => (
    <View style={illustrationStyles.wrapper}>
        {/* Main card */}
        <View style={illustrationStyles.card}>
            {/* Top row: avatar circle + text lines */}
            <View style={illustrationStyles.cardRow}>
                <View style={illustrationStyles.profileCircle}>
                    <View style={illustrationStyles.profileHead} />
                    <View style={illustrationStyles.profileBody} />
                </View>
                <View style={illustrationStyles.textLines}>
                    <View style={illustrationStyles.textLineLong} />
                    <View style={illustrationStyles.textLineShort} />
                </View>
            </View>

            {/* Bottom row: two small cards */}
            <View style={illustrationStyles.bottomRow}>
                <View style={illustrationStyles.smallCard}>
                    <View style={illustrationStyles.smallLine1} />
                    <View style={illustrationStyles.smallLine2} />
                </View>
                <View style={illustrationStyles.smallCard}>
                    <View style={illustrationStyles.smallLine1} />
                    <View style={illustrationStyles.smallLine2} />
                </View>
            </View>
        </View>

        {/* Exclamation badge */}
        <View style={illustrationStyles.badge}>
            <View style={illustrationStyles.badgeBackground}>
                <View style={illustrationStyles.badgeLayer} />
                <View style={[illustrationStyles.badgeLayer, illustrationStyles.badgeLayerRotated1]} />
                <View style={[illustrationStyles.badgeLayer, illustrationStyles.badgeLayerRotated2]} />
                <View style={[illustrationStyles.badgeLayer, illustrationStyles.badgeLayerRotated3]} />
            </View>
            <Text style={illustrationStyles.badgeText}>!</Text>
        </View>
    </View>
);

const illustrationStyles = StyleSheet.create({
    wrapper: {
        width: 180,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: 150,
        height: 105,
        backgroundColor: '#E8F4FD',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#B8DBFA',
        padding: 14,
        justifyContent: 'space-between',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#4A9FE5',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    profileHead: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4A9FE5',
        marginBottom: 1,
    },
    profileBody: {
        width: 18,
        height: 10,
        borderTopLeftRadius: 9,
        borderTopRightRadius: 9,
        backgroundColor: '#4A9FE5',
        opacity: 0.6,
    },
    textLines: {
        marginLeft: 12,
        flex: 1,
    },
    textLineLong: {
        width: '90%',
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4A9FE5',
        marginBottom: 6,
    },
    textLineShort: {
        width: '60%',
        height: 6,
        borderRadius: 3,
        backgroundColor: '#B8DBFA',
    },
    bottomRow: {
        flexDirection: 'row',
        gap: 10,
    },
    smallCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#B8DBFA',
        padding: 8,
    },
    smallLine1: {
        width: '80%',
        height: 4,
        borderRadius: 2,
        backgroundColor: '#B8DBFA',
        marginBottom: 5,
    },
    smallLine2: {
        width: '55%',
        height: 4,
        borderRadius: 2,
        backgroundColor: '#DCE9F5',
    },
    badge: {
        position: 'absolute',
        bottom: 8,
        right: 10,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeLayer: {
        position: 'absolute',
        width: 30,
        height: 30,
        backgroundColor: '#1A3A5C',
        borderRadius: 4,
    },
    badgeLayerRotated1: {
        transform: [{ rotate: '22.5deg' }],
    },
    badgeLayerRotated2: {
        transform: [{ rotate: '45deg' }],
    },
    badgeLayerRotated3: {
        transform: [{ rotate: '67.5deg' }],
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        zIndex: 1,
    },
});

import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const VerificationFailedScreen: React.FC = () => {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const [profile, setProfile] = useState<any>(user);
    
    // Get the rejection reason from the navigation params
    const rejectionReason = route.params?.reason || profile?.rejection_reason || "No specific reason provided.";

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userData = await authService.getUser();
                if (userData) {
                    setProfile(userData);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        };
        loadProfile();
    }, []);

    const avatarInitials = profile?.full_name
        ? profile.full_name
            .split(' ')
            .map((n: string) => n.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('')
        : 'U';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                        <Ionicons name="arrow-back" size={24} color="#1972ca" />
                    </TouchableOpacity>
                    <View style={styles.logoRow}>
                        <Text style={styles.logoText}>WakaJob</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Center Content */}
            <View style={styles.centerContent}>
                <View style={styles.illustrationContainer}>
                    <VerificationIllustration />
                </View>

                <Text style={styles.title}>Verification Rejected</Text>

                <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Reason for rejection:</Text>
                    <Text style={styles.reasonText}>"{rejectionReason}"</Text>
                </View>

                <TouchableOpacity
                    style={styles.resubmitButton}
                    onPress={() => navigation.navigate('EmployerVerification')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.resubmitButtonText}>Resubmit Verification</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    headerIconButton: {
        padding: 5,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1972ca',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginTop: -20,
    },
    illustrationContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 10,
    },
    reasonBox: {
        backgroundColor: '#FFF1F2',
        borderWidth: 1,
        borderColor: '#FECDD3',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        marginBottom: 20,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#E11D48',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    reasonText: {
        fontSize: 15,
        color: '#1F2937',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    resubmitButton: {
        backgroundColor: '#1972ca',
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    resubmitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    contactButton: {
        marginTop: 20,
        padding: 10,
    },
    contactButtonText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default VerificationFailedScreen;
