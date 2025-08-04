import React, { useEffect, useState } from 'react';
import { chatSocket as socket } from '@/utils/chatSocket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { socket as mainSocket } from '@/utils/Socket';


interface User {
  _id: string;
  username: string;
  avatar?: string;
  role?: 'admin' | 'member';
  joinedAt?: string;
}

interface Props {
  groupId: string;
  showTitle?: boolean;
  layout?: 'horizontal' | 'vertical';
}

const GroupParticipantsView: React.FC<Props> = ({ groupId, showTitle = true, layout = 'horizontal' }) => {
  const [participants, setParticipants] = useState<User[] | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useUserAuth();
  const navigate = useNavigate();

  const location = useLocation()

  let   last = location.pathname.split('/').pop();
// console.log(last, 'last 1');
   if(last === 'edit'){
    last = location.pathname.split('/')[3]
    // console.log(last, 'last 2');
   }
   const communityId = last

  console.log(communityId, 'communityId');

  useEffect(() => {
    // if (!groupId) return;

    socket.emit('get-group-members', { groupId : communityId });
    

    const handleGroupMembers = (data: { groupId: string; members: User[] }) => {
   
        setParticipants(data.members);
 
    };

    const handleError = (err: { message: string }) => {
      console.error('Socket error:', err.message);
    };

    socket.on('group-members', handleGroupMembers);
    socket.on('error', handleError);

    return () => {
      socket.off('group-members', handleGroupMembers);
      socket.off('error', handleError);
    };
  }, [groupId]); 


  useEffect(() => {
  

    const handleUpdate = (onlineUserIds: string[]) => {
      setOnlineUsers(onlineUserIds);
    };

    socket.emit('getOnlineUsers');
    socket.on('updateOnlineUsers', handleUpdate);
    mainSocket.on('updateOnlineUsers', handleUpdate);

    return () => {
      socket.off('updateOnlineUsers', handleUpdate);
      mainSocket.off('updateOnlineUsers', handleUpdate);
    };
  }, []);

useEffect(() => {
  const handleMemberRemoved = ({ groupId, memberId }: { groupId: string; memberId: string }) => {
    setParticipants((prev) => prev?.filter((p) => p._id !== memberId));
 
  };

  const handleMemberAdded = ({ groupId, memberId }: { groupId: string; memberId: string }) => {
    socket.emit('get-group-members', { groupId });
  };

  socket.off('group-member-removed', handleMemberRemoved); // Remove if already registered
  socket.off('group-member-added', handleMemberAdded);

  socket.on('group-member-removed', handleMemberRemoved);
  socket.on('group-member-added', handleMemberAdded);

  return () => {
    socket.off('group-member-removed', handleMemberRemoved);
    socket.off('group-member-added', handleMemberAdded);
  };
}, [groupId]);

  const handleRemove = (memberId: string) => {
       toast.success('Member removed successfully!');
    socket.emit('remove-group-member', { groupId, memberId });
  };

 const renderUser = (participant: User) => {
  const isCurrentUserAdmin =
    participants?.find((p) => p._id === user?.user?._id)?.role === 'admin';
  const isNotSelf = participant._id !== user?.user?._id;

  const isOnline = onlineUsers.includes(participant._id);

  return (
    <div
      key={participant._id}
      className={`relative rounded-md p-2 group transition
        ${layout === 'horizontal'
          ? 'min-w-[6rem] max-w-[6rem] flex flex-col items-center text-center'
          : 'w-full flex items-center gap-3'}
        ${participant._id === user?.user?._id ? 'bg-muted' : ''}
      `}
    >
      {/* Avatar with Online Dot */}
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={
              participant.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                participant.username
              )}&background=random`
            }
            alt={participant.username}
          />
          <AvatarFallback>
            {participant.username?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Green dot for online users */}
        {isOnline && (
          <span className="absolute -bottom-0 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white animate-pulse"></span>
        )}
      </div>

      {/* Username + Role */}
      <span
        title={participant.username}
        className={`text-sm mt-1 truncate ${layout === 'horizontal' ? 'w-full' : ''}`}
      >
        {participant.username}
        {participant.role === 'admin' && (
          <span className="ml-1 text-xs text-blue-500 font-semibold">(Admin)</span>
        )}
      </span>

      {/* 3-dot dropdown */}
      <div className="absolute top-1 right-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white">
            <DropdownMenuItem onClick={() => navigate(`/home/profile/${participant._id}`)}>
              View Profile
            </DropdownMenuItem>
            {isCurrentUserAdmin && isNotSelf && (
              <DropdownMenuItem
                onClick={() => handleRemove(participant._id)}
                className="text-red-500"
              >
                Remove from Group
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};


  return (
    <div className="p-3">
      {showTitle && <h3 className="text-base font-semibold mb-2">Group Members</h3>}

      {participants === null ? (
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-14 rounded-full" />
          ))}
        </div>
      ) : (
      <div
  className={`${
    layout === 'horizontal'
      ? 'flex gap-4 overflow-x-auto no-scrollbar'
      : 'flex flex-col gap-2 overflow-y-auto no-scrollbar max-h-[300px] pr-1'
  }`}
  style={{ scrollbarWidth: 'none' }}
>
    <style>{`::-webkit-scrollbar { display: none; }`}</style>

  {participants.map(renderUser)}
</div>

      )}
    </div>
  );
};

export default GroupParticipantsView;
