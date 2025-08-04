import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MediaPreview from '@/ customComponents/common/MediaPreview';
import MediaCapture from '@/ customComponents/common/MediaCapture';
import { socket } from '@/utils/Socket';
import { useUpdatePost, useGetPostDetails } from '@/hooks/usePost';
import { useQueryClient } from '@tanstack/react-query';
import { postService } from '@/services/postService';
import axios from 'axios';
import { log } from 'console';
import { MoveLeftIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUserAuth } from '@/hooks/useUserAuth';
import { MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";



const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: post, isLoading, error } = useGetPostDetails(postId!);

  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [isToxic, setIsToxic] = useState<boolean>(false);
  const [isTagging, setIsTagging] = useState<boolean>(false);

  const {user} = useUserAuth();
  const userId = user?._id || '';


  const { mutate: updatePost, status } = useUpdatePost();

  useEffect(() => {
    if (post) {
      setCaption(post.post.title || '');
      setDescription(post.post.description || '');
      setPreview(post.post.mediaUrls?.[0] || null);
      setGeneratedTags(post.post.hashtags || []);
    }
  }, [post]);

  // console.log('post in edit post hashtags', generatedTags);
  

  const handleMediaCaptured = (file: File, previewUrl: string) => {
    setMedia(file);
    setPreview(previewUrl);
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    setPreview(null);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setGeneratedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const generateTags = async (text: string) => {
    const response = await postService.genrateHashtags(description, post?.post.userId || '');
    setGeneratedTags(response?.data?.hashtags || []);
  };

    const handleGenerateHashtags = async () => {
    if (!description.trim()) return;
    setIsTagging(true);

    try {
      const res = await postService.genrateHashtags(description, userId);
      console.log(res, 'Response from hashtag generation>>>');

      if (Array.isArray(res.hashtags)) {
        setGeneratedTags(res.hashtags);
      } else {
        toast.error('Only Paid users can generate hashtags');
      }
    } catch (err) {
      toast.error('Only Paid users can generate hashtags');
    } finally {
      setIsTagging(false);
    }
  };




  const handleUpdate = () => {
    if (!caption.trim()) {
      alert('Caption is required!');
      return;
    }

    if (isToxic) {
      alert('Caption is flagged as inappropriate. Please revise it.');
      return;
    }

    console.log('Updating post with data:', {   generatedTags,caption });

    const formData = new FormData();
    if (media) formData.append('mediaUrls', media);
    formData.append('title', caption);
    formData.append('description', description);
    formData.append('hashtags', generatedTags.join(','));

    updatePost(
      { postId, formData },
      {
        onSuccess: () => {
          alert('Post updated successfully!');
          queryClient.invalidateQueries({ queryKey: ['post', postId] });
          socket.emit('postUpdated', { postId });
          navigate(-1);
        },
        onError: (e) => {
          console.log(e, '>>>>>>');
          // alert('Failed to update post!');
          const errorMessage = (e as any)?.response?.data?.message || 'Failed to update post!';
          setModerationWarning(errorMessage);
          console.error('Update error:', errorMessage);
          toast.error(errorMessage);
        },
      }
    );
  };

  if (isLoading) return <p>Loading post...</p>;
  if (error) return <p>Error loading post.</p>;


return (
  <div className="min-h-screen bg-background px-4 py-6">
    <div className="mb-6">
      <Button
        onClick={() => navigate(-1)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <MoveLeft className="w-4 h-4" />
        Back
      </Button>
    </div>

    <Card className="p-6 space-y-6 w-full max-w-2xl mx-auto">
      {!preview ? (
        <MediaCapture onMediaCaptured={handleMediaCaptured} />
      ) : (
        <MediaPreview previewUrl={preview} onRemove={handleRemoveMedia} />
      )}

      {generatedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {generatedTags.map(tag => (
            <div
              key={tag}
              className="flex items-center px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-white"
            >
              <span>#{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-2 text-red-500 hover:text-red-700 font-bold"
                aria-label={`Remove ${tag}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <Textarea
          placeholder="What's on your mind?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="resize-none"
        />

        {description.trim() && (
          <Button
            onClick={() => {
              const confirmed = window.confirm(
                "Do you want to generate hashtags based on your description?"
              );
              if (confirmed) {
                handleGenerateHashtags();
              }
            }}
            disabled={isTagging}
            variant="default"
          >
            {isTagging ? "Generating..." : "Regenerate Hashtags"}
          </Button>
        )}

        {moderationWarning && (
          <p className="text-yellow-600 text-sm font-semibold">
            {moderationWarning}
          </p>
        )}
      </div>

      <Button
        onClick={handleUpdate}
        disabled={status === "pending"}
        className="w-full"
      >
        {status === "pending" ? "Updating..." : "Update"}
      </Button>
    </Card>
  </div>
);
};

export default EditPost;
