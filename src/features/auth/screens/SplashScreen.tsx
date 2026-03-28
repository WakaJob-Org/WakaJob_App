import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, Dimensions, StatusBar, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSpring,
    Easing
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    
    // Animation values
    const logoOpacity = useSharedValue(0);
    const logoTranslateY = useSharedValue(20);
    const welcomeOpacity = useSharedValue(0);
    const buttonOpacity = useSharedValue(0);
    const buttonScale = useSharedValue(0.9);

    useEffect(() => {
        logoOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
        logoTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });
        welcomeOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
        buttonOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
        buttonScale.value = withDelay(800, withSpring(1));
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ translateY: logoTranslateY.value }],
    }));

    const welcomeStyle = useAnimatedStyle(() => ({
        opacity: welcomeOpacity.value,
    }));

    const buttonStyle = useAnimatedStyle(() => ({
        opacity: buttonOpacity.value,
        transform: [{ scale: buttonScale.value }],
    }));

    return (
        <LinearGradient colors={['#1972ca', '#0d4f8e']} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Animated.View style={[styles.content, logoStyle]}>
                <Text style={styles.logoText}>wakajob</Text>
                <Animated.Text style={[styles.welcomeText, welcomeStyle]}>welcome</Animated.Text>
            </Animated.View>

            <Animated.View style={[styles.footer, buttonStyle]}>
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.buttonText}>Get started</Text>
                </TouchableOpacity>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'space-between' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: 68, fontFamily: 'Pacifico-Regular', color: '#FFFFFF' },
    welcomeText: { fontSize: 28, color: 'rgba(255, 255, 255, 0.8)', marginTop: -10, fontStyle: 'italic', fontWeight: '300' },
    footer: { paddingHorizontal: 30, paddingBottom: 60 },
    button: { backgroundColor: '#FFFFFF', width: '55%', height: 48, alignSelf: 'center', borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    buttonText: { fontSize: 18, color: '#1972ca', fontWeight: '600', letterSpacing: 0.5 },
});

export default SplashScreen;
