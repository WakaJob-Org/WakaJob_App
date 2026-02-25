import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    FadeInDown,
} from 'react-native-reanimated';
import authService from '../../../services/authService';

const { width, height } = Dimensions.get('window');

interface OTPScreenProps {
    isVisible: boolean;
    email: string;
    onClose: () => void;
    onVerify: () => void;
}

const OTPScreen: React.FC<OTPScreenProps> = ({ isVisible, email, onClose, onVerify }) => {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const translateY = useSharedValue(height);

    useEffect(() => {
        if (isVisible) {
            translateY.value = withTiming(0, { duration: 600 });
        } else {
            translateY.value = withTiming(height, { duration: 500 });
        }
    }, [isVisible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus logic can be added here with refs
    };

    const handleVerifySubmit = async () => {
        const code = otp.join('');
        if (code.length < 4) {
            Alert.alert('Invalid OTP', 'Please enter the complete 4-digit verification code.');
            return;
        }

        setLoading(true);
        try {
            await authService.verifyOtp({ email, otp: code });
            onVerify();
        } catch (error: any) {
            Alert.alert('Verification Failed', error || 'Invalid confirmation code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible && translateY.value === height) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    <Text style={styles.title}>Verify Phone</Text>
                    <Text style={styles.subtitle}>
                        Enter the 4-digit code sent to your phone number
                    </Text>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                style={styles.otpInput}
                                value={digit}
                                onChangeText={(text) => handleOtpChange(text, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectionColor="#1972ca"
                            />
                        ))}
                    </View>

                    <TouchableOpacity style={styles.resendContainer}>
                        <Text style={styles.resendText}>
                            Didn't receive code? <Text style={styles.resendLink}>Resend</Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={handleVerifySubmit}
                        activeOpacity={0.8}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.verifyButtonText}>Verify</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 100,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 40,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    otpInput: {
        width: width * 0.18,
        height: width * 0.18,
        borderRadius: 15,
        backgroundColor: '#f5f7fa',
        borderWidth: 1,
        borderColor: '#e1e8f0',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1a1a1a',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    resendText: {
        fontSize: 15,
        color: '#666',
    },
    resendLink: {
        color: '#1972ca',
        fontWeight: '600',
    },
    verifyButton: {
        backgroundColor: '#1972ca',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default OTPScreen;
