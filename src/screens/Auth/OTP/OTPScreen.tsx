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
    ActivityIndicator,
    StatusBar,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    FadeInDown,
} from 'react-native-reanimated';
import authService from '../../../services/authService';
import otpService from '../../../services/otpServices';

const { width, height } = Dimensions.get('window');

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../context/AuthContext';

const OTPScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<AppStackParamList, 'OTP'>>();
    const { email } = route.params;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    ScreenCapture.usePreventScreenCapture();
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 500);
        return () => clearTimeout(timeout);
    }, []);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleResend = async () => {
        if (timer === 0) {
            setLoading(true);
            try {
                await otpService.resendOTP({ email });
                setTimer(120); // 2 minutes
                Alert.alert('Code Resent', `A new verification code has been sent to ${email}`);
            } catch (error: any) {
                Alert.alert('Resend Failed', error.message || 'Could not resend code. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };


    const handleOtpChange = (value: string, index: number) => {
        // Essential: Allow auto-fill codes which might come in as 6 digits at once
        if (value.length > 1) {
            const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
            const characters = cleanValue.split('');
            const newOtp = [...otp];

            characters.forEach((char, i) => {
                if (index + i < 6) newOtp[index + i] = char;
            });

            setOtp(newOtp);
            // Focus the box after the last character entered or stays at the last box
            const nextFocus = Math.min(index + characters.length, 5);
            inputRefs.current[nextFocus]?.focus();
            return;
        }

        // Only allow a single numeric digit
        if (value !== '' && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if a digit was entered
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Fix: Explicitly handle backspace to move focus back
        if (e.nativeEvent.key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                // Focus previous and clear it for a better feel
                inputRefs.current[index - 1]?.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
            } else {
                // Just clear current box
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const { verifyOTP } = useAuth();
    const handleVerifySubmit = async () => {
        const code = otp.join('');
        if (code.length < 6) {
            Alert.alert('Invalid OTP', 'Please enter the complete 6-digit verification code.');
            return;
        }

        setLoading(true);
        try {
            console.log('--- VERIFYING OTP ---', code);

            // Use the AUTH CONTEXT verifyOTP which updates isAuthenticated and User
            await verifyOTP({ email, otp: code });

            console.log('OTP Verified successfully and session persisted.');
            
            const redirectJob = route.params?.redirectJob;
            if (redirectJob) {
                navigation.navigate('JobDetails', { job: redirectJob, autoOpenApply: true });
            } else {
                navigation.navigate('MainTabs');
            }
        } catch (error: any) {
            // Check for common error messages
            const msg = error.message || error.toString();
            Alert.alert('Verification Failed', msg.includes('token') ? 'Verification required. Please check the code and try again.' : msg);
        } finally {
            setLoading(false);
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>

            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.content}
            >
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    <Text style={styles.title}>Verify Email</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to your email address:{"\n"}
                        <Text style={styles.emailHighlight}>{email}</Text>
                    </Text>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                style={[
                                    styles.otpInput,
                                    digit !== '' && styles.otpInputFilled
                                ]}
                                value={digit}
                                onChangeText={(text) => handleOtpChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={index === 0 ? 6 : 1} // First box accepts the whole string from OS, others stay restricted
                                selectionColor="#1972ca"
                                autoComplete="one-time-code"
                                textContentType="oneTimeCode"
                                selectTextOnFocus={true}
                                caretHidden={digit !== ''}
                            />
                        ))}
                    </View>

                    <View style={styles.resendContainer}>
                        {timer > 0 ? (
                            <Text style={styles.timerText}>
                                Resend code in <Text style={styles.timerValue}>{formatTime(timer)}</Text>
                            </Text>
                        ) : (
                            <TouchableOpacity onPress={handleResend}>
                                <Text style={styles.resendText}>
                                    Didn't receive code? <Text style={styles.resendLink}>Resend</Text>
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.verifyButton, otp.join('').length < 6 && styles.verifyButtonDisabled]}
                        onPress={handleVerifySubmit}
                        activeOpacity={0.8}
                        disabled={loading || otp.join('').length < 6}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.verifyButtonText}>Verify</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
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
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
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
    emailHighlight: {
        color: '#1972ca',
        fontWeight: '600',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    otpInput: {
        width: width * 0.12,
        height: width * 0.15,
        borderRadius: 12,
        backgroundColor: '#f5f7fa',
        borderWidth: 1.5,
        borderColor: '#e1e8f0',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1a1a1a',
    },
    otpInputFilled: {
        borderColor: '#1972ca',
        backgroundColor: '#FFFFFF',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 40,
        height: 30,
        justifyContent: 'center',
    },
    resendText: {
        fontSize: 15,
        color: '#666',
    },
    resendLink: {
        color: '#1972ca',
        fontWeight: '700',
    },
    timerText: {
        fontSize: 15,
        color: '#666',
    },
    timerValue: {
        color: '#1972ca',
        fontWeight: '700',
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
    verifyButtonDisabled: {
        backgroundColor: '#E5E7EB',
        shadowOpacity: 0,
        elevation: 0,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default OTPScreen;
