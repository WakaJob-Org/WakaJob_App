export type AuthStackParamList = {
    Splash: undefined;
    Login: undefined;
    Signup: undefined;
    OTP: { email: string; isNewUser?: boolean };
    ForgotPassword: { email?: string };
};

export type EmployerVerificationParamList = {
    EmployerVerification: undefined;
    VerificationPending: undefined;
    VerificationSuccess: undefined;
    VerificationFailed: undefined;
};

export type MainTabParamList = {
    Jobs: undefined;
    Applications: undefined;
    Saved: undefined;
    Profile: undefined;
};

export type AppStackParamList = {
    MainTabs: { screen?: keyof MainTabParamList } | undefined;
    Notifications: undefined;
    Settings: undefined;
    CreateJob: undefined;
    JobDetails: { job: any };
    ProfileSetup: undefined;
    
    // Employer flow screens in AppStack
    EmployerVerification: undefined;
    VerificationPending: undefined;
    VerificationSuccess: undefined;
    VerificationFailed: { reason?: string } | undefined;
    EmployerDashboard: undefined;
};

export type RootStackParamList = {
    Auth: undefined;
    VerificationStack: undefined;
    App: undefined;
};
