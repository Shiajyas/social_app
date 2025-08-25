import { useMutation, useQueryClient, useInfiniteQuery, useQuery, keepPreviousData } from '@tanstack/react-query';
import { postService } from '../services/postService';
import { imageUpload } from '../features/imageUpload';
import { socket } from '@/utils/Socket';

//  Fetch Infinite Posts (Fixed Query Key & Pagination)
export const useGetPosts = (token: string) => {
  return useInfiniteQuery({
    queryKey: ['posts', token],
    queryFn: async ({ pageParam = 1 }) => {
      const { posts, nextPage } = await postService.getPosts(pageParam as number, 10);

      return {
        posts,
        nextPage,
      }; // ✅ Always return an object
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage?.posts?.length > 0 ? pages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30000,
  });
};


// ✅ Create Post (Fixed Cache Update)
export const useUploadPost = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, FormData>({
    mutationFn: async (formData: FormData): Promise<any> => {
      return postService.createPost(formData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => {
      alert('Upload failed!');
    },
  });
};
export const useGetPostDetails = (postId?: string) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required');
      return postService.getPost(postId);
    },
    enabled: !!postId,
    staleTime: 60 * 1000,        // data fresh for 1 min
    placeholderData: keepPreviousData,  // ✅ v5 way to keep old data
    retry: 1,
  });
};

//  Update Post (Fixed Cache Update)
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { formData: FormData; postId: string }>({
    mutationFn: async ({ formData, postId }): Promise<any> => {
      return postService.updatePost(postId, formData); // Sending FormData directly
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => {
      alert('Update failed!');
    },
  });
};

// Delete Post (Fixed Cache Update)
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, { postId: string; auth: any }>({
    mutationFn: async ({ postId, auth }: { postId: string; auth: any }) => {
      await postService.deletePost(postId);

      //  Correct cache update
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      return postId;
    },
  });
};

//  Optimized Like Post Hook
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { postId: string; userId: string }>({
    mutationFn: async ({ postId }) => postService.likePost(postId),

    onMutate: async ({ postId, userId }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const previousData = queryClient.getQueryData(['posts']);

      queryClient.setQueryData(['posts'], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) =>
              post._id === postId
                ? {
                    ...post,
                    likes: [
                      ...(Array.isArray(post?.likes) ? post.likes : []),
                      userId,
                    ],
                  }
                : post
            ),
          })),
        };
      });

      socket.emit('like_post', { userId, postId, type: 'like' });

      return { previousData };
    },

    onError: (_error, _variables, context: any) => {
      queryClient.setQueryData(['posts'], context?.previousData);
    },
  });
};


//  Optimized Unlike Post Hook
export const useUnlikePost = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { postId: string; userId: string }>({
    mutationFn: async ({ postId }) => postService.unLikePost(postId),

    onMutate: async ({ postId, userId }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const previousData = queryClient.getQueryData(['posts']);

      queryClient.setQueryData(['posts'], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) =>
              post._id === postId
                ? { ...post, likes: post.likes.filter((id) => id !== userId) }
                : post,
            ),
          })),
        };
      });

      // Emit socket event for real-time update
      socket.emit('like_post', { userId, postId, type: 'unlike' });

      return { previousData };
    },

    onError: (_error, _variables, context: any) => {
      queryClient.setQueryData(['posts'], context?.previousData);
    },
  });
};
