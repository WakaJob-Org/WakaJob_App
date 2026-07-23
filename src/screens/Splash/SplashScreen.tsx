import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing
} from 'react-native-reanimated';

import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../navigation/types';

type SplashScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Splash'>;

const SplashScreen = ({
    navigation
}: {
    navigation: SplashScreenNavigationProp;
}) => {
    // Animation values
    const logoOpacity = useSharedValue(0);
    const logoTranslateY = useSharedValue(20);

    useEffect(() => {
        // Sequence animations
        logoOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
        logoTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });
    }, []);

    // Show the splash for a few seconds, then auto-continue to the dashboard
    useEffect(() => {
        const timeout = setTimeout(() => {
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }, 2500);
        return () => clearTimeout(timeout);
    }, [navigation]);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ translateY: logoTranslateY.value }],
    }));

    return (
        <LinearGradient
            colors={['#1972ca', '#0d4f8e']}
            style={styles.container}
        >

            <Animated.View style={[styles.content, logoStyle]}>
                <Image
                    source={require('../../../assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
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
    logoImage: {
        width: 280,
        height: 280,
    },
});

export default SplashScreen;
