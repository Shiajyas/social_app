import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import LeftSideBar from '@/ customComponents/home/LeftSideBar';
import RightSideBar from '@/ customComponents/home/RightSideBar';
import BottomNav from '@/ customComponents/home/BottomNav';
import Header from '@/ customComponents/home/Header';

import useNotificationStore from '@/store/notificationStore';
import { useAuthStore } from '@/appStore/AuthStore';
import { socket } from '@/utils/Socket';

const HomeLayout: React.FC = () => {
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const userId = user?._id || null;
  const location = useLocation();

  const communityTab = location.pathname.includes('/community');
  const isCreatePage = location.pathname.includes('/create');

  const [selectedItem, setSelectedItem] = useState(
    localStorage.getItem('selectedItem') || 'Home'
  );

  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Socket
  useEffect(() => {
    if (!userId) return;

    const handler = () => {
      socket.emit('updateChatSocketId', { userId });
    };

    socket.emit('joinUser', userId);
    socket.on('updateChatSocketId', handler);

    return () => {
      socket.emit('leaveUser', userId);
      socket.off('updateChatSocketId', handler);
    };
  }, [userId]);

  // Active tab
  useEffect(() => {
    let tab = 'Home';

    if (location.pathname.includes('/messages')) tab = 'Messages';
    else if (location.pathname.includes('/notifications')) tab = 'Notifications';
    else if (location.pathname.includes('/profile')) tab = 'Profile';
    else if (communityTab) tab = 'Community';

    setSelectedItem(tab);
    localStorage.setItem('selectedItem', tab);
  }, [location.pathname]);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      
      {/* Header */}
      <Header unreadCount={unreadCount} />

      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <div className="hidden lg:flex w-[260px]">
          <LeftSideBar
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            unreadNotifications={unreadCount}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">

          {/* ✅ SINGLE SCROLL CONTAINER */}
          <div className="h-full overflow-y-auto no-scrollbar px-2 sm:px-4 md:px-6">

            {/* ✅ FIX: PostUpload full width */}
            {isCreatePage ? (
              <div className="w-full max-w-full sm:max-w-2xl mx-auto">
                <Outlet />
              </div>
            ) : (
              <Outlet />
            )}

          </div>
        </div>

        {/* Right Sidebar */}
        {!communityTab && (
          <div className="hidden xl:flex w-[300px]">
            <RightSideBar />
          </div>
        )}

        {/* Mobile Right Sidebar */}
        {!communityTab && (
          <>
            <div
              className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ${
                showRightSidebar ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="flex justify-end p-2">
                <button onClick={() => setShowRightSidebar(false)}>✕</button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <RightSideBar isSlideOver hideFollowBtn />
              </div>
            </div>

            {showRightSidebar && (
              <div
                onClick={() => setShowRightSidebar(false)}
                className="fixed inset-0 bg-black/30 z-40"
              />
            )}

            <button
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="fixed bottom-24 right-4 z-50 p-3 bg-purple-600 text-white rounded-full shadow-lg xl:hidden"
            >
              {showRightSidebar ? '✕' : '☰'}
            </button>
          </>
        )}

      </div>

      {/* Bottom Nav */}
      <BottomNav
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
      />
    </div>
  );
};

export default HomeLayout;