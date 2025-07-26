import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import ProfileHeader from './ProfileHeader';
import FollowList from './FollowList';
import ProfilePosts from './ProfilePosts';
import { userService } from '@/services/userService';
import { socket } from '@/utils/Socket';
import { useAuthStore } from '@/appStore/AuthStore';
import { FaUsers } from 'react-icons/fa';
import clsx from 'clsx';


const ProfilePage: React.FC = () => {
  const { userId } = useParams();
  const { user: parentUser } = useAuthStore();
  const parentUserId = parentUser?._id;
  const queryClient = useQueryClient();
  const [showFollowList, setShowFollowList] = useState(false); // 🔁 Toggle state

  const { data: user, refetch } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => userService.getUserProfile(userId as string),
    enabled: !!userId,
  });

  const { data: followers, refetch: refetchFollowers } = useQuery({
    queryKey: ['followers', userId],
    queryFn: () => userService.getFollowers(userId as string),
    enabled: !!userId,
  });

  const { data: following, refetch: refetchFollowing } = useQuery({
    queryKey: ['following', userId],
    queryFn: () => userService.getFollowing(userId as string),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const handleFollowUpdate = () => {
      refetchFollowers();
      refetchFollowing();
      refetch();
    };

    const handlePostUpload = () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts', userId] });
    };

    socket.on('followSuccess', handleFollowUpdate);
    socket.on('unfollowSuccess', handleFollowUpdate);
    socket.on('postUpload', handlePostUpload);

    return () => {
      socket.off('followSuccess', handleFollowUpdate);
      socket.off('unfollowSuccess', handleFollowUpdate);
      socket.off('postUpload', handlePostUpload);
    };
  }, [queryClient, refetch, refetchFollowers, refetchFollowing, userId]);

  if (!userId) return <div>User ID not found</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Profile Header */}
      <ProfileHeader
        user={user}
        userId={userId}
        parentUserId={parentUserId || ''}
        refetch={refetch}
      />

  <div className="flex justify-center mt-4">
  <button
    onClick={() => setShowFollowList((prev) => !prev)}
    className={clsx(
      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow transition',
      showFollowList
        ? 'bg-slate-600 text-white'
        : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
    )}
  >
    <FaUsers className="w-4 h-4" />
    {showFollowList ? 'Hide Follow List' : 'Follow List'}
  </button>
</div>


      {showFollowList && (
        <div className="mt-6">
          <FollowList
            followers={followers || []}
            following={following || []}
            parentUserId={parentUserId || ''}
          />
        </div>
      )}

      {/* Posts */}
      <ProfilePosts userId={userId} />

      {/* Follow List (Visible only if toggled) */}
      
    </div>
  );
};

export default ProfilePage;
