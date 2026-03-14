import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreenUI from './src/screens/Splash/SplashScreen';
import SignupScreen from './src/screens/Auth/Signup/SignupScreen';
import LoginScreen from './src/screens/Auth/Login/LoginScreen';
import OTPScreen from './src/screens/Auth/OTP/OTPScreen';
import ForgotPasswordScreen from './src/screens/Auth/ForgotPassword/ForgotPasswordScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import ApplicationsScreen from './src/screens/Applications/ApplicationsScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import VerificationFailedScreen from './src/screens/Verification/VerificationFailedScreen';
import VerificationPendingScreen from './src/screens/Verification/VerificationPendingScreen';
import VerificationSuccessScreen from './src/screens/Verification/VerificationSuccessScreen';
import BottomTab, { TabType } from './src/components/BottomTab';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as SplashScreen from 'expo-splash-screen';
import authService from './src/services/authService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': Pacifico_400Regular,
  });

  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'otp' | 'forgot_password' | 'dashboard' | 'verification_failed' | 'verification_pending' | 'verification_success' | 'initializing' | null>('initializing');
  const [activeTab, setActiveTab] = useState<TabType | 'settings'>('jobs');
  const [userName, setUserName] = useState('Alex');
  const [verificationEmail, setVerificationEmail] = useState('');

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('--- APP INIT START ---');
        // 1. Wake up the backend in background
        authService.wakeUp();

        // 2. Immediate local check for token
        const authenticated = await authService.isAuthenticated();
        console.log('Auth check:', authenticated);

        if (authenticated) {
          // If we have a token, jump to dashboard immediately to avoid showing login
          setAuthMode('dashboard');

          // 3. Then fetch user details in background
          const user = await authService.getUser();
          if (user && user.full_name) {
            console.log('User profile loaded:', user.full_name);
            setUserName(user.full_name);
          }
        } else {
          // No token, show the landing/splash options
          setAuthMode(null);
        }
      } catch (error) {
        console.error('App Init Error:', error);
        setAuthMode(null);
      }
    };
    initApp();
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
  const openForgotPassword = () => setAuthMode('forgot_password');
  const openOtp = (email: string) => {
    setVerificationEmail(email);
    setAuthMode('otp');
  };
  const openDashboard = () => setAuthMode('dashboard');
  const logout = () => {
    authService.logout();
    setAuthMode(null);
    setActiveTab('jobs');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'jobs':
        return (
          <DashboardScreen
            isVisible={true}
            userName={userName}
            onLogout={logout}
            onSettingsPress={() => setActiveTab('settings')}
            onProfilePress={() => setActiveTab('profile')}
          />
        );
      case 'applications':
        return <ApplicationsScreen isVisible={true} onBack={() => setActiveTab('jobs')} />;
      case 'profile':
        return <ProfileScreen isVisible={true} onBack={() => setActiveTab('jobs')} onLogout={logout} />;
      case 'settings':
        return (
          <SettingsScreen
            isVisible={true}
            onClose={() => setActiveTab('jobs')}
            onLogout={logout}
          />
        );
      case 'save':
        return (
          <View style={styles.placeholderScreen}>
            <DashboardScreen
              isVisible={true}
              userName={userName}
              onLogout={logout}
              onSettingsPress={() => setActiveTab('settings')}
              onProfilePress={() => setActiveTab('profile')}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <StatusBar hidden />

        {authMode !== 'dashboard' && (
          <SplashScreenUI
            onGetStarted={openSignup}
            showButton={authMode === null}
          />
        )}

        {authMode === 'signup' && (
          <SignupScreen
            isVisible={true}
            onClose={() => setAuthMode(null)}
            onSwitchToSignin={openLogin}
            onSignup={openOtp}
          />
        )}

        {authMode === 'login' && (
          <LoginScreen
            isVisible={true}
            onClose={() => setAuthMode(null)}
            onSwitchToSignup={openSignup}
            onForgotPassword={openForgotPassword}
            onLogin={openDashboard}
          />
        )}

        {authMode === 'forgot_password' && (
          <ForgotPasswordScreen
            isVisible={true}
            onClose={() => setAuthMode('login')}
            onSuccess={() => setAuthMode('login')}
          />
        )}

        {authMode === 'otp' && (
          <OTPScreen
            isVisible={true}
            email={verificationEmail}
            onClose={() => setAuthMode('signup')}
            onVerify={openDashboard}
          />
        )}

        {authMode === 'verification_pending' && (
          <VerificationPendingScreen
            isVisible={true}
            onProfilePress={() => { }}
          />
        )}

        {authMode === 'verification_success' && (
          <VerificationSuccessScreen
            isVisible={true}
            onProfilePress={() => { }}
            onStartNow={() => setAuthMode('dashboard')}
          />
        )}

        {authMode === 'verification_failed' && (
          <VerificationFailedScreen
            isVisible={true}
            onProfilePress={() => { }}
            onContactSupport={() => {
              const email = 'wakajob@gmail.com';
              Linking.openURL(`mailto:${email}?subject=${encodeURIComponent('Account Verification Issue')}`);
            }}
          />
        )}

        {authMode === 'dashboard' && (
          <View style={styles.mainContent}>
            {renderContent()}
            <BottomTab
              activeTab={activeTab === 'settings' ? 'jobs' : activeTab}
              onTabPress={(tab) => setActiveTab(tab)}
            />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
  },
  placeholderScreen: {
    flex: 1,
  },
});


