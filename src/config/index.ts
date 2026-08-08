import Constants from 'expo-constants';

/**
 * Centrally managed application configuration.
 * Avoids hardcoding URLs and secrets in multiple places.
 */
const CONFIG = {
    // Use environment variables if available via EAS/Expo, fallback to Render URL
    API_BASE_URL: Constants.expoConfig?.extra?.apiUrl || 'https://wakajob-backend-8cha.onrender.com/api',
    TIMEOUT: 180000, // 3 minutes for slow cold starts
    APP_NAME: 'WakaJob',
    VERSION: '1.0.0',

    // Wakajob Chat Engine (separate microservice, see Wakajob_Chat_Engine_Specification).
    // Hosted on Render's free tier: cold starts take 30-50s after 15min idle.
    CHAT_HTTP_BASE_URL: Constants.expoConfig?.extra?.chatUrl || 'https://wakajob-chat-service.onrender.com',
    CHAT_WS_BASE_URL: Constants.expoConfig?.extra?.chatWsUrl || 'wss://wakajob-chat-service.onrender.com',
    CHAT_CONNECT_TIMEOUT: 60000, // spec requires >= 60s to tolerate cold start
};

export default CONFIG;
