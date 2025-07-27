import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/searchService';
import { IPost } from '@/types/postTypes';

const isVideo = (url: string): boolean => /\.(mp4|webm|ogg)$/i.test(url);

export const HashtagSearchResults: React.FC = () => {
  const { tag } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<IPost[]>({
    queryKey: ['hashtagPosts', tag],
    queryFn: async () => await searchService.getPostsByHashtag(tag || ''),
    enabled: !!tag,
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading posts.</p>;
  if (!data || data.length === 0) return <p>No posts found for #{tag}</p>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Posts with #{tag}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {data.map((post) => {
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
