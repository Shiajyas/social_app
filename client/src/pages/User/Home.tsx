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
import { chatSocket } from '@/utils/chatSocket';



const HomeLayout: React.FC = () => {
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const userId = user?._id || null;
  const location = useLocation();

  let commuityTab = false;
  if (location.pathname.includes('/community')) commuityTab = true;

  // ✅ Load selectedItem from localStorage or default to "Home"
  const [selectedItem, setSelectedItem] = useState(localStorage.getItem('selectedItem') || 'Home');

  useEffect(() => {
    if (!userId) return;
    socket.emit('joinUser', userId);
    chatSocket.emit('updateChatSocketId', { userId: user?._id });
    return () => {
      socket.emit('leaveUser', userId);
      chatSocket.disconnect();
    };
  }, [userId]);

  // ✅ Update selectedItem when the route changes & save to localStorage
  useEffect(() => {
    let newSelectedItem = 'Home'; // Default to Home
    if (location.pathname.includes('/messages')) newSelectedItem = 'Messages';
    else if (location.pathname.includes('/notifications')) newSelectedItem = 'Notifications';
    else if (location.pathname.includes('/profile')) newSelectedItem = 'Profile';
    else if (location.pathname.includes('/community')) newSelectedItem = 'Community';

    setSelectedItem(newSelectedItem);
    localStorage.setItem('selectedItem', newSelectedItem);
  }, [location.pathname]);

  // ✅ Determine if current route needs full height (chat/community)
  const needsFullHeight = location.pathname.includes('/messages') || 
                          location.pathname.includes('/community');

  return (
    <div className="w-full h-screen flex flex-col border overflow-hidden">
      <Header unreadCount={unreadCount} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Hidden on small screens */}
        <div className="hidden lg:flex w-[260px] h-full">
          <LeftSideBar
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            unreadNotifications={unreadCount}
          />
        </div>

        {/* Main Content - Full Width on small screens */}
        <Card className="flex-1 w-full p-0 flex flex-col overflow-hidden border">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* ✅ Show Status only on Home Page */}
            {selectedItem === 'Home' && (
              <div className="flex items-center justify-between">
                {/* <h2 className="text-2xl font-bold">Home</h2> */}
              </div>
            )}

            {/* ✅ Conditional rendering based on route type */}
            {needsFullHeight ? (
              // For chats and community - direct outlet without ScrollArea
              <div className="flex-1 overflow-hidden mt-2">
                <Outlet />
              </div>
            ) : (
              // For other routes - use ScrollArea
              <ScrollArea className="flex-1 mt-2 overflow-y-auto m-0">
                <Outlet />
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Right Sidebar - Hidden on small screens */}
       {!commuityTab && <RightSideBar />}
      </div>

      <BottomNav selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
    </div>
  );
};

export default HomeLayout;