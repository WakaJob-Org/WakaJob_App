import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSpring,
    Easing
} from 'react-native-reanimated';

import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');

type SplashScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Splash'>;

const SplashScreen = ({
    navigation
}: {
    navigation: SplashScreenNavigationProp;
}) => {
    // Animation values
    const logoOpacity = useSharedValue(0);
    const logoTranslateY = useSharedValue(20);
    const welcomeOpacity = useSharedValue(0);
    const buttonOpacity = useSharedValue(0);
    const buttonScale = useSharedValue(0.9);

    useEffect(() => {
        // Sequence animations
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
        <LinearGradient
            colors={['#1972ca', '#0d4f8e']}
            style={styles.container}
        >

            <Animated.View style={[styles.content, logoStyle]}>
                <Text style={styles.logoText}>wakajob</Text>
                <Animated.Text style={[styles.welcomeText, welcomeStyle]}>
                    welcome
                </Animated.Text>
            </Animated.View>

            {true && (
                <Animated.View style={[styles.footer, buttonStyle]}>
                    <TouchableOpacity
                        style={styles.button}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Signup')}
                    >
                        <Text style={styles.buttonText}>Get started</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 68,
        fontFamily: 'Pacifico-Regular',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    welcomeText: {
        fontSize: 28,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: -10,
        fontFamily: 'System', // Using system font with specific weight/style
        fontStyle: 'italic',
        fontWeight: '300',
    },
    footer: {
        paddingHorizontal: 30,
        paddingBottom: 60,
    },
    button: {
        backgroundColor: '#FFFFFF',
        width: '55%',
        height: 48,
        alignSelf: 'center',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    buttonText: {
        fontSize: 18,
        color: '#1972ca',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

export default SplashScreen;
