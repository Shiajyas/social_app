
import { useEffect } from 'react';
import { chatSocket as socket } from '@/utils/chatSocket';
import { useGroupStore } from '@/appStore/groupStore';

export const useGroupSocket = () => {
  const { addGroup, updateGroup, removeGroup } = useGroupStore();

  useEffect(() => {
    socket.on('group-created', addGroup);
    socket.on('group-updated', updateGroup);
    socket.on('group-deleted', removeGroup);

    return () => {
      socket.off('group-created', addGroup);
      socket.off('group-updated', updateGroup);
      socket.off('group-deleted', removeGroup);
    };
  }, []);
};
