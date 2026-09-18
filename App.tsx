import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import RootNavigator from './src/navigation/RootNavigator';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { isExpoGo } from './src/utils/isExpoGo';

// pushNotificationService.ts (and expo-notifications itself) must not be
// required at all under Expo Go - touching expo-notifications' remote-push
// APIs there throws during module evaluation, before any of our own
// try/catch can run. A static top-level import would load it unconditionally,
// so it's required lazily and only outside Expo Go.
if (!isExpoGo) {
  // Registers the badge-increment background task with the OS. Requiring
  // pushNotificationService.ts also defines the task itself (TaskManager
  // requires task definitions at module scope), so this just has to run once.
  require('./src/services/pushNotificationService').registerBackgroundNotificationTask();
}

// Original Auth Screens
import SplashScreenUI from './src/screens/Splash/SplashScreen';
import SignupScreen from './src/screens/Auth/Signup/SignupScreen';
import LoginScreen from './src/screens/Auth/Login/LoginScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';

// Custom Screens (Patrick)
import CreateJobScreen from './src/screens/Dashboard/CreateJobScreen';
import ApplicationsScreen from './src/screens/Applications/ApplicationsScreen';
import ApplicantProfileScreen from './src/screens/Applications/ApplicantProfileScreen';

SplashScreen.preventAutoHideAsync();

const MainApp = () => {
  const { isLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': Pacifico_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && !isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  useEffect(() => {
    if (isExpoGo) return;
    const unsubscribe = require('./src/services/pushNotificationService').registerChatNotificationTapHandler();
    return unsubscribe;
  }, []);

  if (!fontsLoaded || isLoading) {
    return null; // Keep splash screen shown
  }

  return (
    <View style={styles.container || styles.appContainer} onLayout={onLayoutRootView}>
      <RootNavigator />
    </View>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ChatProvider>
              <StatusBar style="dark" hidden={false} />
              <MainApp />
            </ChatProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
