import Constants from 'expo-constants';

/**
 * Centrally managed application configuration.
 * Avoids hardcoding URLs and secrets in multiple places.
 */
const CONFIG = {
    // Use environment variables if available via EAS/Expo, fallback to Render URL
    API_BASE_URL: Constants.expoConfig?.extra?.apiUrl || 'https://wakajob-backend.onrender.com/api',
    TIMEOUT: 180000, // 3 minutes for slow cold starts
    APP_NAME: 'WakaJob',
    VERSION: '1.0.0',
};

export default CONFIG;
