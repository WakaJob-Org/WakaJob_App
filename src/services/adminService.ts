import api from './api';

export interface VerificationSubmission {
    id: string;
    full_name: string;
    email: string;
    company_name?: string;
    company_bio: string;
    company_location: string;
    business_photo_url: string;
    id_front_url: string;
    id_back_url: string;
    business_certificate_url: string;
    submitted_at: string;
    verification_status: 'pending' | 'approved' | 'rejected';
}

const adminService = {
    /**
     * Fetch all users with pending verification status
     */
    getPendingVerifications: async (): Promise<VerificationSubmission[]> => {
        try {
            const response = await api.get('/admin/verifications/pending');
            // Backend might wrap it in { data: [] } or just return the array
            return response.data.data || response.data || [];
        } catch (error: any) {
            console.error('Failed to fetch pending verifications:', error.message);
            throw error.response?.data?.message || 'Error loading verification data';
        }
    },

    /**
     * Approve a verification request
     */
    approveVerification: async (userId: string) => {
        try {
            const response = await api.post(`/admin/verifications/approve/${userId}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Approval failed';
        }
    },

    /**
     * Reject a verification request
     */
    rejectVerification: async (userId: string, reason: string) => {
        try {
            const response = await api.post(`/admin/verifications/reject/${userId}`, { reason });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Rejection failed';
        }
    }
};

export default adminService;
