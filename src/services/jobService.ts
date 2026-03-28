import api from './api';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

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

export interface CreateJobData {
    employer_id: string;
    position_vacant: string;
    description: string;
    location: string;
    salary: string;
    category: string;
    job_type: 'full-time' | 'part-time' | 'contract' | 'freelance';
    qualifications?: string;
}

const jobService = {
    getJobs: async (params?: { search?: string, location?: string, category?: string, job_type?: string }): Promise<Job[]> => {
        try {
            const response = await api.get('/jobs', { params });
            const raw = response.data;
            // Backend may return a wrapped object: {jobs:[]}, {data:[]}, {results:[]}, or a plain array
            if (Array.isArray(raw)) return raw;
            if (Array.isArray(raw?.jobs)) return raw.jobs;
            if (Array.isArray(raw?.data)) return raw.data;
            if (Array.isArray(raw?.results)) return raw.results;
            console.warn('Unexpected /jobs response shape:', typeof raw, raw);
            return [];
        } catch (error: any) {
            throw error.response?.data?.message || error?.message || 'Failed to fetch jobs';
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

    createJob: async (data: CreateJobData) => {
        try {
            const response = await api.post<Job>('/jobs', data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to post job';
        }
    },

    applyToJob: async (jobId: string) => {
        try {
            const response = await api.post(`/applications`, { jobId });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to apply for job';
        }
    },

    saveJob: async (jobId: string) => {
        try {
            // Extract UUID from token to satisfy Supabase RLS policies
            let userId: string | undefined;
            const token = await SecureStore.getItemAsync('auth_token');
            if (token) {
                try {
                    const decoded: any = jwtDecode(token);
                    userId = decoded.sub || decoded.id;
                } catch (e) {}
            }

            const response = await api.post(`/jobs/save`, { 
                jobId,
                user_id: userId // Explicitly providing ID for RLS compliance
            });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to save job';
        }
    },

    updateJob: async (id: string, data: Partial<CreateJobData>) => {
        try {
            const response = await api.put(`/jobs/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to update job';
        }
    },

    deleteJob: async (id: string) => {
        try {
            const response = await api.delete(`/jobs/${id}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to delete job';
        }
    },

    getUserApplications: async () => {
        try {
            const response = await api.get('/applications');
            const raw = response.data;
            // Handle different response formats
            if (Array.isArray(raw)) return raw;
            if (Array.isArray(raw?.applications)) return raw.applications;
            if (Array.isArray(raw?.data)) return raw.data;
            if (Array.isArray(raw?.results)) return raw.results;
            console.warn('Unexpected /applications response shape:', typeof raw, raw);
            return [];
        } catch (error: any) {
            console.error('Failed to fetch applications:', error.response?.data?.message || error?.message);
            return [];
        }
    },

    getSavedJobs: async (workerId?: string) => {
        try {
            const endpoint = workerId ? `/jobs/saved/${workerId}` : '/jobs/saved';
            const response = await api.get(endpoint);
            const raw = response.data;
            if (Array.isArray(raw)) return raw;
            if (Array.isArray(raw?.saved)) return raw.saved;
            if (Array.isArray(raw?.data)) return raw.data;
            if (Array.isArray(raw?.results)) return raw.results;
            return [];
        } catch (error: any) {
            console.error('Failed to fetch saved jobs:', error.response?.data?.message || error?.message);
            return [];
        }
    }
};

export default jobService;