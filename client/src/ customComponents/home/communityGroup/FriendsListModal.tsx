import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/appStore/AuthStore';
import { chatSocket as socket } from '@/utils/chatSocket';
import { toast } from 'react-toastify';
import { CheckCircle, RotateCcw } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

interface Props {
  isOpen: boolean;
  groupId: string;
  onClose: () => void;
}

type InviteStatus = 'idle' | 'loading' | 'success' | 'error';

export const GroupFriendsListModal: React.FC<Props> = ({ isOpen, onClose, groupId }) => {
  const [inviteStatusMap, setInviteStatusMap] = useState<Record<string, InviteStatus>>({});
  const { user } = useAuthStore();
  const userId = user?._id;

  console.log('inviteStatusMap:', inviteStatusMap);
  

  const { data: followers } = useQuery({
    queryKey: ['followers', userId],
    queryFn: () => userService.getFollowers(userId),
    enabled: !!userId,
  });

  const { data: following } = useQuery({
    queryKey: ['following', userId],
    queryFn: () => userService.getFollowing(userId),
    enabled: !!userId,
  });

  const showInviteToast = (success: boolean, message: string) => {
    if (success) {
      toast.success(message || 'User invited successfully');
    } else {
      toast.error(message || 'Failed to invite user');
    }
  };

  // ✅ Handle socket response
 useEffect(() => {
  const handleMemberAdded = (data: { userId: string, memberId: string, groupId: string }) => {
    setInviteStatusMap(prev => ({
      ...prev,
      [data?.memberId]: 'success',
    }));
    showInviteToast(true, 'User added successfully');
  };

  const handleAddMemberError = (data: { userId: string; message?: string ,memberId: string}) => {
    let message = data?.message || 'Failed to invite user';
    if (typeof message === 'string') {
      const words = message.split(' ');
      if (words.length > 1) {
        words.splice(1, 1); // remove 1st index word
        message = words.join(' ');
      }
    }

    console.log(data,);
    

    setInviteStatusMap(prev => ({
      ...prev,
      [data?.memberId]: 'error',
    }));
    showInviteToast(false, message);
  };

  socket.on('group-member-added', handleMemberAdded);
  socket.on('error-in-addMember', handleAddMemberError);

  return () => {
    socket.off('group-member-added', handleMemberAdded);
    socket.off('error-in-addMember', handleAddMemberError);
  };
}, []);


  const allUsers: User[] = useMemo(() => {
    const userMap = new Map<string, User>();
    [...(followers || []), ...(following || [])].forEach((user) => {
      userMap.set(user._id, user);
    });
    return Array.from(userMap.values());
  }, [followers, following]);

  const onSelectUser = (user: User) => {
    setInviteStatusMap((prev) => ({ ...prev, [user._id]: 'loading' }));
    socket.emit('add-group-member', { groupId, userId: user._id });
  };

  const getStatusIcon = (status: InviteStatus, user: User) => {
    if (status === 'success') {
      return <CheckCircle className="text-green-500 w-5 h-5" />;
    }
    if (status === 'error') {
      return (
        <button onClick={() => onSelectUser(user)} className="text-red-500 hover:text-red-600">
          <RotateCcw className="w-5 h-5" />
        </button>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Select a Friend</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-64 pr-2">
          {allUsers.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
              No friends found
            </p>
          )}
          <ul className="space-y-2">
            {allUsers.map((user) => {
              const status = inviteStatusMap[user._id] || 'idle';
              return (
                <li
                  key={user._id}
                  className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{user.username}</span>
                  </div>
                  {status === 'idle' || status === 'loading' ? (
                    <Button
                      onClick={() => onSelectUser(user)}
                      size="sm"
                      className="text-sm"
                      disabled={status === 'loading'}
                    >
                      {status === 'loading' ? 'Adding...' : 'Add'}
                    </Button>
                  ) : (
                    getStatusIcon(status, user)
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
