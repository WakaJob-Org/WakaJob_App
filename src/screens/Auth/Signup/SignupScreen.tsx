import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, View, Text, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import GoogleIcon from '../../../components/GoogleIcon';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../context/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

interface SignupScreenProps {
    navigation: SignupScreenNavigationProp;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
    const { signup } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    ScreenCapture.usePreventScreenCapture();

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Error state
    const [errors, setErrors] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const validatePassword = (pass: string) => {
        const minLength = 6;
        if (pass.length < minLength) return `Password must be at least ${minLength} characters`;
        return '';
    };

    const handleSignup = async () => {
        const newErrors = {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
        };

        const cleanFullName = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanFullName) newErrors.fullName = 'Full name is required';
        else if (cleanFullName.length < 3) newErrors.fullName = 'Full name must be at least 3 characters';

        if (!cleanEmail) newErrors.email = 'Email address is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) newErrors.email = 'Please enter a valid email address';

        if (!password) {
            newErrors.password = 'Password is required';
        } else {
            const passError = validatePassword(password);
            if (passError) newErrors.password = passError;
        }

        if (!confirmPassword) newErrors.confirmPassword = 'Confirmation password is required';
        else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        setErrors({ ...errors, ...newErrors } as any);

        if (Object.values(newErrors).some(err => err !== '')) return;

        setLoading(true);
        try {
            console.log('--- SIGNUP INITIATED for:', cleanEmail);
            
            const result = await signup({
                full_name: cleanFullName,
                email: cleanEmail,
                password: password,
                confirm_password: confirmPassword,
                role: 'worker',
            });

            console.log('--- SIGNUP SUCCESSFUL, navigating to OTP... ---');
            
            // Critical: Ensure we navigate to the OTP screen with the clean email
            // Use navigate instead of push to avoid stacking issues in modals
            navigation.navigate('OTP', { 
                email: cleanEmail,
                isNewUser: true 
            });

        } catch (error: any) {
            console.error('Signup screen error catch:', error.message);
            const errorMessage = error?.message || 'Signup failed. Please check your details.';

            if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('exist') || errorMessage.toLowerCase().includes('taken') || error?.status === 409) {
                setErrors({ ...newErrors, email: 'This email is already registered. Please log in instead.' } as any);
            } else if (errorMessage.toLowerCase().includes('email')) {
                setErrors({ ...newErrors, email: errorMessage } as any);
            } else if (errorMessage.toLowerCase().includes('password')) {
                setErrors({ ...newErrors, password: errorMessage } as any);
            } else {
                Alert.alert('Signup Failed', errorMessage);
            }
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
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="briefcase" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.title}>Wakajob</Text>
                        <Text style={styles.subtitle}>Create an Account</Text>
                        <Text style={styles.description}>Join thousands of professionals finding their dream jobs</Text>
                    </View>

                    <View style={styles.form}>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#999"
                                    value={fullName}
                                    onChangeText={(text) => {
                                        setFullName(text);
                                        if (errors.fullName) setErrors({ ...errors, fullName: '' });
                                    }}
                                />
                            </View>
                            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
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

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Password</Text>
                            <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                                <Ionicons name="lock-closed-outline" size={20} color={errors.password ? "#FF3B30" : "#666"} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create a strong password"
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) setErrors({ ...errors, password: '' });
                                    }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null]}>
                                <Ionicons name="lock-closed-outline" size={20} color={errors.confirmPassword ? "#FF3B30" : "#666"} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm your password"
                                    secureTextEntry={!showConfirmPassword}
                                    placeholderTextColor="#999"
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                    }}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
                        </View>

                        <TouchableOpacity
                            style={styles.signupButton}
                            activeOpacity={0.8}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.signupButtonText}>Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100, // Extra padding to ensure everything is scrollable above keyboard
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1972ca',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1972ca',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
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
    signupButton: {
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
    signupButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    orText: {
        textAlign: 'center',
        color: '#999',
        marginVertical: 16,
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    googleButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginText: {
        color: '#666',
        fontSize: 14,
    },
    loginLink: {
        color: '#1972ca',
        fontSize: 14,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: '500',
    },
    inputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF9F9',
    },
    roleSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    roleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FAFAFA',
        gap: 8,
    },
    roleButtonActive: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    roleButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    roleButtonTextActive: {
        color: '#FFFFFF',
    },
});

export default SignupScreen;
