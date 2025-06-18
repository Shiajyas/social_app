import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useUserAuth } from '../../hooks/useUserAuth';

const OtpVerification: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState<number>(90);
  // const { verifyOtp, isLoading } = useAuthContext();
  const {
    verifyOtpMutation: verifyOtp,
    isOtpLoading: isLoading,
    resendOtpMutation,
  } = useUserAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  // const{resendOtpMutation} = useAuth()

  const queryClient = useQueryClient();
  useEffect(() => {
    // Fetch the data once when the component is mounted
    const cachedData = queryClient.getQueryData<{ email: string }>(['userEmail']);
    setEmail(cachedData?.email || null);
    console.log(cachedData?.email, 'fetched!!');
  }, [queryClient]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpSubmit = () => {
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits!');
      return;
    }
    setIsVerifying(true);
    if (email) {
      verifyOtp.mutate(
        { email, enterdOtp: otp },
        {
          onSuccess: () => {
            // toast.success("OTP verified successfully!");
          },
          onError: (error: any) => {
            console.log(error.msg);
          },
        },
      );
    } else {
      toast.error('Email is not available!');
    }
    setIsVerifying(false);
  };

  const handleResendOtp = () => {
    if (timer > 0) {
      toast.warn('Please wait until the timer expires to resend OTP.');
      return;
    }
    if (email) {
      resendOtpMutation.mutate(
        { email },
        {
          onSuccess: () => {
            setTimer(90);
          },
          onError: (error: any) => {
            toast.error(error?.response?.data?.msg || 'Failed to send OTP');
          },
        },
      );
    } else {
      toast.error('Email is not available!');
    }
    setTimer(90);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center h-screen px-4 bg-gray-100 dark:bg-gray-900 transition-colors"
    >
      {/* Logo */}
      <img src="/logo.png" alt="App Logo" className="w-16 h-16 mb-6" />

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">OTP Verification</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-center max-w-sm">
        We've sent a 6-digit OTP to your registered email. Please enter it below.
      </p>

      {/* OTP Input */}
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          maxLength={6}
          className="w-36 text-center py-2 px-4 border rounded-lg shadow-sm focus:outline-none bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleOtpSubmit}
        disabled={isVerifying || isLoading}
        className={`px-6 py-2 text-white rounded-lg shadow transition-all ${
          isVerifying || isLoading
            ? 'bg-blue-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        <span className="text-black">{isVerifying ? 'Verifying...' : 'Verify OTP'}</span>
      </button>

      {/* Resend OTP */}
      <p className="text-gray-600 dark:text-gray-400 mt-4">
        Didn't receive the OTP?{' '}
        <button
          onClick={handleResendOtp}
          disabled={timer > 0}
          className={`${
            timer > 0
              ? 'text-blue-400 cursor-not-allowed'
              : 'text-blue-500 underline hover:text-blue-600'
          }`}
        >
          <span className="text-black dark:text-white">Resend OTP</span>
        </button>
      </p>

      {/* Timer */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {timer > 0
          ? `Resend available in ${Math.floor(Number(timer) / 60)}:${(Number(timer) % 60)
              .toString()
              .padStart(2, '0')}`
          : 'You can resend the OTP now.'}
      </p>
    </motion.div>
  );
};

export default OtpVerification;
