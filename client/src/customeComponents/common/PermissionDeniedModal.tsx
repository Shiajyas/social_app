// src/components/common/PermissionDeniedModal.tsx
import { useEffect } from 'react';
import { useModalStore } from '@/appStore/modalStore';
import { useNavigate } from 'react-router-dom';

const PermissionDeniedModal = () => {
  const { isVisible, message, hideModal } = useModalStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => {
        hideModal();
        navigate('/admin/dashboard');
      }, 3000); // Auto-redirect after 3s

      return () => clearTimeout(timeout);
    }
  }, [isVisible, hideModal, navigate]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg text-center max-w-sm">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2">{message}</p>
        <p className="mt-4 text-sm text-gray-500">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default PermissionDeniedModal;
