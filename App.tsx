import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, Text, ScrollView, Linking } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as SplashScreen from 'expo-splash-screen';
import CreateJobScreen from './src/screens/Dashboard/CreateJobScreen';
import ApplicationsScreen from './src/screens/Applications/ApplicationsScreen';
import ApplicantProfileScreen from './src/screens/Applications/ApplicantProfileScreen';

SplashScreen.preventAutoHideAsync();

type TestScreen = 'menu' | 'create-job' | 'applications' | 'applicant-profile';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': Pacifico_400Regular,
  });

  const [currentScreen, setCurrentScreen] = useState<TestScreen>('menu');
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>('1');

  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Mock data for testing
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
      {
        id: '1',
        company: 'DesignFlow Inc.',
        role: 'Senior UI/UX Designer',
        period: '2022 - Present',
        description: 'Leading design for mobile banking app with 100k+ users.'
      },
      {
        id: '2',
        company: 'Creative Studios',
        role: 'UI Designer',
        period: '2020 - 2022',
        description: 'Designed websites and mobile apps for 20+ clients.'
      }
    ],
    portfolio: [
      { id: '1', image: 'https://picsum.photos/200/300?random=1' },
      { id: '2', image: 'https://picsum.photos/200/300?random=2' },
      { id: '3', image: 'https://picsum.photos/200/300?random=3' },
      { id: '4', image: 'https://picsum.photos/200/300?random=4' }
    ]
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'create-job':
        return (
          <CreateJobScreen
            isVisible={true}
            onClose={() => setCurrentScreen('menu')}
            onPost={(job) => {
              console.log('Job posted:', job);
              alert('Job posted successfully!');
              setCurrentScreen('menu');
            }}
          />
        );

      case 'applications':
        return (
          <ApplicationsScreen
            isVisible={true}
            onBack={() => setCurrentScreen('menu')}
            onViewApplicant={(applicantId) => {
              setSelectedApplicantId(applicantId);
              setCurrentScreen('applicant-profile');
            }}
          />
        );

      case 'applicant-profile':
        return (
          <ApplicantProfileScreen
            isVisible={true}
            applicant={mockApplicant}
            onBack={() => setCurrentScreen('applications')}
            onMessage={() => alert('Message feature coming soon!')}
            onCall={() => alert('Call feature coming soon!')}
            onShortlist={() => alert('Added to shortlist!')}
            onHire={(details) => {
              console.log('Hire details:', details);
              alert(`Hire request sent!\nStart: ${details.startDate}\nDuration: ${details.duration}\nRate: ${details.rate}`);
              setCurrentScreen('applicant-profile');
            }}
          />
        );

      case 'menu':
      default:
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Today's Work</Text>
              <Text style={styles.subtitle}>Select a screen to test</Text>
            </View>

            <ScrollView contentContainerStyle={styles.menuContent}>
              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => setCurrentScreen('create-job')}
              >
                <View style={[styles.cardIcon, { backgroundColor: '#1972ca' }]}>
                  <Text style={styles.iconText}>📝</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Post a Job</Text>
                  <Text style={styles.cardDescription}>CreateJobScreen with image upload, toggle, and form</Text>
                </View>
                <Text style={styles.cardArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => setCurrentScreen('applications')}
              >
                <View style={[styles.cardIcon, { backgroundColor: '#4CAF50' }]}>
                  <Text style={styles.iconText}>👥</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Job Applications</Text>
                  <Text style={styles.cardDescription}>ApplicationsScreen with filters, search, and status badges</Text>
                </View>
                <Text style={styles.cardArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => setCurrentScreen('applicant-profile')}
              >
                <View style={[styles.cardIcon, { backgroundColor: '#9C27B0' }]}>
                  <Text style={styles.iconText}>👤</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Applicant Profile</Text>
                  <Text style={styles.cardDescription}>Full profile with tabs, hire bottom sheet, and actions</Text>
                </View>
                <Text style={styles.cardArrow}>→</Text>
              </TouchableOpacity>

              <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>📋 Today's Features</Text>
                <Text style={styles.noteItem}>✓ Post a Job - Image upload, toggle switch, form</Text>
                <Text style={styles.noteItem}>✓ Job Applications - Filter tabs, status badges, search</Text>
                <Text style={styles.noteItem}>✓ Applicant Profile - Tab navigation, hire sheet, actions</Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        );
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.appContainer} onLayout={onLayoutRootView}>
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 24,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1972ca',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  menuContent: {
    padding: 16,
    paddingBottom: 40,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardArrow: {
    fontSize: 20,
    color: '#1972ca',
    fontWeight: '600',
  },
  noteCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noteItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});