import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppStackParamList } from './types';
import MainTabs from './MainTabs';
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
import JobApplicantsScreen from '../screens/Applications/JobApplicantsScreen';

const Stack = createStackNavigator<AppStackParamList>();

const AppStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
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
            <Stack.Screen name="JobApplicants" component={JobApplicantsScreen} />
        </Stack.Navigator>
    );
};

export default AppStack;
