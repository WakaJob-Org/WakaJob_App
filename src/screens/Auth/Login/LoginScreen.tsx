import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../context/AuthContext';

import { useRoute } from '@react-navigation/native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Maps raw backend/network error text to a friendly, plain-language message.
// The backend intentionally returns one generic message for bad email/password
// (so it doesn't reveal which one was wrong), which is exactly what we show here.
const getFriendlyLoginError = (rawMessage?: string): string => {
    const msg = (rawMessage || '').toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        return "The email or password you entered is incorrect. Please try again.";
    }
    if (msg.includes('network')) {
        return "No internet connection. Please check your connection and try again.";
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
        return "This is taking longer than expected. Please try again.";
    }
    if (msg.includes('server error')) {
        return "Something went wrong on our end. Please try again in a moment.";
    }
    return rawMessage || "Something went wrong. Please try again.";
};

type LoginScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Login'>;

interface LoginScreenProps {
    navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const route = useRoute<any>();
    const { login } = useAuth();
    const redirectJob = route.params?.redirectJob;

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Error state
    const [errors, setErrors] = useState({
        email: '',
        password: '',
    });
    const [formError, setFormError] = useState('');

    const handleLogin = async () => {
        // Reset and check errors
        const newErrors = {
            email: '',
            password: '',
        };

        if (!email) {
            newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);

        // Check if any error exists
        if (Object.values(newErrors).some(err => err !== '')) {
            return;
        }

        setFormError('');
        setLoading(true);
        try {
            await login({ email, password });
            // Reset (not navigate) so the whole auth stack (Login/Signup/OTP/etc.) is
            // wiped - leaves exactly one screen post-login, nothing left to swipe back into.
            if (redirectJob) {
                navigation.reset({
                    index: 1,
                    routes: [
                        { name: 'MainTabs' },
                        { name: 'JobDetails', params: { job: redirectJob, autoOpenApply: true } },
                    ],
                });
            } else {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            }
        } catch (error: any) {
            console.error('Login error detail:', error);
            setFormError(getFriendlyLoginError(error?.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.modalWrapper}>
            {/* Tapping the dimmed area above the sheet dismisses it, same as swiping down */}
            <Pressable style={styles.backdropSpacer} onPress={() => navigation.goBack()} />

            <View style={styles.container}>
            <View style={styles.handleContainer}>
                <View style={styles.handle} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <View style={styles.brandIconCrop}>
                                <Image
                                    source={require('../../../../assets/logo.png')}
                                    style={styles.brandIconCropImage}
                                />
                            </View>
                        </View>
                        <Text style={styles.title}>Wakajob</Text>
                        <Text style={styles.welcomeText}>Welcome back to your career journey</Text>

                        <View style={styles.titleSection}>
                            <Text style={styles.loginTitle}>Log In to your account</Text>
                            <Text style={styles.loginSubtitle}>Enter your credentials to access your account</Text>
                        </View>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.inputContainer, (errors.email || formError) ? styles.inputError : null]}>
                                <Ionicons name="mail-outline" size={20} color={(errors.email || formError) ? "#FF3B30" : "#666"} style={styles.inputIcon} />
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
                                        if (formError) setFormError('');
                                    }}
                                />
                            </View>
                            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Password</Text>
                            <View style={[styles.inputContainer, (errors.password || formError) ? styles.inputError : null]}>
                                <Ionicons name="lock-closed-outline" size={20} color={(errors.password || formError) ? "#FF3B30" : "#666"} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) setErrors({ ...errors, password: '' });
                                        if (formError) setFormError('');
                                    }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
                             <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.replace('ForgotPassword', { email, redirectJob })}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.signInButton}
                            activeOpacity={0.8}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.signInButtonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.replace('Signup', { redirectJob })}>
                                <Text style={styles.signupLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalWrapper: {
        flex: 1,
    },
    // The modal card now fills the full screen (see AppStack.tsx) - this
    // transparent spacer stands in for the old marginTop, and is tappable so
    // tapping the dimmed area above the sheet dismisses it like swiping down.
    backdropSpacer: {
        height: SCREEN_HEIGHT * 0.2,
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
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
        paddingBottom: 80, // Increased for keyboard clearance
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
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
    // logo.png is a 1254x1254 lockup (icon + wordmark stacked); crop to just
    // the icon (roughly x[280,862] y[274,793]) - it's natively white, which
    // reads correctly against this circle's blue background with no tint.
    brandIconCrop: {
        width: 36,
        height: 32,
        overflow: 'hidden',
    },
    brandIconCropImage: {
        width: 77,
        height: 77,
        left: -17,
        top: -17,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    welcomeText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    titleSection: {
        alignItems: 'center',
    },
    loginTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1972ca',
        marginBottom: 4,
    },
    loginSubtitle: {
        fontSize: 12,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    forgotPasswordText: {
        color: '#1972ca',
        fontSize: 12,
        fontWeight: '600',
    },
    signInButton: {
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
    signInButtonText: {
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
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    signupText: {
        color: '#666',
        fontSize: 14,
    },
    signupLink: {
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
});

export default LoginScreen;
