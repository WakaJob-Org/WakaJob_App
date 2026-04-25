// src/screens/Verification/VerificationSuccessScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import authService from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

// Illustration: card with verified checkmark badge
const SuccessIllustration = () => (
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

        {/* Verified checkmark badge */}
        <View style={illustrationStyles.badgeOuter}>
            <View style={illustrationStyles.badge}>
                <View style={illustrationStyles.badgeBackground}>
                    <View style={illustrationStyles.badgeLayer} />
                    <View style={[illustrationStyles.badgeLayer, illustrationStyles.badgeLayerRotated1]} />
                    <View style={[illustrationStyles.badgeLayer, illustrationStyles.badgeLayerRotated2]} />
                    <View style={[illustrationStyles.badgeLayer, illustrationStyles.badgeLayerRotated3]} />
                </View>
                <Text style={illustrationStyles.checkmark}>✓</Text>
            </View>
            <View style={illustrationStyles.notchLeft} />
            <View style={illustrationStyles.notchRight} />
            <View style={illustrationStyles.notchBottom} />
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
    badgeOuter: {
        position: 'absolute',
        bottom: 4,
        right: 8,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
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
        backgroundColor: '#1972ca',
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
    checkmark: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: -1,
        zIndex: 1,
    },
});

const VerificationSuccessScreen: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState<any>(user);

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

    const handleStartNow = async () => {
        await refreshUser();
        // Since RootNavigator switches stacks automatically based on user.is_verified,
        // refreshing user will trigger the transition to AppStack.
    };

    const avatarInitials = profile?.full_name
        ? profile.full_name
            .split(' ')
            .map((n: string) => n.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('')
        : 'FW';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerContent}>
                    <View style={styles.logoRow}>
                        <Text style={styles.logoText}>WakaJob</Text>
                    </View>

                    <TouchableOpacity style={styles.avatar}>
                        {profile?.profile_photo ? (
                            <Image source={{ uri: profile.profile_photo }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarInner}>
                                <Text style={styles.avatarChar}>{avatarInitials}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Center Content */}
            <View style={styles.centerContent}>
                {/* Illustration */}
                <View style={styles.illustrationContainer}>
                    <SuccessIllustration />
                </View>

                {/* Title */}
                <Text style={styles.title}>Verification Successful</Text>

                {/* Description */}
                <Text style={styles.description}>
                    Your profile has been successfully verified{'\n'}
                    You now have access to all content
                </Text>

                {/* Start Now & Post Job Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={handleStartNow}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.startButtonText}>Go to Dashboard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.postJobButton}
                        onPress={async () => {
                            await refreshUser();
                            navigation.navigate('CreateJob');
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.postJobButtonText}>Post a Job Now</Text>
                    </TouchableOpacity>
                </View>
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
    logoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1972ca',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarInner: {
        width: '100%',
        height: '100%',
        backgroundColor: '#A8B8C8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarChar: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -40,
    },
    illustrationContainer: {
        marginBottom: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    startButton: {
        backgroundColor: '#2E86DE',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 12,
        minWidth: 200,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
        alignItems: 'center',
    },
    postJobButton: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 12,
        minWidth: 200,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#1972ca',
    },
    postJobButtonText: {
        color: '#1972ca',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default VerificationSuccessScreen;
