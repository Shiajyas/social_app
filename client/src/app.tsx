import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '@/features/SocketProvider';
import IncomingCallUI from '@/ customComponents/common/IncomingCallUI';
import AppRoutes from '@/routes/AppRoutes';
import RouteWatcher from '@/utils/RouteWatcher';
import GlobalSocketListener from './hooks/chatHooks/GlobalSocketListener';
// import MediaSocketInitializer from './utils/MediaSocketProvider';
// App.tsx or _app.tsx

const queryClient = new QueryClient();

const App = () => {
  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen transition-colors duration-300">
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <GlobalSocketListener />
          <RouteWatcher />

          <ToastContainer
            position="bottom-left"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
             theme="colored"
          />

          <IncomingCallUI />
          <AppRoutes />
        </SocketProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
