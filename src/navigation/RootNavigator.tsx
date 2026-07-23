import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import EmployerVerificationScreen from '../screens/Auth/Verification/EmployerVerificationScreen';
import VerificationPendingScreen from '../screens/Verification/VerificationPendingScreen';
import VerificationSuccessScreen from '../screens/Verification/VerificationSuccessScreen';
import VerificationFailedScreen from '../screens/Verification/VerificationFailedScreen';
import ProfileSetupScreen from '../screens/Profile/ProfileSetupScreen';

import { RootStackParamList, EmployerVerificationParamList } from './types';

const RootStack = createStackNavigator<RootStackParamList>();
const VerificationStack = createStackNavigator<EmployerVerificationParamList>();

const RootNavigator = () => {
    const { isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1972ca" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                <RootStack.Screen name="App" component={AppStack} />
            </RootStack.Navigator>
        </NavigationContainer>
    );
};

// Sub-navigator for employer verification flow
const EmployerVerificationNavigator = () => {
    return (
        <VerificationStack.Navigator screenOptions={{ headerShown: false }}>
            <VerificationStack.Screen name="EmployerVerification" component={EmployerVerificationScreen} />
            <VerificationStack.Screen name="VerificationPending" component={VerificationPendingScreen} />
            <VerificationStack.Screen name="VerificationSuccess" component={VerificationSuccessScreen} />
            <VerificationStack.Screen name="VerificationFailed" component={VerificationFailedScreen} />
        </VerificationStack.Navigator>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
});

export default RootNavigator;
