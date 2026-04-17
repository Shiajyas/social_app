import { useState } from 'react';
import MediaPreview from '@/ customComponents/common/MediaPreview';
import MediaCapture from '@/ customComponents/common/MediaCapture';
import { socket } from '@/utils/Socket';
import { useUploadPost } from '@/hooks/usePost';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Upload, Loader2, MoveLeft } from 'lucide-react';
import { postService } from '@/services/postService';
import { toast } from 'react-toastify';
import { useUserAuth } from '@/hooks/useUserAuth';

const MAX_VIDEO_DURATION = 30; // seconds

const PostUpload: React.FC = () => {
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [errors, setErrors] = useState<{ media?: string }>({});
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [isTagging, setIsTagging] = useState(false);

  const [thumbnail, setThumbnail] = useState<string | null>(null);


  const { user } = useUserAuth();
  const isPaidUser = user?.user?.isSubscribed || false;

  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { mutate: uploadPost, status } = useUploadPost();

const handleMediaCaptured = (file: File, previewUrl: string) => {
  if (!isPaidUser && file.type.startsWith('video/')) {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = videoUrl;

    video.onloadedmetadata = () => {
      // Trick to get real duration
      if (video.duration === Infinity) {
        video.currentTime = 1e101; // Seek far to trigger duration calculation

        video.ontimeupdate = () => {
          video.ontimeupdate = null; // Run only once
          const realDuration = video.duration;
          URL.revokeObjectURL(video.src);

          console.log("Real duration after trick:", realDuration);

          if (realDuration > MAX_VIDEO_DURATION) {
            toast.info("Upgrade your plan to upload full-length videos.");
            setMedia(null);
            setPreview(null);
          } else {
            setMedia(file);
            setPreview(previewUrl);
            setErrors({});
          }
        };
      } else {
        const realDuration = video.duration;
        URL.revokeObjectURL(video.src);

        if (realDuration > MAX_VIDEO_DURATION) {
          toast.info("Upgrade your plan to upload full-length videos.");
          setMedia(null);
          setPreview(null);
        } else {
          setMedia(file);
          setPreview(previewUrl);
          setErrors({});
        }
      }
    };
  } else {
    setMedia(file);
    setPreview(previewUrl);
    setErrors({});
  }
};


  const handleRemoveMedia = () => {
    setMedia(null);
    setPreview(null);
    setGeneratedTags([]);
    setModerationWarning(null);
  };

  const handleRemoveTag = (tag: string) => {
    setGeneratedTags(prev => prev.filter(t => t !== tag));
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!media) newErrors.media = 'Please select or capture a file.';
    if (description.trim().length < 5) {
      
    }
    setErrors(newErrors);
    return !Object.keys(newErrors).length;
  };

  const handleGenerateHashtags = async () => {
    if (!description.trim()) return;
    setIsTagging(true);
    try {
      const res = await postService.genrateHashtags(description, userId);
      if (Array.isArray(res.hashtags)) {
        setGeneratedTags(res.hashtags);
      } else {
        toast.error('Only paid users can generate hashtags');
      }
    } catch {
      toast.error('Only paid users can generate hashtags');
    } finally {
      setIsTagging(false);
    }
  };

  const handleUpload = () => {
    if (!validateForm()) return;

    const payload = new FormData();
    payload.append('mediaUrls', media!);
    payload.append('title', '.');
    payload.append('description', description);
    payload.append('userId', userId || '');
    payload.append('visibility', visibility);
    payload.append('hashtags', generatedTags.join(','));

    uploadPost(payload, {
      onSuccess: data => {
        toast.success('Post uploaded successfully!');
        socket.emit('postUploaded', { userId, postId: data.post._id });
        setGeneratedTags(data.post.hashtags || []);
        handleRemoveMedia();
      },
      onError: err => {
        const res = (err as any)?.response?.data;
        if (res?.type === 'TOXIC') {
          setModerationWarning('⚠️ Inappropriate content. Please revise.');
          toast.warn('Toxic content detected');
        } else {
          toast.error(err.message|| 'Upload failed');
        }
      }
    });
  };

return (
  <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center px-2 sm:px-4 py-4">

    <div className="w-full max-w-md sm:max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-lg p-3 sm:p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <MoveLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base sm:text-lg font-semibold">Create Post</h2>
      </div>

      {/* Media Section */}
      <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-3">
        {!preview ? (
          <div className="w-full overflow-hidden rounded-lg">
            <MediaCapture
              onMediaCaptured={handleMediaCaptured}
              isPaidUser={isPaidUser}
            />
          </div>
        ) : (
          <div className="w-full max-h-[300px] overflow-hidden rounded-lg">
            <MediaPreview previewUrl={preview} onRemove={handleRemoveMedia} />
          </div>
        )}

        {errors.media && (
          <p className="text-red-500 text-xs mt-1">{errors.media}</p>
        )}

        {!isPaidUser && (
          <p className="text-xs text-yellow-600 mt-2">
            🎥 Upgrade for full video uploads
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-2 sm:p-3 text-sm rounded-lg border dark:bg-gray-800 resize-none"
          rows={3}
        />
        <div className="text-right text-xs text-gray-400">
          {description.length}/200
        </div>
      </div>

      {/* Hashtag Button */}
      {description.trim() && (
        <button
          onClick={handleGenerateHashtags}
          disabled={isTagging}
          className="w-full py-2 text-sm bg-indigo-600 text-white rounded-lg"
        >
          {isTagging ? 'Generating...' : 'Generate Hashtags'}
        </button>
      )}

      {/* Tags */}
      {generatedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {generatedTags.map((tag) => (
            <div
              key={tag}
              className="flex items-center px-2 py-1 text-xs rounded-full bg-purple-200 dark:bg-purple-700"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Warning */}
      {moderationWarning && (
        <p className="text-yellow-500 text-xs">{moderationWarning}</p>
      )}

      {/* Visibility */}
      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
        className="w-full p-2 text-sm rounded-lg border dark:bg-gray-800"
      >
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>

      {/* Upload */}
      <button
        onClick={handleUpload}
        disabled={!media || status === 'pending'}
        className={`w-full py-3 rounded-lg text-white flex items-center justify-center gap-2 ${
          status === 'pending'
            ? 'bg-gray-400'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600'
        }`}
      >
        {status === 'pending' ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Share
          </>
        )}
      </button>

    </div>
  </div>
);
};

export default PostUpload;
