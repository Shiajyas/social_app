import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/appStore/AuthStore';

import RegisterPage from '@/ customComponents/auth/RegisterPage';
import OtpVerification from '@/ customComponents/auth/VerifyOtpPage';
import ForgotPasswordPage from '@/ customComponents/ForgetPwd';
import { UserLoginPage } from '@/pages/User/UserLoginPage';
import AdminLoginPage from '@/pages/Admin/AdminLoginPage';

import UserRoutes from './UserRoutes';
import AdminRoutes from './AdminRoutes';

const AppRoutes = () => {
  const { isAdminAuthenticated, isUserAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OtpVerification />} />
      <Route
        path="/login"
        element={isUserAuthenticated ? <Navigate to="/home" replace /> : <UserLoginPage />}
      />
      <Route
        path="/admin/login"
        element={
          isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />

      {/* User + Admin Routes */}
      {UserRoutes()}
      {AdminRoutes()}

      {/* Catch-All */}
      <Route
        path="*"
        element={
          isUserAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
