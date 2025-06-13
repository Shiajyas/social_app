import { fetchData } from '../utils/axiosHelpers';

export const authService = {
  login: (email: string, password: string, role: 'user' | 'admin') => {
    const endpoint = role === 'admin' ? '/admin/login' : '/login';
    return fetchData(
      endpoint,
      {
        method: 'POST',
        data: { email, password, role },
      },
      'Login failed',
    );
  },

  verifyOtp: (email: string, enterdOtp: string) =>
    fetchData(
      '/verify_otp',
      {
        method: 'POST',
        data: { email, enterdOtp },
      },
      'OTP verification failed',
    ),

  resendOtp: (email: string) =>
    fetchData(
      '/resend_otp',
      {
        method: 'POST',
        data: { email },
      },
      'Failed to resend OTP',
    ),

  register: (userData: {
    fullname: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string;
  }) =>
    fetchData(
      '/register',
      {
        method: 'POST',
        data: userData,
      },
      'Registration failed',
    ),

  requestOtp: (email: string) =>
    fetchData(
      '/request_otp',
      {
        method: 'POST',
        data: { email },
      },
      'Failed to request OTP',
    ),

  resetPassword: (email: string, password: string) =>
    fetchData(
      '/reset_password',
      {
        method: 'POST',
        data: { email, password },
      },
      'Password reset failed',
    ),

  verifyOtpf: (email: string, enterdOtp: string) =>
    fetchData(
      '/verify_otpf',
      {
        method: 'POST',
        data: { email, enterdOtp },
      },
      'OTP verification failed',
    ),

  getUser: () =>
    fetchData(
      '/user',
      {
        method: 'GET',
      },
      'Failed to fetch user',
    ),

  getAdmin: () =>
    fetchData(
      '/admin/user',
      {
        method: 'GET',
      },
      'Failed to fetch admin',
    ),

  getAllUsers: (page: number = 1, limit: number = 10) =>
    fetchData(
      '/admin/users',
      {
        method: 'GET',
        params: { page, limit },
      },
      'Failed to fetch users',
    ),

  googleAuth: (userData: any) =>
    fetchData(
      '/google',
      {
        method: 'POST',
        data: userData,
      },
      'Google authentication failed',
    ),

  logout: () =>
    fetchData(
      '/logout',
      {
        method: 'POST',
      },
      'logout failed',
    ),

  // Block user by ID
  blockUser: (userId: string) =>
    fetchData(
      `/admin/users/${userId}/block`,
      {
        method: 'POST',
      },
      'Failed to block user',
    ),

  // Unblock user by ID
  unblockUser: (userId: string) =>
    fetchData(
      `/admin/users/${userId}/unblock`,
      {
        method: 'POST',
      },
      'Failed to unblock user',
    ),
};
