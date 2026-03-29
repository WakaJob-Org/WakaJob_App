import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import SplashScreenUI from './src/screens/Splash/SplashScreen';
import SignupScreen from './src/screens/Auth/Signup/SignupScreen';
import LoginScreen from './src/screens/Auth/Login/LoginScreen';
import OTPScreen from './src/screens/Auth/OTP/OTPScreen';
import ForgotPasswordScreen from './src/screens/Auth/ForgotPassword/ForgotPasswordScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import EmployerDashboardScreen from './src/screens/Dashboard/EmployerDashboardScreen';
import ApplicationsScreen from './src/screens/Applications/ApplicationsScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import ProfileSetupScreen from './src/screens/Profile/ProfileSetupScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import EmployerVerificationScreen from './src/screens/Auth/Verification/EmployerVerificationScreen';
import VerificationFailedScreen from './src/screens/Verification/VerificationFailedScreen';
import VerificationPendingScreen from './src/screens/Verification/VerificationPendingScreen';
import VerificationSuccessScreen from './src/screens/Verification/VerificationSuccessScreen';
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

  const [authMode, setAuthMode] = useState<
    'signup' | 'login' | 'otp' | 'forgot_password' | 'verification' | 
    'verification_failed' | 'verification_pending' | 'verification_success' |
    'notifications' | 'dashboard' | 'employer_dashboard' | 'profile_setup' | 'initializing' | null
  >('initializing');
  
  const [activeTab, setActiveTab] = useState<TabType | 'settings'>('jobs');
  const [userName, setUserName] = useState('Alex');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  const [employerVerificationSubmitted, setEmployerVerificationSubmitted] = useState(false);

  const routeUserByRole = async (user: any) => {
    // Check local backup flag for pending status
    const locallyPending = await SecureStore.getItemAsync('employer_verification_submitted');

    if (user && user.role === 'employer') {
      if (user.verification_status === 'pending' || locallyPending === 'true') {
        setAuthMode('verification_pending');
      } else if (user.verification_status === 'verified') {
        setAuthMode('employer_dashboard');
      } else if (user.verification_status === 'failed') {
        setAuthMode('verification_failed');
      } else {
        setAuthMode('verification');
      }
    } else {
      setAuthMode('dashboard');
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('--- APP INIT START ---');
        authService.wakeUp();

        const authenticated = await authService.isAuthenticated();
        const roleStr = await SecureStore.getItemAsync('auth_user_role');
        const locallyPending = await SecureStore.getItemAsync('employer_verification_submitted');
        if (locallyPending === 'true') setEmployerVerificationSubmitted(true);

        // USER REQUEST: If role is employer, force re-login after app clear (clean init)
        if (authenticated && roleStr === 'employer') {
            console.log('--- Employer found, clearing session for re-login ---');
            await authService.logout();
            setAuthMode(null);
            return;
        }

        console.log('Auth check:', authenticated);

        try {
          const cachedName = await SecureStore.getItemAsync('cached_user_name');
          if (cachedName) setUserName(cachedName);
        } catch (e) { }

        if (authenticated) {
          const user = await authService.getUser();
          if (user) {
            if (user.full_name) {
              console.log('User profile loaded:', user.full_name);
              setUserName(user.full_name);
            }
            routeUserByRole(user);
          } else {
            setAuthMode(null);
          }
        } else {
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

    if (isNewUser && user?.role === 'worker') {
      setIsNewUser(false);
      setAuthMode('profile_setup');
    } else {
      setIsNewUser(false);
      routeUserByRole(user);
    }
  };



  const openDashboard = async () => {
    const user = await authService.getUser();
    if (user && user.full_name) {
      setUserName(user.full_name);
    }
    
    // Save role for persistence logic on next start
    if (user?.role) {
      await SecureStore.setItemAsync('auth_user_role', user.role);
    }

    routeUserByRole(user);
  };

  const logout = async () => {
    await authService.logout();
    setAuthMode(null);
    setActiveTab('jobs');
    // Clear local verification flag
    await SecureStore.deleteItemAsync('employer_verification_submitted');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'jobs':
        if (authMode === 'employer_dashboard') {
          return (
            <EmployerDashboardScreen
              isVisible={true}
              onLogout={logout}
              onProfilePress={() => setActiveTab('profile')}
              onNotificationPress={() => setAuthMode('notifications')}
            />
          );
        }
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
          <DashboardScreen
            isVisible={true}
            userName={userName}
            onLogout={logout}
            onSettingsPress={() => setActiveTab('settings')}
            onProfilePress={() => setActiveTab('profile')}
            onNotificationPress={() => setAuthMode('notifications')}
            onlyShowSaved={true}
          />
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
      case 'employer_dashboard':
        return (
          <View style={styles.mainContent}>
            {renderContent()}
            <BottomTab
              activeTab={activeTab === 'settings' ? 'jobs' : activeTab}
              onTabPress={(tab) => {
                setActiveTab(tab);
              }}
            />
          </View>
        );
      case 'verification':
        return (
          <EmployerVerificationScreen
            isVisible={true}
            onClose={logout}
            onSubmit={() => setAuthMode('verification_pending')}
          />
        );
      case 'verification_pending':
        return (
          <VerificationPendingScreen
            isVisible={true}
            onProfilePress={() => setActiveTab('profile')}
          />
        );
      case 'verification_success':
        return (
          <VerificationSuccessScreen
            isVisible={true}
            onProfilePress={() => setActiveTab('profile')}
            onStartNow={() => setAuthMode('dashboard')}
          />
        );
      case 'verification_failed':
        return (
          <VerificationFailedScreen
            isVisible={true}
            onProfilePress={() => setActiveTab('profile')}
            onContactSupport={() => {
              const email = 'wakajob@gmail.com';
              Linking.openURL(`mailto:${email}?subject=${encodeURIComponent('Account Verification Issue')}`);
            }}
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
