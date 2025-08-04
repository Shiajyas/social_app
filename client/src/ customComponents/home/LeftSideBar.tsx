import React from 'react';
import {
  Home,
  MessageSquare,
  Bell,
  PlusCircle,
  User,
  Search,
  LogOut,
  Users2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/appStore/AuthStore';
import { socket } from '@/utils/Socket';
import useMessageStore from '@/appStore/useMessageStore';
import { useGroupStore } from '@/appStore/groupStore';

interface LeftSideBarProps {
  selectedItem: string;
  setSelectedItem: (item: string) => void;
  unreadNotifications: number;
}

const LeftSideBar: React.FC<LeftSideBarProps> = ({
  selectedItem,
  setSelectedItem,
  unreadNotifications,
}) => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const unreadCounts = useMessageStore((state) => state.unreadCounts);
  const totalUnreadMessages = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);
  const totalGroupUnread = useGroupStore((state) => state.getTotalUnread());

  const menuItems = [
    { name: 'Home', icon: <Home />, path: '/home' },
    {
      name: 'Messages',
      icon: <MessageSquare />,
      path: '/home/messages',
      badgeCount: totalUnreadMessages,
    },
    { name: 'Search', icon: <Search />, path: '/home/search' },
    {
      name: 'Notifications',
      icon: <Bell />,
      path: '/home/notifications',
      badgeCount: unreadNotifications,
    },
    {
      name: 'Community',
      icon: <Users2 />,
      path: '/home/community/*',
      badgeCount: totalGroupUnread,
    },
    {
      name: 'Create',
      icon: <PlusCircle />,
      path: `/home/create/${user?._id}`,
    },
    {
      name: 'Profile',
      icon: <User />,
      path: `/home/profile/${user?._id}`,
    },
  ];

  const handleMenuClick = (item: any) => {
    setSelectedItem(item.name);
    navigate(item.path);
  };

  const handleLogout = () => {
    if (user?._id) socket.emit('logOut', user._id);
    logout('user');
    navigate('/');
  };

  return (
    <Card className="h-full w-full bg-background shadow-lg p-4 rounded-2xl flex flex-col">
      <CardContent className="flex flex-col items-center space-y-6 flex-grow">
        <div className="w-full flex justify-center">
          <Avatar className="w-20 h-20 border">
            <AvatarImage src="/logo2.svg" alt="Logo" />
            <AvatarFallback>Logo</AvatarFallback>
          </Avatar>
        </div>

        <div className="w-full space-y-2 mt-6 flex-grow">
          {menuItems.map((item, index) => {
        const hasBadge = typeof item.badgeCount === 'number' && item.badgeCount > 0;

            return (
              <Button
                key={index}
                variant="ghost"
                className={`relative flex items-center w-full justify-start px-4 py-3 text-lg font-medium rounded-lg transition-all ${
                  selectedItem === item.name
                    ? 'bg-accent text-primary font-bold'
                    : 'hover:bg-accent text-muted-foreground'
                }`}
                onClick={() => handleMenuClick(item)}
              >
                <div className="relative flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                  {hasBadge && (
                    <Badge className="ml-auto bg-red-600 text-white text-[11px] px-2 py-[2px] rounded-full shadow font-semibold leading-none flex items-center justify-center min-w-[20px] h-[18px]">
                      {item.badgeCount > 99 ? '99+' : item.badgeCount }
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>

      <div className="p-4">
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-2 py-3"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </Card>
  );
};

export default LeftSideBar;
