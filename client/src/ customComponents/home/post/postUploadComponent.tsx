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
  <div className="w-full max-w-2xl mx-auto px-6 py-6 sm:px-8 sm:py-8 bg-white dark:bg-gray-900 text-black dark:text-white rounded-2xl shadow-lg space-y-4">

  {/* Back Button */}
    <button
      onClick={() => navigate(-1)}
      className="mb-4 flex items-center text-sm font-medium rounded-md text-black hover:bg-purple-100 dark:text-white dark:bg-gray-900 px-2 py-1"
    >
      {!preview && <MoveLeft className="w-4 h-4 mr-2" />}
    </button>

    {/* Media Upload Section */}
    <div className=" flex flex-col w-full  bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg mb-4">
      {!preview ? (
        <MediaCapture
          onMediaCaptured={handleMediaCaptured}
          isPaidUser={isPaidUser}
        />
      ) : (
        <MediaPreview previewUrl={preview} onRemove={handleRemoveMedia} />
      )}
      {errors.media && (
        <p className="text-red-500 text-sm mt-2">{errors.media}</p>
      )}
      {!isPaidUser && (
        <div className="mt-2 text-xs text-yellow-700">
          🎥 Only <strong>paid users</strong> can record and upload full-length videos.
          <br />
          <span
            className="text-indigo-600 underline cursor-pointer hover:text-indigo-800"
            onClick={() => navigate(`/home/profile/${userId}`)}
          >
            Upgrade your plan to unlock full video uploads →
          </span>
        </div>
      )}
    </div>

    {/* Description Field */}
    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="What's on your mind?"
      className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 resize-none mb-4 text-sm sm:text-base"
      rows={3}
    />

    {/* Hashtag Generator */}
    {description.trim() && (
      <button
        onClick={handleGenerateHashtags}
        disabled={isTagging}
        className="mb-3 px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition w-full sm:w-auto"
      >
        {isTagging ? 'Generating...' : 'Generate Hashtags'}
      </button>
    )}

    {/* Tag Display */}
    {generatedTags.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-4">
        {generatedTags.map((tag) => (
          <div
            key={tag}
            className="flex items-center px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-white"
          >
            <span>{tag}</span>
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

    {/* Moderation Warning */}
    {moderationWarning && (
      <p className="text-yellow-600 text-sm font-semibold mb-4">{moderationWarning}</p>
    )}

    {/* Visibility Dropdown */}
    <select
      value={visibility}
      onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
      className="w-full p-3 mb-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 text-sm"
    >
      <option value="public">Public</option>
      <option value="private">Private</option>
    </select>

    {/* Upload Button */}
    <button
      onClick={handleUpload}
      disabled={status === 'pending'}
      className={`w-full py-3 px-6 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-3 transition-all duration-300 backdrop-blur-md ${
        status === 'pending'
          ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg'
      }`}
    >
      {status === 'pending' ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Uploading...</span>
        </>
      ) : (
        <>
          <Upload className="h-5 w-5" />
          <span>Share Post</span>
        </>
      )}
    </button>
  </div>
);

};

export default PostUpload;
