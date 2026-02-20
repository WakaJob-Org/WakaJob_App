import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreenUI from './src/screens/Splash/SplashScreen';
import SignupScreen from './src/screens/Auth/Signup/SignupScreen';
import LoginScreen from './src/screens/Auth/Login/LoginScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import ApplicationsScreen from './src/screens/Applications/ApplicationsScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import BottomTab, { TabType } from './src/components/BottomTab';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as SplashScreen from 'expo-splash-screen';
import authService from './src/services/authService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': Pacifico_400Regular,
  });

  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'dashboard' | null>(null);
  const [activeTab, setActiveTab] = useState<TabType | 'settings'>('jobs');
  const [userName, setUserName] = useState('Alex');

  useEffect(() => {
    const initApp = async () => {
      authService.wakeUp();
      const authenticated = await authService.isAuthenticated();
      const user = await authService.getUser();
      if (user && user.full_name) {
        setUserName(user.full_name.split(' ')[0]);
      }

      if (authenticated) {
        setAuthMode('dashboard');
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
        return <ApplicationsScreen isVisible={true} />;
      case 'profile':
        return <ProfileScreen isVisible={true} />;
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
        <StatusBar barStyle={authMode === 'dashboard' ? 'light-content' : 'dark-content'} />

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
            onSignup={openDashboard}
          />
        )}

        {authMode === 'login' && (
          <LoginScreen
            isVisible={true}
            onClose={() => setAuthMode(null)}
            onSwitchToSignup={openSignup}
            onLogin={openDashboard}
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
