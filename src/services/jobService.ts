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

export interface CreateJobData {
    employer_id: string;
    position_vacant: string;
    description: string;
    location: string;
    salary?: string;
    category?: string;
    job_type: 'full-time' | 'part-time' | 'contract' | 'freelance';
    qualifications?: string;
    image_url?: string;
    is_apprentice?: boolean;
}

const jobService = {
    getJobs: async (): Promise<Job[]> => {
        try {
            const response = await api.get('/jobs');
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
            // Tentative endpoint based on common naming
            const response = await api.post(`/jobs/${jobId}/apply`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to apply for job';
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

    getSavedJobs: async () => {
        try {
            const response = await api.get('/jobs/saved');
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