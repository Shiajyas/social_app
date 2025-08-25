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
import { Input } from '@/components/ui/input'; // ✅ using your existing input component
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/appStore/AuthStore';
import { socket } from '@/utils/Socket';
import { toast } from 'react-toastify';
import { CheckCircle, RotateCcw, Search } from 'lucide-react';

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
  const [participants, setParticipants] = useState<User[] | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // ✅ search term
  const { user } = useAuthStore();
  const userId = user?._id;

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
    success ? toast.success(message || 'User invited successfully') : toast.error(message || 'Failed to invite user');
  };

  useEffect(() => {
    socket.emit('get-group-members', { groupId });

    const handleGroupMembers = (data: { groupId: string; members: User[] }) => {
      setParticipants(data.members);
    };

    socket.on('group-members', handleGroupMembers);
    socket.on('error', (err: { message: string }) => console.error('Socket error:', err.message));

    return () => {
      socket.off('group-members', handleGroupMembers);
      socket.off('error');
    };
  }, [groupId]);

  useEffect(() => {
    socket.on('group-member-added', (data: { userId: string, memberId: string }) => {
      setInviteStatusMap(prev => ({ ...prev, [data.memberId]: 'success' }));
      showInviteToast(true, 'User added successfully');
    });

    socket.on('error-in-addMember', (data: { message?: string, memberId: string }) => {
      let message = data?.message || 'Failed to invite user';
      if (typeof message === 'string') {
        const words = message.split(' ');
        if (words.length > 1) words.splice(1, 1);
        message = words.join(' ');
      }
      setInviteStatusMap(prev => ({ ...prev, [data.memberId]: 'error' }));
      showInviteToast(false, message);
    });

    return () => {
      socket.off('group-member-added');
      socket.off('error-in-addMember');
    };
  }, []);

  const allUsers: User[] = useMemo(() => {
    const userMap = new Map<string, User>();
    [...(followers || []), ...(following || [])].forEach((u) => userMap.set(u._id, u));

    const participantIds = new Set(participants?.map((p) => p._id) || []);
    return Array.from(userMap.values()).filter((u) => !participantIds.has(u._id));
  }, [followers, following, participants]);

  // ✅ Filter by search
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allUsers.filter(u => u.username.toLowerCase().includes(term));
  }, [searchTerm, allUsers]);

  const onSelectUser = (user: User) => {
    setInviteStatusMap((prev) => ({ ...prev, [user._id]: 'loading' }));
    socket.emit('add-group-member', { groupId, userId: user._id });
  };

  const getStatusIcon = (status: InviteStatus, user: User) => {
    if (status === 'success') return <CheckCircle className="text-green-500 w-5 h-5" />;
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

        {/* ✅ Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search friends..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="h-64 pr-2">
          {filteredUsers.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
              No friends found
            </p>
          )}
          <ul className="space-y-2">
            {filteredUsers.map((user) => {
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
