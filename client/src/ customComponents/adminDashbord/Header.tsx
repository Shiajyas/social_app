import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

import { useAuthStore } from '@/appStore/AuthStore';
import { useReportStore } from '@/appStore/useReportStore';
import { adminReportService } from '@/services/adminReportService';
import { socket } from '@/utils/Socket';

import { UserCircle, ChevronDown, ChevronUp, AlertTriangle, Sun, Moon } from 'lucide-react';

type Report = {
  _id: string;
  postId: string;
  reporter: string;
  reason: string;
  createdAt: Date;
};

const Header = () => {
  const { admin, logout } = useAuthStore();
  const { reportCount, increment, setReportCount } = useReportStore();
  const queryClient = useQueryClient();

  // console.log(admin, 'admin');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const fetchInitialReportCount = async () => {
      try {
        const { count } = await adminReportService.getReportCount();
        setReportCount(count);
      } catch (err) {
        console.error('Failed to fetch report count:', err);
      }
    };

    fetchInitialReportCount();

    const updateOnlineCount = (count: number) => {
      if (typeof count === 'number') setOnlineCount(count);
    };

    // console.log("admin",admin);

    socket.emit('admin:join',admin?._id);

    const handleNewReport = (report: Report) => {
      queryClient.setQueryData<Report[]>(['reports', 1], (prev = []) => {
        if (prev.some((r) => r._id === report._id)) return prev;
        return [report, ...prev];
      });
      increment();
      // toast.info('📨 New report received');
    };

    socket.on('admin:updateOnlineCount', updateOnlineCount);
    socket.on('admin:newReport', handleNewReport);

    return () => {
      socket.off('admin:updateOnlineCount', updateOnlineCount);
      socket.off('admin:newReport', handleNewReport);
    };
  }, [queryClient, increment, setReportCount, admin]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-900 shadow px-4 py-3 flex flex-col md:flex-row justify-between items-center border-b dark:border-gray-700">
      <h1 className="text-lg md:text-xl font-bold text-black dark:text-white mb-2 md:mb-0">
        Admin Dashboard
      </h1>

      <div className="flex items-center space-x-6 relative">
        {/* Online Count */}
        <div className="flex items-center text-black dark:text-white gap-2">
          {/* <span className="relative">
            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 relative" />
          </span> */}
          {/* <UserCircle className="w-5 h-5" />
          <motion.span
            key={onlineCount}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="font-medium"
          >
            Online: {onlineCount}
          </motion.span> */}
        </div>

        {/* Reports Count */}
        <div className="flex items-center text-black dark:text-white gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <motion.span
            key={reportCount}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="font-medium"
          >
           
          </motion.span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:scale-105 transition"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Admin Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center cursor-pointer" onClick={toggleDropdown}>
            <span className="ml-2 text-sm md:text-base text-black dark:text-white">
              {admin?.userName}
            </span>
            {isDropdownOpen ? (
              <ChevronUp className="ml-2 text-black dark:text-white w-4 h-4" />
            ) : (
              <ChevronDown className="ml-2 text-black dark:text-white w-4 h-4" />
            )}
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10"
              >
                <ul>
                  <li>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => logout('admin')}
                      className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
