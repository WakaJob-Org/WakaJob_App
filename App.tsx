import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SplashScreenUI from './src/screens/Splash/SplashScreen';
import SignupScreen from './src/screens/Auth/Signup/SignupScreen';
import LoginScreen from './src/screens/Auth/Login/LoginScreen';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': Pacifico_400Regular,
  });

  const [authMode, setAuthMode] = useState<'signup' | 'login' | null>(null);

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
  const closeAuth = () => setAuthMode(null);

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <SplashScreenUI onGetStarted={openSignup} />

      <SignupScreen
        isVisible={authMode === 'signup'}
        onClose={closeAuth}
        onSwitchToSignin={openLogin}
      />

      <LoginScreen
        isVisible={authMode === 'login'}
        onClose={closeAuth}
        onSwitchToSignup={openSignup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

