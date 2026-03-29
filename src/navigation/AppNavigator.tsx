import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';

// Temporary Screen Placeholders
// In the next step, we'll move the actual screens into features/
import SplashScreen from '../screens/Splash/SplashScreen';
import LoginScreen from '../screens/Auth/Login/LoginScreen';
import SignupScreen from '../screens/Auth/Signup/SignupScreen';
import OTPScreen from '../screens/Auth/OTP/OTPScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ProfileSetupScreen from '../screens/Profile/ProfileSetupScreen';
import EmployerVerificationScreen from '../screens/Auth/Verification/EmployerVerificationScreen';
import VerificationPendingScreen from '../screens/Verification/VerificationPendingScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  OTP: { email: string };
  Dashboard: undefined;
  ProfileSetup: { onComplete: () => void };
  EmployerVerification: undefined;
  VerificationPending: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
        </>
      ) : (
        // Main App Stack
        <>
           {/* Logic previously in App.tsx's routeUserByRole */}
           {user?.role === 'employer' ? (
              // Employer Flow
              user?.verification_status === 'verified' ? (
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
              ) : (
                <>
                   <Stack.Screen name="EmployerVerification" component={EmployerVerificationScreen} />
                   <Stack.Screen name="VerificationPending" component={VerificationPendingScreen} />
                </>
              )
           ) : (
              // Worker Flow
              <>
                 <Stack.Screen name="Dashboard" component={DashboardScreen} />
                 <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
              </>
           )}
        </>
      )}
    </Stack.Navigator>
  );
};
