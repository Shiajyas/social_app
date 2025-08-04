import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { postService } from '@/services/postService';
import { Hash } from 'lucide-react';
import { motion } from 'framer-motion';

// Define the post interface
interface IPost {
  _id: string;
  description?: string;
  mediaUrls?: string[];
  createdAt: string;
  userId?: {
    username: string;
  };
}

// Utility to check if a URL is a video
const isVideo = (url: string): boolean => /\.(mp4|webm|ogg)$/i.test(url);

export const HashtagSearchResults: React.FC = () => {
  let { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  tag = tag?.replace(/^:/, '').trim();

  useEffect(() => {
    console.log('HashtagSearchResults rendered for tag:', tag);
  }, [tag]);

  const { data, isLoading, isError } = useQuery<{ posts: IPost[] }>({
    queryKey: ['hashtagPosts', tag],
    queryFn: async () => await postService.getPostsByHashtag(tag || ''),
    enabled: !!tag,
  });

  console.log(data.posts[0], 'userId');
  

  if (isLoading) return <p className="p-4">Loading...</p>;
  if (isError) return <p className="p-4 text-red-500">Error loading posts.</p>;
  if (!data || data.posts.length === 0)
    return <p className="p-4">No posts found for #{tag}</p>;

  return (
    <div className="p-4">
      {/* Modern Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center items-center gap-2 mb-6"
      >
        <Hash className="text-blue-600 w-6 h-6" />
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          Posts tagged with #{tag}
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {data.posts.map((post) => {
          const mediaUrl = post.mediaUrls?.[0] || '/placeholder.jpg';
          const video = isVideo(mediaUrl);
          const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
            addSuffix: true,
          });
          const ownerName = post?.userId?.username || 'Unknown';

          return (
            <div
              key={post._id}
              onClick={() => navigate(`/home/post/${post._id}`)}
              className="relative group overflow-hidden rounded-xl shadow hover:scale-[1.02] transition cursor-pointer bg-black"
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

              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-3 transition text-white text-sm">
                <div className="text-xs text-gray-300 mb-1">
                  {ownerName} • {timeAgo}
                </div>
                <div className="line-clamp-2">{post.description || 'No description'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
