import React, { createContext, useEffect, useState, useContext } from 'react';
import { socket } from '@/utils/Socket';
import { chatSocket } from '@/utils/chatSocket';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

import useMessageStore from '@/appStore/useMessageStore';
import useNotificationStore from '@/store/notificationStore';
import { useGroupStore } from '@/appStore/groupStore';

import { useAuthStore } from '@/appStore/AuthStore';

import { useGroups } from '@/hooks/group/useGroups';
import { useNavigate } from 'react-router-dom';

interface SocketContextType {
  unreadNotifications: number;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const queryClient = useQueryClient(); // ✅ Use React Query's main instance

  const navigate = useNavigate();

  const groups = useGroupStore((state) => state.groups);

  const { setGroups } = useGroupStore();


  const { user , logout} = useAuthStore();

  useGroups(user?._id);

    const handleLogout = () => {
      if (user?._id) socket.emit('logOut', user._id);
      logout('user');
      navigate('/');
    };

    useEffect(()=>{
          const handleBlockSuccess = (userId: string) => {
      console.log('🚫 User blocked successfully:', userId,user?._id);
     if(userId?.userId === user?._id) {
        toast.error('You have been blocked by an admin, contact support.');
      setTimeout(() => {
      
        handleLogout();
      },3000);
     }
    }

     socket.on("blockSuccess", handleBlockSuccess) 

     return () => {
       socket.off("blockSuccess", handleBlockSuccess);
     }
    })

  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      console.log('📩 New Notification:', notification);
      setUnreadNotifications((prev) => prev + 1);
    };


    const handleNewNotificationChat = (notification: any) => {
      console.log('📩 New Chat Notification:', notification);
      // toast.success(notification.message);
      useNotificationStore.getState().incrementUnreadCount();
      setUnreadNotifications((prev) => prev + 1);
    };

    chatSocket.on('newNotification', handleNewNotificationChat);
    socket.on('newNotification', handleNewNotification);
   


    const handleGroupMessage = ({ groupId }: { groupId: string }) => {
      const { activeGroupId, groups, incrementUnread } = useGroupStore.getState();

      const isGroupExists = groups.some((group) => group._id === groupId);
      const isActiveGroup = activeGroupId === groupId;

      console.log('📨 Group message:', groupId, 'isActiveGroup:', isActiveGroup);

      if (isGroupExists && !isActiveGroup) {
        incrementUnread(groupId);
      }

      queryClient.invalidateQueries({ queryKey: ['groups'] });
    };

    chatSocket.on('group-message', handleGroupMessage);

    return () => {
      socket.off('newNotification', handleNewNotification);
      chatSocket.off('newNotification', handleNewNotificationChat);
      chatSocket.off('group-message', handleGroupMessage);
    };
  }, );

  useEffect(() => {
    const handleMessage = (newMessage: any) => {
      const { currentlyOpenChatId, incrementUnreadCount } = useMessageStore.getState();
      console.log('📩 Direct Message:', newMessage);

      if (newMessage.chatId !== currentlyOpenChatId) {
        incrementUnreadCount(newMessage.chatId);
      }
    };

    socket.on('chatUpdated', handleMessage);
    return () => {
      socket.off('chatUpdated', handleMessage);
    };
  }, []);

  useEffect(() => {
    socket.onAny((event, ...args) => {
      console.log(`[📡 GlobalSocket] Event: ${event}`, args);
    });
  }, []);

  return (
    <SocketContext.Provider value={{ unreadNotifications, setUnreadNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
