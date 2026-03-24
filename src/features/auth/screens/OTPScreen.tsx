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
    Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useAuthStore } from '../../../store/useAuthStore';
import authService from '../services/authService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type OTPRouteProp = RouteProp<RootStackParamList, 'OTP'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OTP'>;

const OTPScreen: React.FC = () => {
    const route = useRoute<OTPRouteProp>();
    const navigation = useNavigation<NavigationProp>();
    const { email } = route.params;
    const { setToken, setUser } = useAuthStore();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(120);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            const digits = value.replace(/[^0-9]/g, '').split('').slice(0, 6);
            const newOtp = [...otp];
            digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
            setOtp(newOtp);
            inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 6) return Alert.alert('Error', 'Enter 6-digit code');

        setLoading(true);
        try {
            const response = await authService.verifyOTP(email, code);
            const token = response.token || response.data?.session?.access_token;
            
            if (token) {
                await setToken(token);
                // Fetch full user profile after verification
                const fullUser = await authService.getProfile();
                setUser(fullUser);
            }
        } catch (error: any) {
            Alert.alert('Verification Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
                <Text style={styles.title}>Verify Email</Text>
                <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

                <View style={styles.otpContainer}>
                    {otp.map((digit, i) => (
                        <TextInput
                            key={i}
                            ref={ref => (inputRefs.current[i] = ref)}
                            style={[styles.otpInput, digit && styles.otpInputFilled]}
                            value={digit}
                            onChangeText={text => handleOtpChange(text, i)}
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                        />
                    ))}
                </View>

                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyText}>Verify</Text>}
                </TouchableOpacity>

                {timer === 0 ? (
                    <TouchableOpacity onPress={() => { authService.resendOTP(email); setTimer(120); }}>
                        <Text style={styles.resendLink}>Resend Code</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.timer}>Resend in {Math.floor(timer / 60)}:{timer % 60 < 10 ? '0' : ''}{timer % 60}</Text>
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 60 },
    backBtn: { marginBottom: 40 },
    content: { flex: 1 },
    title: { fontSize: 32, fontWeight: '800', color: '#1a1a1a', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 40 },
    otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
    otpInput: { width: width * 0.12, height: 60, borderRadius: 12, backgroundColor: '#f5f7fa', borderWidth: 1.5, borderColor: '#e1e8f0', fontSize: 24, fontWeight: '700' },
    otpInputFilled: { borderColor: '#1972ca', backgroundColor: '#FFF' },
    verifyBtn: { backgroundColor: '#1972ca', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    verifyText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    timer: { textAlign: 'center', color: '#666' },
    resendLink: { textAlign: 'center', color: '#1972ca', fontWeight: '700' },
});

export default OTPScreen;
