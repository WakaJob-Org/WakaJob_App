import React from 'react';
import { Dimensions } from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import SplashScreenUI from '../screens/Splash/SplashScreen';
import SignupScreen from '../screens/Auth/Signup/SignupScreen';
import LoginScreen from '../screens/Auth/Login/LoginScreen';
import OTPScreen from '../screens/Auth/OTP/OTPScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPassword/ForgotPasswordScreen';

const { height } = Dimensions.get('window');
const Stack = createStackNavigator<AuthStackParamList>();

const AuthStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            {/* Splash stays full screen at the back */}
            <Stack.Screen name="Splash" component={SplashScreenUI} />

            {/* These screens become 3/4 height modals sliding from the bottom */}
            <Stack.Group
                screenOptions={{
                    presentation: 'transparentModal',
                    cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                    cardStyle: { 
                        backgroundColor: 'transparent', 
                        marginTop: height * 0.15, // Fills bottom 85% 
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 30,
                        overflow: 'hidden'
                    },
                    transitionSpec: {
                        open: { animation: 'timing', config: { duration: 450 } },
                        close: { animation: 'timing', config: { duration: 450 } },
                    }
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="OTP" component={OTPScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </Stack.Group>

            {/*Employer screens*/}



            {/*Seeker screens*/}





            {/*Setting screens*/}
        </Stack.Navigator>
    );
};

export default AuthStack;
