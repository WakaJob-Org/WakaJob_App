import React, { useEffect } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();

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
                {/* logo.png is a single lockup image (icon + wordmark stacked
                    vertically) - crop to just the icon here via overflow:hidden
                    so the wordmark isn't duplicated with the one below. */}
                <View style={styles.iconCrop}>
                    <Image
                        source={require('../../../assets/logo.png')}
                        style={styles.iconCropImage}
                    />
                </View>
            </Animated.View>

            <Animated.View style={[styles.bottomTextWrap, { paddingBottom: insets.bottom + 30 }, logoStyle]}>
                {/* Same source image, cropped to just the wordmark region so the
                    bottom text matches the logo's exact font/art. */}
                <View style={styles.textCrop}>
                    <Image
                        source={require('../../../assets/logo.png')}
                        style={styles.textCropImage}
                    />
                </View>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    // Absolutely positioned over the full screen (independent of the bottom
    // text below) so the icon is centered relative to the whole screen -
    // equal margins left/right and top/bottom - rather than the space left
    // over above the bottom text.
    content: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: 280,
        height: 280,
    },
    // logo.png is 1254x1254: the icon glyph sits at roughly x[280,862] y[274,793]
    // and the wordmark sits at roughly x[323,931] y[904,1057]. Each crop below
    // renders the full image at a fixed scale inside an overflow:hidden box,
    // shifted so only that region is visible.
    iconCrop: {
        width: 126,
        height: 112,
        overflow: 'hidden',
    },
    iconCropImage: {
        width: 271,
        height: 271,
        left: -60,
        top: -59,
    },
    // Independently pinned to the bottom edge (rather than relying on flex
    // distribution against the now-absolutely-positioned icon above).
    bottomTextWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
    },
    textCrop: {
        width: 143,
        height: 36,
        overflow: 'hidden',
    },
    textCropImage: {
        width: 295,
        height: 295,
        left: -76,
        top: -213,
    },
});

export default SplashScreen;
