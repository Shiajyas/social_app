import { useEffect, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { searchService } from '@/services/searchService';
import { debounce } from 'lodash';
import { IUser } from '@/types/userTypes';
import { IPost } from '@/types/postTypes';
import { ISearchResult } from '@/types/searchTypes';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '@/appStore/searchStore';
import { userService } from '@/services/userService';
import { postService } from '@/services/postService';
import FollowBtn from '@/ customComponents/FollowBtn'; // ✅ fixed import
import { useAuthStore } from '@/appStore/AuthStore';

interface SearchSectionProps {
  hideInput?: boolean;
}

const isVideo = (url: string): boolean => /\.(mp4|webm|ogg)$/i.test(url);

export const SearchSection: React.FC<SearchSectionProps> = ({ hideInput = false }) => {
  const { query, setQuery } = useSearchStore();
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const { user: currentUser } = useAuthStore(); // ✅ current user
  const navigate = useNavigate();

  const debouncedSetQuery = useCallback(
    debounce((val: string) => {
      setDebouncedQuery(val);
    }, 300),
    [],
  );

  useEffect(() => {
    debouncedSetQuery(query);
    return () => debouncedSetQuery.cancel();
  }, [query, debouncedSetQuery]);

  const {
    data: searchData,
    isLoading: isSearchLoading,
    isFetching: isSearchFetching,
    isError: isSearchError,
    error: searchError,
  } = useQuery<ISearchResult>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchService.searchAll(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: sampleUsers,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useQuery<IUser[]>({
    queryKey: ['sampleUsers'],
    queryFn: () => userService.getSuggestions(),
    enabled: debouncedQuery.trim().length === 0,
    staleTime: 5 * 60 * 1000,
  });
  
const {
  data: samplePosts,
  isLoading: isPostLoading,
  isError: isPostError,
} = useQuery<{ posts: IPost[]; nextPage: any; }>({
  queryKey: ['samplePosts'],
  queryFn: () => postService.getPosts(),
  enabled: debouncedQuery.trim().length === 0,
  staleTime: 5 * 60 * 1000,
});

  const handleUserClick = useCallback(
    (userId: string) => {
      navigate(`/home/profile/${userId}`);
    },
    [navigate],
  );

  const users = debouncedQuery.trim()
    ? searchData?.users ?? []
    : sampleUsers?.slice(0, 4) ?? [];

  const posts = debouncedQuery.trim()
    ? searchData?.posts ?? []
    : samplePosts ?? [];

  const loading = debouncedQuery.trim()
    ? isSearchLoading || isSearchFetching
    : isUserLoading || isPostLoading;

  const error = debouncedQuery.trim()
    ? searchError
    : isUserError || isPostError
    ? new Error('Sample data fetch failed')
    : null;

  return (
    <div className="p-4 bg-white dark:bg-gray-900 text-black dark:text-white rounded shadow-md border border-gray-200 dark:border-gray-700 max-w-full">
      {!hideInput && (
        <Input
          placeholder="Search users or posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-4"
        />
      )}

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {error && (
        <p className="text-sm text-red-500">
          Error: {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      )}

      {!loading && !error && (
        <>
          {users.length === 0 && posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-8">
              <img src="/image.png" alt="No results" className="w-48 h-48 object-contain mb-3" />
              <p className="text-gray-600 text-sm">No users or posts found.</p>
            </div>
          ) : (
            <>
              {users.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-lg text-gray-900 dark:text-white">
                    Users
                  </h4>
                  <div className="space-y-2">
                    {users.map((user: IUser) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm"
                      >
                        <div
                          onClick={() => handleUserClick(user._id)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-offset-2 ring-blue-500/20"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              @{user.username}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              View Profile
                            </span>
                          </div>
                        </div>

                        <FollowBtn
                          userId={currentUser?._id || ''}
                          followingId={user._id}
                          isFollowing={(user.followers?? []).includes(currentUser?._id || '')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {posts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Posts</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {posts.map((post: IPost) => {
                      const mediaUrl = post.mediaUrls?.[0] || '/placeholder.jpg';
                      const video = isVideo(mediaUrl);

                      return (
                        <div
                          key={post._id}
                          onClick={() => navigate(`/home/post/${post._id}`)}
                          className="relative group overflow-hidden rounded shadow hover:scale-[1.02] transition cursor-pointer bg-black"
                        >
                          {video ? (
                            <video
                              src={mediaUrl}
                              className="h-40 w-full object-cover"
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              poster="/video-poster.jpg"
                            />
                          ) : (
                            <img
                              src={mediaUrl}
                              alt="Post media"
                              className="h-40 w-full object-cover"
                            />
                          )}

                          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-sm p-2 text-center">
                            {post.description?.slice(0, 80) || 'No description'}
                          </div>

                          {video && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M4.5 3.5v13l11-6.5-11-6.5z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
