import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import SplashScreenUI from './src/screens/Splash/SplashScreen';
import SignupScreen from './src/screens/Auth/Signup/SignupScreen';
import LoginScreen from './src/screens/Auth/Login/LoginScreen';
import OTPScreen from './src/screens/Auth/OTP/OTPScreen';
import ForgotPasswordScreen from './src/screens/Auth/ForgotPassword/ForgotPasswordScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import ApplicationsScreen from './src/screens/Applications/ApplicationsScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import ProfileSetupScreen from './src/screens/Profile/ProfileSetupScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import EmployerVerificationScreen from './src/screens/Auth/Verification/EmployerVerificationScreen';
import NotificationsScreen from './src/screens/Dashboard/NotificationsScreen';
import BottomTab, { TabType } from './src/components/BottomTab';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as SplashScreen from 'expo-splash-screen';
import authService from './src/services/authService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': Pacifico_400Regular,
  });

  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'otp' | 'forgot_password' | 'verification' | 'notifications' | 'dashboard' | 'profile_setup' | 'initializing' | null>('initializing');
  const [activeTab, setActiveTab] = useState<TabType | 'settings'>('jobs');
  const [userName, setUserName] = useState('Alex');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('--- APP INIT START ---');
        // 1. Wake up the backend in background
        authService.wakeUp();

        // 2. Immediate local check for token
        const authenticated = await authService.isAuthenticated();
        console.log('Auth check:', authenticated);

        // Pre-load cached name for immediate UI feedback
        try {
          const cachedName = await SecureStore.getItemAsync('cached_user_name');
          if (cachedName) setUserName(cachedName);
        } catch (e) { }

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
    setIsNewUser(true); // Flag that this is a signup flow
    setAuthMode('otp');
  };

  const handleAfterOtp = async () => {
    const user = await authService.getUser();
    if (user && user.full_name) {
      setUserName(user.full_name);
    }

    if (isNewUser) {
      setIsNewUser(false);
      setAuthMode('profile_setup');
    } else if (user && user.role === 'employer') {
      setAuthMode('verification');
    } else {
      setAuthMode('dashboard');
    }
  };

  const openDashboard = async () => {
    const user = await authService.getUser();
    if (user && user.full_name) {
      setUserName(user.full_name);
    }
    
    // If it's a new employer who hasn't verified, show verification instead
    if (user && user.role === 'employer') {
      setAuthMode('verification');
    } else {
      setAuthMode('dashboard');
    }
  };

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
            onNotificationPress={() => setAuthMode('notifications')}
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
              onNotificationPress={() => setAuthMode('notifications')}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const renderPrimaryLayer = () => {
    switch (authMode) {
      case 'notifications':
        return (
          <NotificationsScreen
            isVisible={true}
            onClose={() => setAuthMode('dashboard')}
          />
        );
      case 'dashboard':
        return (
          <View style={styles.mainContent}>
            {renderContent()}
            <BottomTab
              activeTab={activeTab === 'settings' ? 'jobs' : activeTab}
              onTabPress={(tab) => setActiveTab(tab)}
            />
          </View>
        );
      case 'verification':
        return (
          <EmployerVerificationScreen
            isVisible={true}
            onClose={logout}
            onSubmit={() => setAuthMode('dashboard')}
          />
        );
      case 'initializing':
      case null:
      case 'signup':
      case 'login':
      case 'otp':
      case 'forgot_password':
      case 'profile_setup':
        return (
          <>
            <SplashScreenUI
              onGetStarted={openSignup}
              showButton={authMode === null}
            />
            {authMode === 'profile_setup' && (
              <ProfileSetupScreen
                isVisible={true}
                onComplete={() => setAuthMode('dashboard')}
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
            {authMode === 'otp' && (
              <OTPScreen
                isVisible={true}
                email={verificationEmail}
                onClose={() => setAuthMode('signup')}
                onVerify={handleAfterOtp}
              />
            )}
            {authMode === 'forgot_password' && (
              <ForgotPasswordScreen
                isVisible={true}
                onClose={() => setAuthMode('login')}
                onSuccess={() => setAuthMode('login')}
              />
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <StatusBar hidden />
        {renderPrimaryLayer()}
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
