import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SocketProvider } from '@/features/SocketProvider';
import IncomingCallUI from './ customComponents/common/IncomingCallUI';
import AppRoutes from '@/routes/AppRoutes';
import RouteWatcher from '@/utils/RouteWatcher';
import GlobalSocketListener from './hooks/chatHooks/GlobalSocketListener';

import { X } from 'lucide-react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import { useResponsiveToastPosition } from '@/hooks/useResponsiveToastPosition';

const queryClient = new QueryClient();

const App = () => {
  const toastPosition = useResponsiveToastPosition(); // Breakpoint defaults to 1000px

  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen transition-colors duration-300">
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <GlobalSocketListener />
          <RouteWatcher />

          <ToastContainer
            key={toastPosition}
            position={toastPosition}
            autoClose={3000}
            hideProgressBar
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            closeButton={({ closeToast }) => (
              <button
                onClick={closeToast}
                className="absolute top-2 right-2 text-black dark:text-white hover:opacity-80"
              >
                <X size={18} />
              </button>
            )}
            toastClassName="!relative !bg-white dark:!bg-black !text-black dark:!text-white !rounded-lg !shadow-md px-4 pt-3 pb-2"
            className="flex items-center gap-2 pr-6"
            icon={({ type }) =>
              type === 'success' ? (
                <FaCheckCircle className="text-green-500" />
              ) : type === 'error' ? (
                <FaExclamationTriangle className="text-red-500" />
              ) : (
                <FaInfoCircle className="text-blue-500" />
              )
            }
          />

          <IncomingCallUI />
          <AppRoutes />
        </SocketProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
