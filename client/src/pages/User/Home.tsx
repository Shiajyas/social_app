import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  let communityTab = location.pathname.includes('/community');

  // Selected tab
  const [selectedItem, setSelectedItem] = useState(localStorage.getItem('selectedItem') || 'Home');

  // Toggle right sidebar on small screens
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const updateChatSocketIdHandler = () => {
      socket.emit('updateChatSocketId', { userId: user?._id });
    };

    socket.emit('joinUser', userId);
    socket.on('updateChatSocketId', updateChatSocketIdHandler);

    return () => {
      socket.emit('leaveUser', userId);
      socket.off('updateChatSocketId', updateChatSocketIdHandler);
    };
  }, [userId]);

  useEffect(() => {
    let newSelectedItem = 'Home';
    if (location.pathname.includes('/messages')) newSelectedItem = 'Messages';
    else if (location.pathname.includes('/notifications')) newSelectedItem = 'Notifications';
    else if (location.pathname.includes('/profile')) newSelectedItem = 'Profile';
    else if (location.pathname.includes('/community')) newSelectedItem = 'Community';

    setSelectedItem(newSelectedItem);
    localStorage.setItem('selectedItem', newSelectedItem);
  }, [location.pathname]);

  const needsFullHeight = location.pathname.includes('/messages') || communityTab;

  return (
<div className="w-full h-screen flex flex-col">
  <Header unreadCount={unreadCount} />

  <div className="flex flex-1 relative overflow-hidden">
    {/* Left Sidebar */}
    <div className="hidden lg:flex w-[260px] h-full">
      <LeftSideBar
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        unreadNotifications={unreadCount}
      />
    </div>

    {/* Main Content */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {needsFullHeight ? (
        <div className="flex-1 overflow-hidden mt-2">
          <Outlet />
        </div>
      ) : (
        <ScrollArea className="flex-1 mt-2 overflow-y-auto m-0">
          <Outlet />
        </ScrollArea>
      )}
    </div>

    {/* Right Sidebar for XL screens */}
    {!communityTab && (
      <div className="hidden xl:flex w-[300px] h-full">
        <RightSideBar />
      </div>
    )}

    {/* Slide-over Right Sidebar for small/medium screens */}
{/* Slide-over Right Sidebar for small/medium screens */}
{/* Slide-over Right Sidebar for small/medium screens */}
{!communityTab && (
  <>
    <div
      className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 flex flex-col ${
        showRightSidebar ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Close button (instead of hamburger) */}
      <div className="flex justify-end p-2">
        <button
          onClick={() => setShowRightSidebar(false)}
          className="text-gray-600 dark:text-gray-300 hover:text-purple-600"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <RightSideBar isSlideOver hideFollowBtn /> {/* hide Follow btn */}
      </div>
    </div>

    {/* Overlay */}
    {showRightSidebar && (
      <div
        onClick={() => setShowRightSidebar(false)}
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
      />
    )}

    {/* Toggle button (hamburger) */}
    <button
      onClick={() => setShowRightSidebar(!showRightSidebar)}
      className="fixed bottom-24 right-4 z-50 p-3 bg-purple-600 text-white rounded-full shadow-lg xl:hidden"
    >
      {showRightSidebar ? '✕' : '☰'}
    </button>
  </>
)}


  </div>

  <BottomNav selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
</div>

  );
};

export default HomeLayout;