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
    Saved: undefined;
    Applications: undefined;
    Chat: undefined;
    Profile: undefined;
};

// Params needed to open a chat thread: the conversation is identified by
// conversationId (deterministically derived from jobId + both participants -
// see chatService.buildConversationId), everything else is display data for
// the top bar / job context banner so the Chat Screen never has to guess it.
export type ChatConversationParams = {
    conversationId: string;
    jobId: string;
    jobTitle: string;
    otherUserId: string;
    otherUserName: string;
    otherUserPhoto?: string | null;
};

export type AppStackParamList = {
    Splash: undefined;
    MainTabs: { screen?: keyof MainTabParamList } | undefined;
    Notifications: undefined;
    Settings: undefined;
    CreateJob: undefined;
    JobDetails: { job: any; autoOpenApply?: boolean; alreadyApplied?: boolean };
    JobApplicants: { jobId: string; jobTitle: string };
    ChatConversation: ChatConversationParams;
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
