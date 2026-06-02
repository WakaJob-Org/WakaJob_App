import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../../services/authService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

import { useNavigation } from '@react-navigation/native';

const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState('');
    // Keep a stable ref so email is never lost when navigating between steps
    const emailRef = useRef<string>('');

    // Reset State
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef<Array<TextInput | null>>([]);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [errors, setErrors] = useState<any>({});


    const handleSendCode = async () => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setErrors({ email: 'Please enter a valid email address' });
            return;
        }
        setErrors({});
        setLoading(true);

        try {
            await authService.forgotPassword({ email: cleanEmail });
            emailRef.current = cleanEmail; // persist reliably in ref
            setEmail(cleanEmail);
            Alert.alert('Code Sent! 📧', `A 6-digit reset code has been sent to ${cleanEmail}. Check your inbox (and spam folder).`);
            setStep('verify');
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Alert.alert('Request Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        const otpString = otp.join('');
        if (!otpString || otpString.length < 6) {
            setErrors({ otp: 'Please enter a valid 6-digit OTP' });
            return;
        }
        
        // We skip the intermediate /auth/verify-otp call because most backends
        // verify the reset code during the final /auth/reset-password step.
        // This avoids "Token Expired" errors caused by using the wrong verification endpoint.
        setStep('reset');
    };

    const handleResetPassword = async () => {
        const newErrors: any = {};
        if (!newPassword || newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        } else if (!/\d/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain at least one number';
        }
        if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        const otpString = otp.join('');
        // Use the ref as primary source — guaranteed to be the email from step 1
        const resolvedEmail = emailRef.current || email;

        if (!resolvedEmail) {
            Alert.alert('Session Expired', 'We lost track of your email. Please start the reset process again.');
            setStep('request');
            setLoading(false);
            return;
        }

        try {
            await authService.resetPassword({
                email: resolvedEmail,
                otp: otpString,
                token: otpString,           // send both in case backend expects either key
                new_password: newPassword,
                confirm_password: confirmPassword,
            });
            Alert.alert(
                'Password Updated! 🎉',
                'Your password has been successfully reset. You can now log in with your new password.',
                [{ text: 'Log In Now', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            const rawMsg = error instanceof Error ? error.message : String(error);
            // Translate common backend error messages to friendly text
            let friendlyMsg = rawMsg;
            if (rawMsg.toLowerCase().includes('invalid') || rawMsg.toLowerCase().includes('expired')) {
                friendlyMsg = 'Your reset code is invalid or has expired. Please request a new one.';
            } else if (rawMsg.toLowerCase().includes('password')) {
                friendlyMsg = rawMsg; // already a password-related message, keep it
            } else if (rawMsg.toLowerCase().includes('not found') || rawMsg.toLowerCase().includes('no user')) {
                friendlyMsg = 'We could not find an account with that email address.';
            }
            Alert.alert('Reset Failed', friendlyMsg, [
                rawMsg.toLowerCase().includes('expired') || rawMsg.toLowerCase().includes('invalid')
                    ? { text: 'Request New Code', onPress: () => { setStep('request'); setOtp(['','','','','','']); } }
                    : { text: 'Try Again' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (value: string, index: number) => {
        // Handle auto-fill codes which might come in as 6 digits at once
        if (value.length > 1) {
            const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
            const characters = cleanValue.split('');
            const newOtp = [...otp];

            characters.forEach((char, i) => {
                if (index + i < 6) newOtp[index + i] = char;
            });

            setOtp(newOtp);
            const nextFocus = Math.min(index + characters.length, 5);
            otpRefs.current[nextFocus]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
        
        if (errors.otp) setErrors({ ...errors, otp: '' });
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const renderHeaderTitle = () => {
        switch(step) {
            case 'request': return 'Forgot Password';
            case 'verify': return 'Verify Code';
            case 'reset': return 'Create New Password';
            default: return 'Forgot Password';
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.handleContainer}>
                <View style={styles.handle} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.headerTitleRow}>
                    <TouchableOpacity 
                        onPress={() => step === 'request' ? navigation.goBack() : setStep(step === 'verify' ? 'request' : 'verify')} 
                        style={styles.backButton}
                    >
                        <Ionicons name={step === 'request' ? "close" : "arrow-back"} size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.topTitle}>{renderHeaderTitle()}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {step === 'request' && (
                        <View style={styles.form}>
                            <Text style={styles.description}>
                                Enter the email address associated with your account and we'll send you a code to reset your password.
                            </Text>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                    <Ionicons name="mail-outline" size={20} color={errors.email ? "#FF3B30" : "#666"} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        keyboardType="email-address"
                                        placeholderTextColor="#999"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (errors.email) setErrors({ ...errors, email: '' });
                                        }}
                                    />
                                </View>
                                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                            </View>

                            <TouchableOpacity
                                style={styles.actionButton}
                                activeOpacity={0.8}
                                onPress={handleSendCode}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionButtonText}>Send Reset Code</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 'verify' && (
                        <View style={styles.form}>
                            <Text style={styles.description}>
                                Enter the 6-digit code sent to {email}.
                            </Text>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Reset Code (OTP)</Text>
                                <View style={styles.otpContainer}>
                                    {otp.map((digit, index) => (
                                        <TextInput
                                            key={index}
                                            ref={(el) => (otpRefs.current[index] = el)}
                                            style={[
                                                styles.otpInput,
                                                errors.otp && styles.otpInputError,
                                                digit !== '' && styles.otpInputFilled
                                            ]}
                                            value={digit}
                                            onChangeText={(text) => handleOtpChange(text, index)}
                                            onKeyPress={(e) => handleKeyPress(e, index)}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            placeholder="0"
                                            placeholderTextColor="#CCC"
                                        />
                                    ))}
                                </View>
                                {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
                            </View>

                            <TouchableOpacity
                                style={styles.actionButton}
                                activeOpacity={0.8}
                                onPress={handleVerifyCode}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionButtonText}>Verify Code</Text>}
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={{marginTop: 15, alignItems: 'center'}}
                                onPress={handleSendCode}
                                disabled={loading}
                            >
                                <Text style={{color: '#666', fontSize: 14}}>Didn't receive a code? <Text style={{color: '#007AFF', fontWeight: 'bold'}}>Resend</Text></Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 'reset' && (
                        <View style={styles.form}>
                            <Text style={styles.description}>
                                Choose a strong new password for your account.
                            </Text>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>New Password</Text>
                                <View style={[styles.inputContainer, errors.newPassword && styles.inputError]}>
                                    <Ionicons name="lock-closed-outline" size={20} color={errors.newPassword ? "#FF3B30" : "#666"} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Min 8 chars, include a number"
                                        secureTextEntry={!showPassword}
                                        placeholderTextColor="#999"
                                        value={newPassword}
                                        onChangeText={(text) => {
                                            setNewPassword(text);
                                            if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                                        }}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Confirm New Password</Text>
                                <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                                    <Ionicons name="lock-closed-outline" size={20} color={errors.confirmPassword ? "#FF3B30" : "#666"} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm new password"
                                        secureTextEntry={!showPassword}
                                        placeholderTextColor="#999"
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                        }}
                                    />
                                </View>
                                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
                            </View>

                            <TouchableOpacity
                                style={styles.actionButton}
                                activeOpacity={0.8}
                                onPress={handleResetPassword}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionButtonText}>Update Password</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    topTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    form: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: '#FAFAFA',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    inputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF9F9',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: '500',
    },
    actionButton: {
        backgroundColor: '#1972ca',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 10,
    },
    otpInput: {
        width: (Dimensions.get('window').width - 80) / 6,
        height: 56,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#FAFAFA',
        color: '#333',
    },
    otpInputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF9F9',
    },
    otpInputFilled: {
        borderColor: '#1972ca',
        backgroundColor: '#FFFFFF',
    },
});

export default ForgotPasswordScreen;
