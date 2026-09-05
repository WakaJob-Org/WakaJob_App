import api from './api';

export interface NotificationData {
    id: string;
    type: 'application_received' | 'application_accepted' | 'job_match' | 'profile_viewed' | 'message';
    title: string;
    description: string;
    time: string;
    isUnread: boolean;
    created_at?: string;
}

const notificationService = {
    getNotifications: async (): Promise<NotificationData[]> => {
        try {
            const response = await api.get('/notifications');
            const raw = response.data;
            if (Array.isArray(raw)) return raw;
            if (Array.isArray(raw?.notifications)) return raw.notifications;
            if (Array.isArray(raw?.data)) return raw.data;
            if (Array.isArray(raw?.results)) return raw.results;
            console.warn('Unexpected /notifications response shape:', typeof raw, raw);
            return [];
        } catch (error: any) {
            console.error('Failed to fetch notifications:', error.response?.data?.message || error?.message);
            return [];
        }
    },

    markAsRead: async (notificationId: string) => {
        try {
            const response = await api.put(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to mark notification as read';
        }
    },

    markAllAsRead: async () => {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to mark all notifications as read';
        }
    }
};

export default notificationService;
