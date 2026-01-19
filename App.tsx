import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SplashScreen from './src/screens/Splash/SplashScreen';
import SignupScreen from './src/screens/Auth/Signup/SignupScreen';

export default function App() {
  const [isSignupVisible, setIsSignupVisible] = useState(false);

  return (
    <View style={styles.container}>
      <SplashScreen onGetStarted={() => setIsSignupVisible(true)} />
      <SignupScreen
        isVisible={isSignupVisible}
        onClose={() => setIsSignupVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

