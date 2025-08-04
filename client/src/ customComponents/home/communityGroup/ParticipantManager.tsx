import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useUserAuth } from '@/hooks/useUserAuth';
import { socket } from '@/utils/Socket';
import { GroupFriendsListModal } from './FriendsListModal';
import { FaAddressBook } from 'react-icons/fa';

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

interface Props {
  groupId: string;
}

const AddParticipant: React.FC<Props> = ({ groupId }) => {
  const [participants, setParticipants] = useState<User[]>([]);
  const [showFriendsList, setShowFriendsList] = useState(false);

  const { user } = useUserAuth();
  const userId = user?._id;

  // Load current group participants

  const handleAddUser = (user: User) => {
    console.log(user,">>>>>")
    socket.emit('group:add-participant', { groupId, userId: user._id });
  };

  const handleRemove = (userId: string) => {
    socket.emit('group:remove-participant', { groupId, userId });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Manage Participants</h2>

      <Button onClick={() => setShowFriendsList(true)}> {<FaAddressBook/>} Add from Friends</Button>

      <GroupFriendsListModal
        isOpen={showFriendsList}
        groupId={groupId}
        onClose={() => setShowFriendsList(false)}
       
     
      />

      <ul className="space-y-2">
        {participants.map((user) => (
          <li key={user._id} className="flex justify-between items-center">
            <span>{user.username}</span>
            <Button size="sm" variant="destructive" onClick={() => handleRemove(user._id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
      {/* <ParticipantManager groupId={groupId} /> */}
    </div>
  );
};

export default AddParticipant
