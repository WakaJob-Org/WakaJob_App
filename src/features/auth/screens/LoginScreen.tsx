import React, { useState } from 'react';
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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import authService from '../services/authService';
import { useAuthStore } from '../../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { setToken, setUser } = useAuthStore();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '' });

    ScreenCapture.usePreventScreenCapture();

    const handleLogin = async () => {
        const newErrors = { email: '', password: '' };
        if (!email) newErrors.email = 'Email address is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
        if (!password) newErrors.password = 'Password is required';

        setErrors(newErrors);
        if (newErrors.email || newErrors.password) return;

        setLoading(true);
        try {
            const response = await authService.signin({ email: email.trim(), password });
            
            const token = response.token || response.data?.session?.access_token;
            const userData = response.data?.user;

            if (token && userData) {
                await setToken(token);
                setUser(userData);
                // Navigation happens automatically in AppNavigator based on store state
            } else {
                throw new Error('Invalid server response: missing token or user data');
            }
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="briefcase" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.title}>Wakajob</Text>
                        <Text style={styles.welcomeText}>Welcome back to your career journey</Text>
                        <Text style={styles.loginTitle}>Log In to your account</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                                <Ionicons name="mail-outline" size={20} color={errors.email ? "#FF3B30" : "#666"} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Password</Text>
                            <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                                <Ionicons name="lock-closed-outline" size={20} color={errors.password ? "#FF3B30" : "#666"} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                        </View>

                        <TouchableOpacity style={styles.signInButton} onPress={handleLogin} disabled={loading}>
                            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.signInButtonText}>Sign In</Text>}
                        </TouchableOpacity>

                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.signupLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 32 },
    iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1972ca', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
    welcomeText: { fontSize: 14, color: '#666', marginTop: 8 },
    loginTitle: { fontSize: 20, fontWeight: '700', color: '#1972ca', marginTop: 24 },
    form: { width: '100%' },
    inputWrapper: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, height: 56, backgroundColor: '#FAFAFA' },
    input: { flex: 1, fontSize: 16, color: '#333', marginLeft: 12 },
    signInButton: { backgroundColor: '#1972ca', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    signInButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    signupText: { color: '#666', fontSize: 14 },
    signupLink: { color: '#1972ca', fontSize: 14, fontWeight: 'bold' },
    errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4 },
    inputError: { borderColor: '#FF3B30' },
});

export default LoginScreen;
