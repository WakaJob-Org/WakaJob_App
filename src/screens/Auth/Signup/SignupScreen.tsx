import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import GoogleIcon from '../../../components/GoogleIcon';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../../services/authService';
import { Alert, ActivityIndicator } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SignupScreenProps {
    isVisible: boolean;
    onClose: () => void;
    onSwitchToSignin: () => void;
    onSignup: () => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ isVisible, onClose, onSwitchToSignin, onSignup }) => {
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (isVisible) {
            // Use withTiming for a smooth, non-bouncy entry
            // Slower duration for a more cinematic feel as requested
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

    const handleSignup = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await authService.signup({
                full_name: fullName,
                email,
                password,
                confirmPassword,
                role: 'worker',
            });
            onSignup();
        } catch (error: any) {
            Alert.alert('Signup Failed', error);
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
                                    onChangeText={setFullName}
                                />
                            </View>
                        </View>

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
                                    placeholder="Create a strong password"
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm your password"
                                    secureTextEntry={!showConfirmPassword}
                                    placeholderTextColor="#999"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
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

                        <Text style={styles.orText}>or</Text>

                        <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
                            <View style={{ marginRight: 12 }}>
                                <GoogleIcon size={20} />
                            </View>
                            <Text style={styles.googleButtonText}>SignUp with Google</Text>
                        </TouchableOpacity>

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={onSwitchToSignin}>
                                <Text style={styles.loginLink}>Sign In</Text>
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
});

export default SignupScreen;
