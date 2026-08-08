import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

const pushNotificationService = {
    /**
     * Requests notification permissions, generates an Expo push token, and
     * registers it with the backend. Safe to call on every login/session
     * init — errors are swallowed so a push failure never blocks auth.
     */
    async registerPushToken(userId: string): Promise<string | null> {
        try {
            if (!Device.isDevice) {
                console.warn('--- Push notifications require a physical device, skipping ---');
                return null;
            }

            if (!projectId) {
                console.warn('--- Missing EAS projectId, skipping push token registration ---');
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
                console.warn('--- Push notification permission not granted ---');
                return null;
            }

            const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
            console.log('--- Expo push token obtained ---');

            await this.sendTokenToBackend(userId, pushToken);

            return pushToken;
        } catch (error: any) {
            console.error('--- Push token registration failed ---:', error.message || error);
            return null;
        }
    },

    async sendTokenToBackend(userId: string, pushToken: string): Promise<void> {
        await api.post('/users/push-token', {
            userId,
            pushToken,
            platform: Platform.OS,
        });
        console.log('--- Push token registered with backend ---');
    },
};

export default pushNotificationService;
