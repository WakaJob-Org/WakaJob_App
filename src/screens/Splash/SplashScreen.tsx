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

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onGetStarted }: { onGetStarted: () => void }) => {
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
            <StatusBar barStyle="light-content" />

            <Animated.View style={[styles.content, logoStyle]}>
                <Text style={styles.logoText}>wakajob</Text>
                <Animated.Text style={[styles.welcomeText, welcomeStyle]}>
                    welcome
                </Animated.Text>
            </Animated.View>

            <Animated.View style={[styles.footer, buttonStyle]}>
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.7}
                    onPress={onGetStarted}
                >
                    <Text style={styles.buttonText}>Get started</Text>
                </TouchableOpacity>
            </Animated.View>
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
        width: '60%',
        height: 50,
        alignSelf: 'center',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    buttonText: {
        fontSize: 20,
        color: '#1972ca',
        fontWeight: '700',
    },
});

export default SplashScreen;
