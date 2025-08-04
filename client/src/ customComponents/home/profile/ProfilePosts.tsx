import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  List as ListIcon,
  Bookmark as BookmarkIcon,
  Grid as GridIcon,
} from 'lucide-react';
import { useAuthStore } from '@/appStore/AuthStore';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

interface ProfilePostsProps {
  userId: string;
}

type SortOption = 'newest' | 'oldest' | 'mostLiked';

const ProfilePosts: React.FC<ProfilePostsProps> = ({ userId }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video'>('all');
  const [activeTab, setActiveTab] = useState<'myPosts' | 'savedPosts'>('myPosts');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const currentUserId = user?._id;

  const { data: mediaPosts, isLoading: isLoadingMedia } = useQuery({
    queryKey: ['userMediaPosts', userId],
    queryFn: () => userService.getUserMediaPosts(userId),
  });

  const { data: savedPosts, isLoading: isLoadingSaved } = useQuery({
    queryKey: ['userSavedPosts', userId],
    queryFn: () => userService.getUserSavedPosts(userId),
    enabled: userId === currentUserId,
  });

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

  const isImage = (url: string) => /\.(jpeg|jpg|png|webp)$/i.test(url);
  const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

  const filteredPosts = (posts: any) => {
    if (!posts) return [];

    const data = Array.isArray(posts.posts) ? posts.posts : posts;
    if (!Array.isArray(data)) return [];

    const filtered = data.filter((post) => {
      const mediaUrl = Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : post.mediaUrls;
      const isOwner = post.userId === currentUserId;
      const isFollower = followers?.some((f: any) => f._id === currentUserId);
      const isFollowing = following?.some((f: any) => f._id === post.userId);
      const hasAccess = isOwner || isFollower || isFollowing;

      if (activeTab !== 'savedPosts' && !hasAccess && post.visibility === 'private') {
        return false;
      }

      if (selectedType === 'image') return isImage(mediaUrl);
      if (selectedType === 'video') return isVideo(mediaUrl);
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'mostLiked':
          return (b.likes?.length || 0) - (a.likes?.length || 0);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  const currentPosts =
    activeTab === 'myPosts' ? mediaPosts : currentUserId === userId ? savedPosts : [];

  const isLoading = activeTab === 'myPosts' ? isLoadingMedia : isLoadingSaved;

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-6">
        {['myPosts', 'savedPosts'].map((tab) => {
          if (tab === 'savedPosts' && userId !== currentUserId) return null;
          const label = tab === 'myPosts' ? 'My Posts' : 'Saved Posts';
          const Icon = tab === 'myPosts' ? GridIcon : BookmarkIcon;

          return (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab as 'myPosts' | 'savedPosts')}
              className={clsx(
                'flex items-center gap-2 px-5 py-2 rounded-full transition-colors',
                activeTab === tab && 'bg-slate-600 text-white shadow'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Button>
          );
        })}
      </div>

      {/* Filter & Sort */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {['all', 'image', 'video'].map((type) => {
          const Icon = type === 'image' ? ImageIcon : type === 'video' ? VideoIcon : ListIcon;
          return (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              onClick={() => setSelectedType(type as 'all' | 'image' | 'video')}
              className={clsx(
                'flex items-center gap-2 px-4 rounded-full',
                selectedType === type && 'bg-slate-600 text-white shadow'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="capitalize">{type}</span>
            </Button>
          );
        })}

        {(['newest', 'oldest', 'mostLiked'] as SortOption[]).map((option) => (
          <Button
            key={option}
            onClick={() => setSortBy(option)}
            className={clsx(
              'text-xs px-3 py-1 rounded-full border',
              sortBy === option
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100'
            )}
          >
            {option === 'mostLiked' ? 'Most Liked' : option}
          </Button>
        ))}
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredPosts(currentPosts)?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredPosts(currentPosts).map((post) => {
            const mediaUrl = Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : post.mediaUrls;
            const showImage = isImage(mediaUrl);
            return (
              <div
                key={post._id}
                onClick={() => navigate(`/home/post/${post._id}`)}
                className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 shadow-sm"
              >
                {showImage ? (
                  <img
                    src={mediaUrl}
                    alt="Media"
                    className="object-cover w-full h-40 sm:h-48"
                  />
                ) : (
                  <video
                    className="object-cover w-full h-40 sm:h-48"
                    src={mediaUrl}
                    controls={false}
                    muted
                    loop
                    autoPlay
                  />
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-sm font-semibold px-2 text-center">
                  <p className="mb-1 truncate w-full">
                    {post.description?.slice(0, 50) || 'View Post'}
                  </p>
                  <p
                    className="text-xs text-gray-200"
                    title={
                      post.updatedAt && post.updatedAt !== post.createdAt
                        ? `Created: ${new Date(post.createdAt).toLocaleString()}\nModified: ${new Date(
                            post.updatedAt,
                          ).toLocaleString()}`
                        : `Sent: ${new Date(post.createdAt).toLocaleString()}`
                    }
                  >
                    {post.likes?.length || 0} Likes •{' '}
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    {post.updatedAt && post.updatedAt !== post.createdAt && ' (edited)'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-6">
          No {selectedType} {activeTab === 'savedPosts' ? 'saved' : 'uploaded'} posts found
        </p>
      )}
    </div>
  );
};

export default ProfilePosts;