import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as SplashScreen from 'expo-splash-screen';
import authService from './src/services/authService';

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

type AuthMode = 'signup' | 'login' | 'dashboard' | null;

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': Pacifico_400Regular,
  });

  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [showApplicantProfile, setShowApplicantProfile] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

  useEffect(() => {
    const checkLogin = async () => {
      const user = await authService.getUser();
      if (user) {
        setAuthMode('dashboard');
      }
    };
    checkLogin();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Mock data for Applicant Profile
  const mockApplicant = {
    id: '1',
    name: 'Sarah Johnson',
    role: 'UI/UX Designer',
    location: 'Bamenda, Cameroon',
    avatar: 'https://i.pravatar.cc/150?img=1',
    isOnline: true,
    isVerified: true,
    bio: 'Passionate UI/UX designer with 5+ years of experience creating intuitive and beautiful digital products. Specialized in fintech and e-commerce applications.',
    skills: ['User Research', 'Wireframing', 'Prototyping', 'Figma', 'Adobe XD', 'Usability Testing'],
    experience: [
      { id: '1', company: 'DesignFlow Inc.', role: 'Senior UI/UX Designer', period: '2022 - Present', description: 'Leading design for mobile banking app with 100k+ users.' },
      { id: '2', company: 'Creative Studios', role: 'UI Designer', period: '2020 - 2022', description: 'Designed websites and mobile apps for 20+ clients.' }
    ],
    portfolio: [
      { id: '1', image: 'https://picsum.photos/200/300?random=1' },
      { id: '2', image: 'https://picsum.photos/200/300?random=2' },
      { id: '3', image: 'https://picsum.photos/200/300?random=3' }
    ]
  };

  const openSignup = () => setAuthMode('signup');
  const openLogin = () => setAuthMode('login');
  const openDashboard = () => setAuthMode('dashboard');
  const logout = async () => {
    await authService.logout();
    setAuthMode(null);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.appContainer} onLayout={onLayoutRootView}>
        {/* Splash Flow */}
        {authMode !== 'dashboard' && (
          <SplashScreenUI
            onGetStarted={openSignup}
            showButton={authMode === null}
          />
        )}

        <SignupScreen
          isVisible={authMode === 'signup'}
          onClose={() => setAuthMode(null)}
          onSwitchToSignin={openLogin}
          onSignup={openDashboard}
        />

        <LoginScreen
          isVisible={authMode === 'login'}
          onClose={() => setAuthMode(null)}
          onSwitchToSignup={openSignup}
          onLogin={openDashboard}
        />

        {/* Dashboard Flow */}
        {authMode === 'dashboard' && (
          <DashboardScreen
            isVisible={true}
            userName="User"
            onLogout={logout}
            onSettingsPress={() => alert('Settings coming soon!')}
            onProfilePress={() => alert('Profile coming soon!')}
            onPostJobPress={() => setShowCreateJob(true)}
            onApplicationsPress={() => setShowApplications(true)}
          />
        )}

        {/* Overlays / Custom Screens */}
        <CreateJobScreen
          isVisible={showCreateJob}
          onClose={() => setShowCreateJob(false)}
          onPost={(job) => {
            setShowCreateJob(false);
          }}
        />

        <ApplicationsScreen
          isVisible={showApplications}
          onBack={() => setShowApplications(false)}
          onViewApplicant={(id) => {
            setSelectedApplicant(mockApplicant); // In real app, fetch by id
            setShowApplicantProfile(true);
          }}
        />

        {showApplicantProfile && (
          <ApplicantProfileScreen
            isVisible={true}
            applicant={selectedApplicant || mockApplicant}
            onBack={() => setShowApplicantProfile(false)}
            onMessage={() => alert('Message feature coming soon!')}
            onCall={() => alert('Call feature coming soon!')}
            onShortlist={() => alert('Added to shortlist!')}
            onHire={(details) => {
              alert(`Hire request sent for ${details.duration}!`);
              setShowApplicantProfile(false);
            }}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});