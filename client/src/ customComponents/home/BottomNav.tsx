import {
  Home,
  Search,
  MessageSquare,
  Bell,
  User,
  PlusCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '@/store/notificationStore';
import { useAuthStore } from '@/appStore/AuthStore';
import { useGroupStore } from '@/appStore/groupStore';
interface BottomNavProps {
  selectedItem: string;
  setSelectedItem: (item: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ selectedItem, setSelectedItem }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const groupUnreadCount = useGroupStore((state) => state.getTotalUnread());
  const menuItems = [
    { name: 'Home', icon: <Home className="w-6 h-6" />, path: '/home' },
    { name: 'Search', icon: <Search className="w-6 h-6" />, path: '/home/search' },
    {
      name: 'Community',
      icon: <Users className="w-6 h-6" />,
      path: '/home/community/*',
      badgeCount: groupUnreadCount,
    },
    {
      name: 'Create',
      icon: <PlusCircle className="w-6 h-6" />,
      path: `/home/create/${user?._id}`,
    },
    {
      name: 'Notifications',
      icon: <Bell className="w-6 h-6" />,
      path: '/home/notifications',
      badgeCount: unreadCount,
    },
    {
      name: 'Profile',
      icon: <User className="w-6 h-6" />,
      path: `/home/profile/${user?._id}`,
    },
  ];

  return (
    <>
      <div className="h-3 bg-transparent" />

      <div className="fixed bottom-0 pt-2 left-0 w-full bg-white dark:bg-gray-900 border-t dark:border-gray-700 shadow-md dark:shadow-lg lg:hidden flex justify-between px-4 py-3 z-50">
        {menuItems.map((item, index) => {
        const showBadge = (item.badgeCount ?? 0) > 0;


          return (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={`relative flex flex-col items-center transition-all
              ${
                selectedItem === item.name
                  ? 'text-primary dark:text-yellow-400 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-yellow-400'
              }`}
              onClick={() => {
                setSelectedItem(item.name);
                navigate(item.path);
              }}
            >
              {item.icon}
            {showBadge && (
  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[11px] font-bold rounded-full px-1.5 py-[1px] min-w-[20px] text-center leading-none">
    {item.badgeCount! > 99 ? '99+' : item.badgeCount}
  </span>
)}

            </Button>
          );
        })}
      </div>
    </>
  );
};

export default BottomNav;
