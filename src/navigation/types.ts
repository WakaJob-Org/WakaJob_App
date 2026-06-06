export type AuthStackParamList = {
    Splash: undefined;
    Login: { redirectJob?: any } | undefined;
    Signup: { redirectJob?: any } | undefined;
    OTP: { email: string; isNewUser?: boolean; redirectJob?: any };
    ForgotPassword: { email?: string; redirectJob?: any };
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
    JobDetails: { job: any; autoOpenApply?: boolean };
    ProfileSetup: undefined;

    // Auth screens accessible from within the app (for apply gate)
    Login: { redirectJob?: any } | undefined;
    Signup: { redirectJob?: any } | undefined;
    OTP: { email: string; isNewUser?: boolean; redirectJob?: any };
    ForgotPassword: { email?: string; redirectJob?: any } | undefined;

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
