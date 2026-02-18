import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import SplashScreenUI from './src/screens/Splash/SplashScreen';
import SignupScreen from './src/screens/Auth/Signup/SignupScreen';
import LoginScreen from './src/screens/Auth/Login/LoginScreen';
import OTPScreen from './src/screens/Auth/OTP/OTPScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as SplashScreen from 'expo-splash-screen';
import authService from './src/services/authService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': Pacifico_400Regular,
  });

  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'dashboard' | null>(null);

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await authService.isAuthenticated();
      if (authenticated) {
        setAuthMode('dashboard');
      }
    };
    checkAuth();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const openSignup = () => setAuthMode('signup');
  const openLogin = () => setAuthMode('login');
  const openDashboard = () => setAuthMode('dashboard');
  const closeAuth = () => {
    authService.logout();
    setAuthMode(null);
  };

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      {authMode !== 'dashboard' && (
        <SplashScreenUI
          onGetStarted={openSignup}
          showButton={authMode === null}
        />
      )}

      <SignupScreen
        isVisible={authMode === 'signup'}
        onClose={closeAuth}
        onSwitchToSignin={openLogin}
        onSignup={openDashboard}
      />

      <LoginScreen
        isVisible={authMode === 'login'}
        onClose={closeAuth}
        onSwitchToSignup={openSignup}
        onLogin={openDashboard}
      />

      <DashboardScreen
        isVisible={authMode === 'dashboard'}
        onLogout={closeAuth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

