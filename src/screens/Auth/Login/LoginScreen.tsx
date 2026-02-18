import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import authService from '../../../services/authService';
import GoogleIcon from '../../../components/GoogleIcon';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LoginScreenProps {
    isVisible: boolean;
    onClose: () => void;
    onSwitchToSignup: () => void;
    onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ isVisible, onClose, onSwitchToSignup, onLogin }) => {
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isVisible) {
            // Smooth, non-bouncy entry - slowed down for visual clarity
            translateY.value = withTiming(0, {
                duration: 800,
            });
        } else {
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 600 });
        }
    }, [isVisible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            await authService.signin({ email, password });
            onLogin();
        } catch (error: any) {
            Alert.alert('Login Failed', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible && translateY.value === SCREEN_HEIGHT) return null;

    return (
        <>
            <Animated.View style={[styles.container, animatedStyle]}>
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="briefcase" size={32} color="#FFFFFF" />
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
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    keyboardType="email-address"
                                    placeholderTextColor="#999"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.forgotPassword}>
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

                        <Text style={styles.orText}>or continue with</Text>

                        <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
                            <View style={{ marginRight: 12 }}>
                                <GoogleIcon size={20} />
                            </View>
                            <Text style={styles.googleButtonText}>continue with Google</Text>
                        </TouchableOpacity>

                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={onSwitchToSignup}>
                                <Text style={styles.signupLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.9,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
        zIndex: 1000,
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
        paddingBottom: 40,
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
});

export default LoginScreen;
