import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, MessageSquare, Moon, Sun, LogOut, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/appStore/useThemeStore';
import useMessageStore from '@/appStore/useMessageStore';
import { socket } from '@/utils/Socket';
import { chatSocket } from '@/utils/chatSocket';
import { useAuthStore } from '@/appStore/AuthStore';
import { useLocation } from 'react-router-dom';

import { toast } from 'react-toastify';
// import { chatSocket } from '@/utils/chatSocket';
interface HeaderProps {
  unreadCount: number;
}

const Header: React.FC<HeaderProps> = ({ unreadCount }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const userId = user?._id || null;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isDark = theme === 'dark';

  const location = useLocation();

  const totalUnreadMessages = useMessageStore((state) =>
    Object.values(state.unreadCounts).reduce((acc, count) => acc + count, 0),
  );



  useEffect(() => {
    if (!userId) return;
    socket.emit('joinUser', userId);
    chatSocket.emit('updateChatSocketId', { userId });

    return () => {
      socket.emit('leaveUser', userId);
    
      chatSocket.disconnect()
    };
  }, []);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  //hide header on specific routes in mobile view
  const hideHeaderRoutes = ['/home/create', '/home/edit-post'];
  const shouldHideHeader = hideHeaderRoutes.some((route) => location.pathname.startsWith(route));

  // if (shouldHideHeader) return null;

  return (
    <>
      {/* Desktop Header */}
      <div
        className={`sticky top-0 z-50 w-full  px-6 py-4 border shadow-md hidden lg:flex justify-between items-center transition-all
        ${isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}
      >
        <button
          onClick={() => navigate('/home')}
          className="text-xl font-bold hover:underline focus:outline-none"
        >
   <span className="mt-4 text-3xl md:text-2xl font-semibold animate-color-pulse">
  PingPod
</span>

        </button>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home/messages')}>
              <MessageSquare className="w-5 h-5" />
            </Button>
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5">
                {totalUnreadMessages}
              </span>
            )}
          </div>

          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home/notifications')}>
              <Bell className="w-5 h-5" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div
        className={`sticky top-0 z-50 w-full px-4 py-3 border shadow-md flex lg:hidden justify-between items-center transition-all
        ${isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}
      >
        <button
          onClick={() => navigate('/home')}
          className="text-lg font-bold hover:underline focus:outline-none"
        >
 <span className="mt-4 text-3xl md:text-2xl font-semibold animate-color-pulse">
  PingPod
</span>

        </button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home/messages')}>
              <MessageSquare className="w-5 h-5" />
            </Button>
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5">
                {totalUnreadMessages}
              </span>
            )}
          </div>

          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home/notifications')}>
              <Bell className="w-5 h-5" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5">
                {unreadCount}
              </span>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={() => setShowLogoutModal(true)}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            key="logout-modal"
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              className={`w-[90%] max-w-sm rounded-xl p-6 shadow-xl ${
                isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Confirm Logout</h2>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm mb-6">Are you sure you want to logout from VConnect?</p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="px-4 py-2"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" className="px-4 py-2" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
