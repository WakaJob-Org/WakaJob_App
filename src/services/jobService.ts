import api from './api';

export interface Job {
    id: string;
    employer_id: string;
    position_vacant: string;
    description: string;
    location: string;
    salary: string;
    qualifications: string;
    job_type: 'full-time' | 'part-time' | 'contract';
    category: string;
    is_active: boolean;
    created_at: string;
}

const jobService = {
    getJobs: async () => {
        try {
            const response = await api.get<Job[]>('/jobs');
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to fetch jobs';
        }
    },

    getJobById: async (id: string) => {
        try {
            const response = await api.get<Job>(`/jobs/${id}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to fetch job details';
        }
    },
};

export default jobService;
