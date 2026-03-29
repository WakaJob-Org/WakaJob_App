import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppStackParamList } from './types';
import MainTabs from './MainTabs';
import NotificationsScreen from '../screens/Dashboard/NotificationsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

import CreateJobScreen from '../screens/Dashboard/CreateJobScreen';
import ProfileSetupScreen from '../screens/Profile/ProfileSetupScreen';

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
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </Stack.Navigator>
    );
};

export default AppStack;
