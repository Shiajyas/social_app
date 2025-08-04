import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/appStore/AuthStore';

type MenuItem = {
  id: number;
  title: string;
  icon: string;
  route: string;
};

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { id: 1, title: 'Dashboard', icon: 'fa fa-th', route: '/admin/dashboard' },
    { id: 2, title: 'Subscription Management', icon: 'fa fa-lock', route: '/admin/subscriptions' },
    { id: 3, title: 'Spams Management', icon: 'fa fa-ban', route: '/admin/spam' },
    { id: 4, title: 'Users Management', icon: 'fa fa-wrench', route: '/admin/users' },
    { id: 5, title: 'Role Management', icon: 'fa fa-user-shield', route: '/admin/roles' },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-gray-200 dark:bg-gray-800 rounded md:hidden"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
      >
        <i className="fa fa-bars text-xl text-black dark:text-white" />
      </button>

      {/* Sidebar */}
      <div
        className={`w-64 bg-gray-100 dark:bg-gray-900 text-black dark:text-white flex flex-col fixed md:relative h-screen z-40 transition-transform duration-300 ease-in-out 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/logo2.svg" alt="Logo" className="w-10 h-10 rounded-full" />
                     <span className="mt-4 text-3xl md:text-2xl font-semibold text-gray-800 dark:text-white animate-pulse">
       PingPod
      </span>
            </div>
            <i
              className="fa fa-times cursor-pointer md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.route;
            return (
              <div
                key={item.id}
                className={`flex items-center p-2 my-1 rounded cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
                onClick={() => {
                  navigate(item.route);
                  setIsSidebarOpen(false); // Close on mobile after navigation
                }}
              >
                <i className={`${item.icon} mr-3`} />
                <span>{item.title}</span>
              </div>
            );
          })}

          {/* Logout */}
          <div className="mt-6">
            <div
              className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"
              onClick={() => {
                logout('admin');
                navigate('/admin/login');
              }}
            >
              <i className="fa fa-power-off mr-3" />
              <span>Log out</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
