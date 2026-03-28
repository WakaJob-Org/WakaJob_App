export type UserRole = 'worker' | 'employer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  date_of_birth?: string;
  bio?: string;
  skills?: string[];
  profile_image_url?: string;
  verification_status?: 'pending' | 'verified' | 'unverified';
}

export interface AuthResponse {
  data: {
    user: User;
    session?: {
      access_token: string;
    };
  };
  token?: string;
  message?: string;
}

export interface AuthError {
  message: string;
  status?: number;
}
