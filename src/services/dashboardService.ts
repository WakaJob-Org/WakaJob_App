
import api from './api';

export interface DashboardSummary {
    totalJobs: number;
    appliedJobs: number;
    savedJobs: number;
    profileViews: number;
    recentActivity: ActivityItem[];
}

export interface ActivityItem {
    id: string;
    type: 'application' | 'view' | 'save' | 'job_post';
    title: string;
    company?: string;
    timestamp: string;
    status?: 'pending' | 'approved' | 'rejected';
}

export interface DashboardResponse {
    summary: {
        total_jobs: number;
        applied_jobs: number;
        saved_jobs: number;
        profile_views: number;
    };
    recent_activity: Array<{
        id: string;
        type: string;
        job_title: string;
        company_name?: string;
        applied_at?: string;
        viewed_at?: string;
        saved_at?: string;
        status?: string;
    }>;
}

const dashboardService = {
    async getDashboardSummary(): Promise<DashboardSummary> {
        try {
            console.log('Fetching dashboard summary...');
            const response = await api.get<DashboardResponse>('/dashboard');

            console.log('Dashboard response:', response.data);

            // Map backend response to frontend format
            const summary: DashboardSummary = {
                totalJobs: response.data.summary?.total_jobs || 0,
                appliedJobs: response.data.summary?.applied_jobs || 0,
                savedJobs: response.data.summary?.saved_jobs || 0,
                profileViews: response.data.summary?.profile_views || 0,
                recentActivity: response.data.recent_activity?.map(item => ({
                    id: item.id,
                    type: this.mapActivityType(item.type),
                    title: item.job_title,
                    company: item.company_name || 'WakaJob Partner',
                    timestamp: item.applied_at || item.viewed_at || item.saved_at || new Date().toISOString(),
                    status: this.mapStatus(item.status)
                })) || []
            };

            return summary;

        } catch (error: any) {
            console.error('Error fetching dashboard:', error);

            // If endpoint doesn't exist yet, return mock data for development
            if (error.response?.status === 404) {
                console.log('Dashboard endpoint not found, using mock data');
                return {
                    totalJobs: 24,
                    appliedJobs: 5,
                    savedJobs: 8,
                    profileViews: 142,
                    recentActivity: [
                        {
                            id: '1',
                            type: 'application',
                            title: 'Senior UI Designer',
                            company: 'DesignFlow Inc.',
                            timestamp: new Date().toISOString(),
                            status: 'pending'
                        },
                        {
                            id: '2',
                            type: 'view',
                            title: 'Your profile was viewed',
                            company: 'Tech Corp',
                            timestamp: new Date(Date.now() - 86400000).toISOString(),
                        },
                        {
                            id: '3',
                            type: 'save',
                            title: 'Frontend Developer',
                            company: 'Startup XYZ',
                            timestamp: new Date(Date.now() - 172800000).toISOString(),
                        }
                    ]
                };
            }

            if (error.response?.status === 401) {
                throw new Error('unauthorized');
            }

            throw error;
        }
    },

    mapActivityType(type: string): 'application' | 'view' | 'save' | 'job_post' {
        const typeLower = type.toLowerCase();
        if (typeLower.includes('apply') || typeLower.includes('application')) return 'application';
        if (typeLower.includes('view')) return 'view';
        if (typeLower.includes('save') || typeLower.includes('bookmark')) return 'save';
        if (typeLower.includes('post') || typeLower.includes('job_post')) return 'job_post';
        return 'application';
    },

    mapStatus(status?: string): 'pending' | 'approved' | 'rejected' | undefined {
        if (!status) return undefined;
        const statusLower = status.toLowerCase();
        if (statusLower.includes('pending')) return 'pending';
        if (statusLower.includes('approv')) return 'approved';
        if (statusLower.includes('reject')) return 'rejected';
        return undefined;
    },

    getActivityIcon(type: string): string {
        switch (type) {
            case 'application': return 'document-text-outline';
            case 'view': return 'eye-outline';
            case 'save': return 'bookmark-outline';
            case 'job_post': return 'briefcase-outline';
            default: return 'time-outline';
        }
    },

    getActivityColor(type: string): string {
        switch (type) {
            case 'application': return '#4CAF50';
            case 'view': return '#9C27B0';
            case 'save': return '#FF9800';
            case 'job_post': return '#1972ca';
            default: return '#666';
        }
    }
};

export default dashboardService;
