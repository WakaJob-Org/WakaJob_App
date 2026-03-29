import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import SplashScreenUI from '../screens/Splash/SplashScreen';
import SignupScreen from '../screens/Auth/Signup/SignupScreen';
import LoginScreen from '../screens/Auth/Login/LoginScreen';
import OTPScreen from '../screens/Auth/OTP/OTPScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPassword/ForgotPasswordScreen';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Splash" component={SplashScreenUI} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

            {/*Employer screens*/}



            {/*Seeker screens*/}





            {/*Setting screens*/}
        </Stack.Navigator>
    );
};

export default AuthStack;
