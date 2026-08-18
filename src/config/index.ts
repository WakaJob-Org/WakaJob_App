import Constants from 'expo-constants';

const CONFIG = {
    /**
     * Main WakaJob backend
     */
    API_BASE_URL:
        Constants.expoConfig?.extra?.apiUrl ||
        'https://wakajob-backend-8cha.onrender.com/api',

    TIMEOUT: 180000,

    APP_NAME: 'WakaJob',
    VERSION: '1.0.0',

    /**
     * WakaJob Chat Microservice
     *
     * REST:
     * https://wakajob-chat-service.onrender.com
     *
     * WebSocket:
     * wss://wakajob-chat-service.onrender.com/ws?token=JWT
     */
    CHAT_HTTP_BASE_URL:
        (
            Constants.expoConfig?.extra?.chatUrl ||
            'https://wakajob-chat-service.onrender.com'
        ).replace(/\/+$/, ''),

    CHAT_WS_BASE_URL:
        (
            Constants.expoConfig?.extra?.chatWsUrl ||
            'wss://wakajob-chat-service.onrender.com'
        ).replace(/\/+$/, ''),

    /**
     * Kept for compatibility with the existing app.
     *
     * IMPORTANT:
     * This does NOT control the WebSocket timeout.
     * WebSocket connections are handled by the native
     * WebSocket implementation.
     */
    CHAT_CONNECT_TIMEOUT: 60000,
};

export default CONFIG;