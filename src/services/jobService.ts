import api from './api';
import authService from './authService';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    image_url?: string;
    job_image?: string;
    requires_cv?: boolean | string;
    requires_cover_letter?: boolean | string;
    // The employer who posted the job - nested by the backend via its join, not flat fields
    users?: {
        id?: string;
        email?: string;
        full_name?: string;
        profiles?: {
            phone_number?: string;
            profile_image_url?: string;
        };
    };
}

export interface CreateJobData {
    title: string;
    description: string;
    location: string;
    category: string;
    payment_rate?: string;
    requires_cv?: boolean;
    requires_cover_letter?: boolean;
    job_image?: any;
    image_url?: string;
    job_type?: string;
    employer_id?: string;
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
            const response = await api.get(`/jobs/${id}`);
            const raw = response.data;
            // Same wrapped-response convention as /jobs: {status, data:{...}} rather than the job itself
            if (raw && typeof raw === 'object' && raw.data && !raw.id) return raw.data as Job;
            return raw as Job;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to fetch job details';
        }
    },

    createJob: async (data: any) => {
        try {
            // Most modern backends handle both JSON and FormData. 
            // We'll send the data as provided, and api.ts will handle the headers.
            const response = await api.post<Job>('/jobs', data);
            return response.data;
        } catch (error: any) {
            console.error('Job creation error:', error.response?.data || error.message);
            throw error.response?.data?.message || error.message || 'Failed to post job';
        }
    },

    applyToJob: async (jobId: string, data?: { application_type?: 'professional' | 'apprentice' }) => {
        try {
            // worker_id is required by the backend - decode it from the token directly
            // (avoids an extra network round-trip to fetch the full user profile)
            let workerId: string | undefined;
            const token = await SecureStore.getItemAsync('auth_token');
            if (token) {
                try {
                    const decoded: any = jwtDecode(token);
                    workerId = decoded.sub || decoded.id;
                } catch (e) {}
            }
            if (!workerId) {
                throw new Error('You must be logged in to apply for a job.');
            }

            const formData = new FormData();
            formData.append('job_id', jobId);
            formData.append('worker_id', workerId);
            if (data?.application_type) formData.append('application_type', data.application_type);

            const response = await api.post('/applications', formData);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || error.message || 'Failed to apply for job';
        }
    },

    updateApplicationStatus: async (applicationId: string, status: 'ACCEPTED' | 'REJECTED' | 'INTERVIEWING' | 'UNDER REVIEW') => {
        try {
            const response = await api.put(`/applications/${applicationId}/status`, { status });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to update application status';
        }
    },

    // Saved jobs are stored locally on-device (per user), not synced to the backend.
    saveJob: async (job: any, userId?: string) => {
        try {
            const key = userId ? `SAVED_JOBS_${userId}` : 'SAVED_JOBS_GUEST';
            const stored = await AsyncStorage.getItem(key);
            const savedJobs = stored ? JSON.parse(stored) : [];
            
            // Check if already saved
            const jobId = job.id || job._id;
            if (!savedJobs.some((j: any) => (j.id || j._id) === jobId)) {
                savedJobs.push(job);
                await AsyncStorage.setItem(key, JSON.stringify(savedJobs));
            }
            return { message: 'Job saved locally' };
        } catch (error: any) {
            console.error('Error saving job locally:', error);
            throw new Error('Failed to save job locally');
        }
    },

    unsaveJob: async (jobId: string, userId?: string) => {
        try {
            const key = userId ? `SAVED_JOBS_${userId}` : 'SAVED_JOBS_GUEST';
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
                let savedJobs = JSON.parse(stored);
                savedJobs = savedJobs.filter((j: any) => (j.id || j._id) !== jobId);
                await AsyncStorage.setItem(key, JSON.stringify(savedJobs));
            }
            return { message: 'Job unsaved locally' };
        } catch (error: any) {
            console.error('Error unsaving job locally:', error);
            throw new Error('Failed to unsave job locally');
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

    // Always the current user's own submitted applications (jobs they applied
    // to) - regardless of role. Never the applicants to jobs they posted.
    getUserApplications: async () => {
        const unwrap = (raw: any): any[] => {
            if (Array.isArray(raw)) return raw;
            if (Array.isArray(raw?.applications)) return raw.applications;
            if (Array.isArray(raw?.data)) return raw.data;
            if (Array.isArray(raw?.results)) return raw.results;
            return [];
        };

        try {
            const user = await authService.getUser();
            if (!user?.id) return [];

            const response = await api.get('/applications/my', { params: { worker_id: user.id } });
            return unwrap(response.data);
        } catch (error: any) {
            console.error('Failed to fetch applications:', error.response?.data?.message || error?.message);
            return [];
        }
    },

    getSavedJobs: async (userId?: string) => {
        try {
            const key = userId ? `SAVED_JOBS_${userId}` : 'SAVED_JOBS_GUEST';
            const stored = await AsyncStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (error: any) {
            console.error('Error fetching saved jobs locally:', error);
            return [];
        }
    },

    uploadImage: async (imageUri: string): Promise<string> => {
        try {
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'upload.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', {
                uri: imageUri,
                name: filename,
                type,
            } as any);

            const response = await api.post('/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data.image_url || response.data.url || '';
        } catch (error: any) {
            throw error.response?.data?.message || 'Image upload failed';
        }
    },

    getCompanies: async () => {
        try {
            const response = await api.get('/companies');
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to fetch companies';
        }
    }
};

export default jobService;