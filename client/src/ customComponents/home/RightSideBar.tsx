import React, { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { LoaderIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/appStore/AuthStore';
import { userService } from '@/services/userService';
import FollowBtn from '../FollowBtn';
import { IUser } from '@/types/userTypes';

interface RightSideBarProps {
  isSlideOver?: boolean;
  hideFollowBtn?: boolean; // new prop to hide Follow button
}

const RightSideBar: React.FC<RightSideBarProps> = ({ isSlideOver = false, hideFollowBtn = false }) => {
  const { user, isUserAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const isCommunityPage = location.pathname.includes('/community');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['suggestions', isUserAuthenticated],
    queryFn: async ({ pageParam = 1 }) => {
      if (!isUserAuthenticated) throw new Error('Token is null');
      return userService.getSuggestions(pageParam);
    },
    getNextPageParam: (lastPage: IUser[], allPages) =>
      lastPage.length > 0 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: !!isUserAuthenticated && !isCommunityPage,
  });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const handleNavigate = (userId: string) => navigate(`/home/profile/${userId}`);

  useEffect(() => {
    const handleRemoveFollowedUser = (event: CustomEvent) => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', isUserAuthenticated] });
    };
    window.addEventListener('removeFollowedUser', handleRemoveFollowedUser as EventListener);
    return () =>
      window.removeEventListener('removeFollowedUser', handleRemoveFollowedUser as EventListener);
  }, [queryClient, isUserAuthenticated]);

  if (isCommunityPage) return null;

  return (
    <div
      className={`flex flex-col bg-white dark:bg-gray-900 text-black dark:text-white ${
        isSlideOver
          ? 'flex-1 h-full w-full md:w-72 p-4 overflow-y-auto'
          : 'w-80 h-[calc(100vh-4rem)] border-l'
      }`}
    >
      {/* User Card */}
      {user && (
        <Card className="w-full p-4 mb-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleNavigate(user._id)}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.avatar} alt={user.username} />
                <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{user.username}</span>
                <span className="text-sm text-muted-foreground">{user.fullname}</span>
              </div>
            </div>
          </motion.div>
        </Card>
      )}

      {/* Suggestions Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 flex justify-center py-2 border-b dark:border-gray-700 shadow-sm">
        <h5 className="text-lg font-semibold text-center">Suggestions</h5>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto px-2 mt-2">
        {data?.pages?.length ? (
          data.pages.map((page, pageIndex) =>
            page.map((suggestedUser: IUser, index) => (
              <motion.div
                key={suggestedUser._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: (pageIndex * 5 + index) * 0.05 }}
              >
                <Card className="mb-3 rounded-lg p-4 transition-all hover:scale-105 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleNavigate(suggestedUser._id)}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={suggestedUser?.avatar} alt={suggestedUser?.username || 'User'} />
                        <AvatarFallback>
                          {suggestedUser?.username ? suggestedUser.username.slice(0, 2).toUpperCase() : '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{suggestedUser?.username || 'Unknown User'}</span>
                        <span className="text-sm text-muted-foreground">{suggestedUser?.fullname || 'No name provided'}</span>
                      </div>
                    </div>
                    {!hideFollowBtn && (
                      <FollowBtn
                        followingId={suggestedUser?._id}
                        isFollowing={suggestedUser?.isFollowing}
                        userId={user?._id || ''}
                      />
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )
        ) : (
          <p className="text-center mt-4 text-gray-500 dark:text-gray-400">No suggested users available.</p>
        )}

        {isFetchingNextPage && (
          <div className="flex justify-center my-4">
            <LoaderIcon className="w-8 h-8 animate-spin" />
          </div>
        )}

        <div ref={ref} className="h-10" />
      </div>
    </div>
  );
};

export default RightSideBar;
