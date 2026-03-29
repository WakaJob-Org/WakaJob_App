import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import authService from '../services/authService';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

const SignupScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    
    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'worker' | 'employer'>('worker');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Error state
    const [errors, setErrors] = useState<Record<string, string>>({});

    ScreenCapture.usePreventScreenCapture();

    const handleSignup = async () => {
        const newErrors: Record<string, string> = {};
        if (!fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Valid email is required';
        if (password.length < 6) newErrors.password = 'Min 6 characters required';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setLoading(true);
        try {
            await authService.signup({
                full_name: fullName.trim(),
                email: email.trim().toLowerCase(),
                password,
                confirm_password: confirmPassword,
                role,
            });
            // Success: navigate to OTP
            navigation.navigate('OTP', { email: email.trim().toLowerCase() });
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="briefcase" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.title}>WakaJob</Text>
                        <Text style={styles.subtitle}>Create an Account</Text>
                    </View>

                    <View style={styles.form}>
                        {/* Role Selector */}
                        <Text style={styles.label}>Register as</Text>
                        <View style={styles.roleSelector}>
                            <TouchableOpacity style={[styles.roleButton, role === 'worker' && styles.roleButtonActive]} onPress={() => setRole('worker')}>
                                <Ionicons name="person" size={20} color={role === 'worker' ? "#FFFFFF" : "#666"} />
                                <Text style={[styles.roleButtonText, role === 'worker' && styles.roleButtonTextActive]}>Worker</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.roleButton, role === 'employer' && styles.roleButtonActive]} onPress={() => setRole('employer')}>
                                <Ionicons name="business" size={20} color={role === 'employer' ? "#FFFFFF" : "#666"} />
                                <Text style={[styles.roleButtonText, role === 'employer' && styles.roleButtonTextActive]}>Employer</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Name Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={[styles.inputContainer, errors.fullName ? styles.inputError : null]}>
                                <Ionicons name="person-outline" size={20} color="#666" />
                                <TextInput style={styles.input} placeholder="Enter full name" value={fullName} onChangeText={setFullName} />
                            </View>
                            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                                <Ionicons name="mail-outline" size={20} color="#666" />
                                <TextInput style={styles.input} placeholder="Enter email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                            </View>
                            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Password</Text>
                            <div style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                                <TextInput style={styles.input} placeholder="Min 6 characters" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                </TouchableOpacity>
                            </div>
                            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                        </View>

                        <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
                            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.signupButtonText}>Sign Up</Text>}
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
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 60 },
    header: { alignItems: 'center', marginBottom: 32 },
    iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1972ca', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
    subtitle: { fontSize: 18, color: '#1972ca', marginTop: 8, fontWeight: '600' },
    form: { width: '100%' },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    roleSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    roleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA', gap: 8 },
    roleButtonActive: { backgroundColor: '#1972ca', borderColor: '#1972ca' },
    roleButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
    roleButtonTextActive: { color: '#FFFFFF' },
    inputWrapper: { marginBottom: 20 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, height: 56, backgroundColor: '#FAFAFA' },
    input: { flex: 1, fontSize: 16, color: '#333', marginLeft: 12 },
    signupButton: { backgroundColor: '#1972ca', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    signupButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    loginText: { color: '#666', fontSize: 14 },
    loginLink: { color: '#1972ca', fontSize: 14, fontWeight: 'bold' },
    errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4 },
    inputError: { borderColor: '#FF3B30' },
});

export default SignupScreen;
