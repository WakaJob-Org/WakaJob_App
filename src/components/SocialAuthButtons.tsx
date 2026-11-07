import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import GoogleIcon from './GoogleIcon';

const SocialAuthButtons = () => {
    const showComingSoon = () => {
        Alert.alert('Coming soon', 'Google and Facebook sign-in are not available yet.');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Continue with Facebook"
                style={[styles.button, styles.facebookButton]}
                onPress={showComingSoon}
                activeOpacity={0.8}
            >
                <View style={styles.facebookIcon}>
                    <FontAwesome name="facebook-f" size={18} color="#2453CF" />
                </View>
                <Text numberOfLines={1} style={[styles.buttonText, styles.facebookText]}>
                    Continue with Facebook
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                style={[styles.button, styles.googleButton]}
                onPress={showComingSoon}
                activeOpacity={0.8}
            >
                <GoogleIcon size={22} />
                <Text numberOfLines={1} style={[styles.buttonText, styles.googleText]}>
                    Continue with Google
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    button: {
        flex: 1,
        minWidth: 0,
        height: 52,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 8,
    },
    facebookButton: {
        backgroundColor: '#2453CF',
    },
    facebookIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#2453CF',
    },
    buttonText: {
        flexShrink: 1,
        fontSize: 13,
        fontWeight: '600',
    },
    facebookText: {
        color: '#FFFFFF',
    },
    googleText: {
        color: '#2453CF',
    },
});

export default SocialAuthButtons;
