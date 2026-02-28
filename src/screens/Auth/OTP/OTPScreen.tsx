import React, { useState, useEffect, useRef } from 'react';
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
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const translateY = useSharedValue(height);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown]);

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

    const inputRefs = useRef<Array<TextInput | null>>([]);

    const handleOtpChange = (value: string, index: number) => {
        // Handle full string paste or autofill mapping
        if (value.length > 1) {
            const pastedDigits = value.replace(/[^0-9]/g, '').slice(0, 6).split('');
            if (pastedDigits.length === 0) return;

            const newOtp = [...otp];
            pastedDigits.forEach((char, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);

            const nextIndex = Math.min(index + pastedDigits.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto move focus logic
        if (value !== '') {
            // Moved forward if value is entered
            if (index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        } else {
            // Moved backward if value is cleared (e.g. deleting the current number)
            if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // If backspace is pressed and current field is literally empty, move to previous box
        if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || resendLoading) return;

        setResendLoading(true);
        try {
            await authService.resendOtp({ email });
            setCountdown(120); // start 2-minute countdown
        } catch (error: any) {
            Alert.alert('Resend Failed', error || 'Failed to resend confirmation code. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    const handleVerifySubmit = async () => {
        const code = otp.join('');
        if (code.length < 6) {
            Alert.alert('Invalid OTP', 'Please enter the complete 6-digit verification code.');
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
                        Enter the 6-digit code sent to your email address
                    </Text>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                style={styles.otpInput}
                                value={digit}
                                onChangeText={(text) => handleOtpChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                textContentType="oneTimeCode"
                                maxLength={6}
                                selectionColor="#1972ca"
                            />
                        ))}
                    </View>

                    <View style={styles.resendContainer}>
                        {resendLoading ? (
                            <ActivityIndicator size="small" color="#1972ca" />
                        ) : (
                            <Text style={styles.resendText}>
                                Didn't receive code?{' '}
                                <Text
                                    style={[styles.resendLink, countdown > 0 && styles.resendLinkDisabled]}
                                    onPress={countdown === 0 ? handleResend : undefined}
                                >
                                    {countdown > 0 ? `Resend in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` : 'Resend'}
                                </Text>
                            </Text>
                        )}
                    </View>

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
        width: width * 0.13,
        height: width * 0.13,
        borderRadius: 12,
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
    resendLinkDisabled: {
        color: '#999999',
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
