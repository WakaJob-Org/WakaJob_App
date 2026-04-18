import React, { useState, useEffect } from 'react';
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
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const [loading, setLoading] = useState(false);

    // Request State
    const [email, setEmail] = useState('');

    // Reset State
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [errors, setErrors] = useState<any>({});


    const handleSendCode = async () => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrors({ email: 'Please enter a valid email address' });
            return;
        }
        setErrors({});
        setLoading(true);

        try {
            await authService.forgotPassword({ email });
            Alert.alert('Success', 'A reset code has been sent to your email.');
            setStep('reset');
        } catch (error: any) {
            Alert.alert('Error', error || 'Failed to send reset code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const newErrors: any = {};
        if (!otp || otp.length < 4) newErrors.otp = 'Please enter a valid OTP';
        if (!newPassword || newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
        if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            await authService.resetPassword({ email, otp, new_password: newPassword });
            Alert.alert('Success', 'Your password has been successfully reset. You can now login.');
            navigation.navigate('Login');
        } catch (error: any) {
            Alert.alert('Reset Failed', error || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.topTitle}>{step === 'request' ? 'Forgot Password' : 'Reset Password'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {step === 'request' ? (
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
                    ) : (
                        <View style={styles.form}>
                            <Text style={styles.description}>
                                Enter the code sent to {email} along with your new password.
                            </Text>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Reset Code (OTP)</Text>
                                <View style={[styles.inputContainer, errors.otp && styles.inputError]}>
                                    <Ionicons name="keypad-outline" size={20} color={errors.otp ? "#FF3B30" : "#666"} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter 6-digit code"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        placeholderTextColor="#999"
                                        value={otp}
                                        onChangeText={(text) => {
                                            setOtp(text);
                                            if (errors.otp) setErrors({ ...errors, otp: '' });
                                        }}
                                    />
                                </View>
                                {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>New Password</Text>
                                <View style={[styles.inputContainer, errors.newPassword && styles.inputError]}>
                                    <Ionicons name="lock-closed-outline" size={20} color={errors.newPassword ? "#FF3B30" : "#666"} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter new password"
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
                                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionButtonText}>Reset Password</Text>}
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
});

export default ForgotPasswordScreen;
