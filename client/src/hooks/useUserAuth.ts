import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuthStore } from '@/appStore/AuthStore';
import { socket } from '@/utils/Socket';


const handleMutationError = (error: any, fallbackMessage?: string) => {
  console.error("Full error object:", error);

  // Extract the real message (covers axios, fetch, custom, etc.)
  const message =
    error?.response?.data?.message ||    // axios typical
    error?.response?.data?.error ||      // backend 'error' field
    error?.response?.data?.msg ||        // 'msg' field
    (Array.isArray(error?.response?.data?.errors)
      ? error.response.data.errors.join(", ")
      : null) ||                         // multiple validation errors
    error?.message ||                    // general Error object
    error?.msg ||                        // custom msg
    fallbackMessage ||                   // developer fallback
    "Something went wrong!";             // absolute fallback

  // Show specific toast
  toast.error(message);
};

// Default function to manage success for mutations
const handleMutationSuccess = async(data: any, queryClient: any, navigate: any, setUser: any) => {
  const { user } = data;
  queryClient.setQueryData(['user', user.id], user);
  setUser(user);

  // window.location.reload(); 
   await queryClient.invalidateQueries(); 
    

    navigate('/home');
};


export const useUserAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setUser, isUserAuthenticated } = useAuthStore();

  // Query to get user details if authenticated
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: authService.getUser,
    enabled: !!isUserAuthenticated,
  });

  // Mutation for user login
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await authService.login(email, password, 'user');
      return response;
    },
    onSuccess: (data) => {
      console.log('Login successful, navigating to /home');
      socket.connect();
      handleMutationSuccess(data, queryClient, navigate, setUser);
      queryClient.invalidateQueries({ queryKey: ['user'] }); // Invalidate user query to ensure it's up-to-date
    },
    onError: (error) => handleMutationError(error, error.message),
  });

  // Mutation for OTP verification
  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, enterdOtp }: { email: string; enterdOtp: string }) => {
      const response = await authService.verifyOtp(email, enterdOtp);
      return response;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['user'], data.user);

      setUser(data.user);
      toast.success('User verified');
      navigate('/home');
    },
    onError: (error) => handleMutationError(error, 'Invalid OTP. Please try again.'),
    retry: false,
  });

  // Other mutations like requesting OTP, resetting password, etc.
  const requestOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return authService.requestOtp(email);
    },
  });

  const verifyOtpfMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      return authService.verifyOtpf(email, otp);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return authService.resetPassword(email, password);
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return authService.resendOtp(email);
    },
  });

  // Mutation for user registration
  const registerMutation = useMutation({
    mutationFn: async (userData: {
      fullname: string;
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
      gender: string;
    }) => {
      const data = await authService.register(userData);
      return data; // Return parsed data directly
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['userEmail'], { email: responseData.email });
      toast.success('Registration successful! Please verify your OTP.');
    },
    onError: (error: any) => {
      console.log(error);
      
      handleMutationError(error, error);
    },
  });

  const googleAuthMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await authService.googleAuth(userData);
      console.log('Response from backend:', response); // Log the response to check the structure
      return response;
    },
    onSuccess: (data) => {
      console.log(data.user._id, '>>>>>>>>>>>>>>>');
      // socket.emit('joinUser', data.user._id);
      // socket.emit('updateChatSocketId', {userId: data?.user?._id});
      socket.connect()
      handleMutationSuccess(data, queryClient, navigate, setUser);
      toast.success('User verified');
    },
    onError: (error) => {
      console.log(error);
      toast.error(error.message);
    },
  });

  const { isPending: isRegisterLoading } = registerMutation;
  const { isPending: isOtpLoading } = verifyOtpMutation;

  return {
    user,
    isLoading,
    isError,
    isRegisterLoading,
    loginMutation,
    verifyOtpMutation,
    resendOtpMutation,
    resetPasswordMutation,
    verifyOtpfMutation,
    requestOtpMutation,
    registerMutation,
    isOtpLoading,
    googleAuthMutation,
  };
};
