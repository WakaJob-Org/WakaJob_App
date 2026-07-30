import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import authService from './authService';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

// How a notification is presented while the app is open. Background/closed
// delivery is handled separately below by the TaskManager task.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Requests permission and returns a device Expo push token, or null if the
// user declined, this isn't a physical device (push tokens don't work on
// simulators), or token generation otherwise failed.
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device - skipping.');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Notification permission not granted.');
        return null;
    }

    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
        return tokenResponse.data;
    } catch (error) {
        console.error('Failed to get Expo push token:', error);
        return null;
    }
};

// Call this once after a successful login: requests permission, generates
// the token, and saves it to the backend. Silently no-ops on any failure -
// push notifications are a nice-to-have, not something that should block
// or interrupt the login flow.
export const registerPushTokenAfterLogin = async (): Promise<void> => {
    try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
            await authService.savePushToken(token);
        }
    } catch (error) {
        console.error('Push token registration failed:', error);
    }
};

// Fires when a notification is delivered while the app is backgrounded or
// fully closed. Must be defined at module scope (not inside a component).
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ error }) => {
    if (error) {
        console.error('Background notification task error:', error);
        return;
    }
    try {
        const currentBadge = await Notifications.getBadgeCountAsync();
        await Notifications.setBadgeCountAsync(currentBadge + 1);
    } catch (e) {
        console.error('Failed to increment badge count:', e);
    }
});

// Registers the task above with the OS. Call once at app startup.
export const registerBackgroundNotificationTask = async (): Promise<void> => {
    try {
        await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    } catch (error) {
        console.error('Failed to register background notification task:', error);
    }
};
