import api from './api';
import { Platform } from 'react-native';
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
    image_url?: string;
    job_image?: string;
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
            const response = await api.get<Job>(`/jobs/${id}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to fetch job details';
        }
    },

    createJob: async (data: any) => {
        try {
            // Get auth token
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Get the API base URL from config
            const CONFIG = require('../config').default;
            const url = `${CONFIG.API_BASE_URL}/jobs`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to post job`);
            }

            const result = await response.json();
            return result;
        } catch (error: any) {
            console.error('Job creation error:', error.message);
            throw error.message || 'Failed to post job';
        }
    },

    applyToJob: async (jobId: string, data?: { intro_text?: string; voice_note_uri?: string; application_type?: 'professional' | 'apprentice' }) => {
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

            if (!token) {
                throw new Error('No authentication token found');
            }

            const formData = new FormData();
            formData.append('job_id', jobId);
            if (userId) {
                formData.append('user_id', userId);
            }
            
            if (data?.intro_text) formData.append('intro_text', data.intro_text);
            if (data?.application_type) formData.append('application_type', data.application_type);
            
            if (data?.voice_note_uri) {
                const filename = data.voice_note_uri.split('/').pop() || 'voice_note.m4a';
                formData.append('voice_note', {
                    uri: Platform.OS === 'ios' ? data.voice_note_uri.replace('file://', '') : data.voice_note_uri,
                    name: filename,
                    type: 'audio/m4a',
                } as any);
            }

            // Get the API base URL from config
            const CONFIG = require('../config').default;
            const url = `${CONFIG.API_BASE_URL}/applications`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to apply for job`);
            }

            const result = await response.json();
            return result;
        } catch (error: any) {
            throw error.message || 'Failed to apply for job';
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

    unsaveJob: async (jobId: string) => {
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

            const response = await api.post(`/jobs/unsave`, { 
                jobId,
                user_id: userId // Explicitly providing ID for RLS compliance
            });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to unsave job';
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

    getJobApplicants: async (jobId: string) => {
        try {
            const response = await api.get(`/jobs/${jobId}/applications`);
            const raw = response.data;
            if (Array.isArray(raw)) return raw;
            if (Array.isArray(raw?.applications)) return raw.applications;
            if (Array.isArray(raw?.data)) return raw.data;
            if (Array.isArray(raw?.results)) return raw.results;
            console.warn(`Unexpected /jobs/${jobId}/applications response shape:`, typeof raw, raw);
            return [];
        } catch (error: any) {
            console.error(`Failed to fetch applicants for job ${jobId}:`, error.response?.data?.message || error?.message);
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