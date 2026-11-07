import Constants, { ExecutionEnvironment } from 'expo-constants';

// expo-notifications' remote-push APIs throw (not just warn) the moment
// they're touched inside Expo Go as of SDK 53+, and the throw happens at
// module-evaluation time - not inside any try/catch we control. So rather
// than guard individual calls, callers of pushNotificationService must avoid
// `require`-ing it at all when this is true, deferring the require to a
// runtime check instead of a static import.
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
