import React from 'react';
import { Animated, Dimensions } from 'react-native';

import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import type { StackCardInterpolationProps } from '@react-navigation/stack';
import { AppStackParamList } from './types';
import { useAuth } from '../context/AuthContext';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/Splash/SplashScreen';
import NotificationsScreen from '../screens/Dashboard/NotificationsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

import CreateJobScreen from '../screens/Dashboard/CreateJobScreen';
import JobDetailsScreen from '../components/JobDetailsScreen';
import ProfileSetupScreen from '../screens/Profile/ProfileSetupScreen';
import EmployerVerificationScreen from '../screens/Auth/Verification/EmployerVerificationScreen';
import VerificationPendingScreen from '../screens/Verification/VerificationPendingScreen';
import VerificationSuccessScreen from '../screens/Verification/VerificationSuccessScreen';
import VerificationFailedScreen from '../screens/Verification/VerificationFailedScreen';
import EmployerDashboardScreen from '../screens/Profile/EmployerDashboardScreen';

// Auth screens
import SignupScreen from '../screens/Auth/Signup/SignupScreen';
import LoginScreen from '../screens/Auth/Login/LoginScreen';
import OTPScreen from '../screens/Auth/OTP/OTPScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPassword/ForgotPasswordScreen';


const Stack = createStackNavigator<AppStackParamList>();

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Same vertical slide as forVerticalIOS, plus an animated dark overlay behind the
// sheet so the screen peeking through the top 20% is visibly dimmed/differentiated.
const bottomSheetInterpolator = ({ current, inverted, layouts: { screen } }: StackCardInterpolationProps) => {
    const translateY = Animated.multiply(
        current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [screen.height, 0],
            extrapolate: 'clamp',
        }),
        inverted
    );

    return {
        cardStyle: {
            transform: [{ translateY }],
        },
        overlayStyle: {
            opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.45],
                extrapolate: 'clamp',
            }),
        },
    };
};

const AppStack = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="CreateJob" component={CreateJobScreen} />
            <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="EmployerVerification" component={EmployerVerificationScreen} />
            <Stack.Screen name="VerificationPending" component={VerificationPendingScreen} />
            <Stack.Screen name="VerificationSuccess" component={VerificationSuccessScreen} />
            <Stack.Screen name="VerificationFailed" component={VerificationFailedScreen} />
            <Stack.Screen name="EmployerDashboard" component={EmployerDashboardScreen} />

            {/* Login/Signup/ForgotPassword/OTP only exist in the navigator while signed
                out. Once authenticated they're not just hidden - they're not registered
                at all, so there's no route left to navigate/swipe/deep-link back into. */}
            {!isAuthenticated && (
                <>
                    <Stack.Group
                        screenOptions={{
                            presentation: 'transparentModal',
                            cardStyleInterpolator: bottomSheetInterpolator,
                            cardOverlayEnabled: true,
                            // No overflow/borderRadius here - shadow needs to render unclipped.
                            // Each screen clips its own rounded corners on its root container.
                            // No marginTop here (unlike a typical bottom sheet) - the card now
                            // fills the full screen, and each screen renders its own transparent,
                            // tappable backdrop spacer above its visible sheet content. That way
                            // both the swipe-to-dismiss gesture and a tap-to-dismiss handler work
                            // from anywhere on screen, not just the visible sheet area.
                            cardStyle: {
                                backgroundColor: 'transparent',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: -6 },
                                shadowOpacity: 0.25,
                                shadowRadius: 16,
                                elevation: 24,
                            },
                            transitionSpec: {
                                open: { animation: 'timing', config: { duration: 350 } },
                                close: { animation: 'timing', config: { duration: 350 } },
                            },
                            gestureEnabled: true,
                            gestureDirection: 'vertical',
                            // Allow the swipe-to-dismiss gesture to start from anywhere on the
                            // full screen (including the backdrop spacer above the sheet), not
                            // just a thin strip near the top edge (the library default).
                            gestureResponseDistance: SCREEN_HEIGHT,
                        }}
                    >
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </Stack.Group>

                    {/* OTP kept as a full-height slide-up modal, unchanged */}
                    <Stack.Group
                        screenOptions={{
                            presentation: 'modal',
                            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                            cardStyle: {
                                borderTopLeftRadius: 24,
                                borderTopRightRadius: 24,
                                overflow: 'hidden',
                            },
                            transitionSpec: {
                                open: { animation: 'timing', config: { duration: 350 } },
                                close: { animation: 'timing', config: { duration: 350 } },
                            },
                            gestureEnabled: true,
                            gestureDirection: 'vertical',
                        }}
                    >
                        <Stack.Screen name="OTP" component={OTPScreen} />
                    </Stack.Group>
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppStack;
