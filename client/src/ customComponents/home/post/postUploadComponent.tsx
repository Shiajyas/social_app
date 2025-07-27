import { useState } from 'react';
import MediaPreview from '@/ customComponents/common/MediaPreview';
import MediaCapture from '@/ customComponents/common/MediaCapture';
import { socket } from '@/utils/Socket';
import { useUploadPost } from '@/hooks/usePost';
import { useParams } from 'react-router-dom';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { postService } from '@/services/postService';
import { toast } from 'react-toastify';

const PostUpload: React.FC = () => {
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const [errors, setErrors] = useState<{ caption?: string; media?: string }>({});
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [isTagging, setIsTagging] = useState(false);

  const { userId } = useParams<{ userId: string }>();
  const { mutate: uploadPost, status } = useUploadPost();

  const handleMediaCaptured = (file: File, previewUrl: string) => {
    setMedia(file);
    setPreview(previewUrl);
    setErrors(prev => ({ ...prev, media: undefined }));
  };
  const handleRemoveMedia = () => {
    setMedia(null);
    setPreview(null);
    setGeneratedTags([]);
    setModerationWarning(null);
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!media) newErrors.media = 'Please select or capture a file.';
    if (!caption.trim()) newErrors.caption = 'Caption is required.';
    setErrors(newErrors);
    return !Object.keys(newErrors).length;
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
      toast.error(res.message || 'Failed to generate hashtags');
    }
  } catch (err) {
    toast.error('Error generating hashtags.');
  } finally {
    setIsTagging(false);
  }
};


  const handleUpload = () => {
    if (!validateForm()) return;

    const payload = new FormData();
    payload.append('mediaUrls', media!);
    payload.append('title', caption);
    payload.append('description', description);
    payload.append('userId', userId || '');
    payload.append('visibility', visibility);
    payload.append('hashtags', generatedTags.join(','));

    uploadPost(payload, {
      onSuccess: data => {
        const postId = data.post._id;
        toast.success('Post uploaded successfully!');
        socket.emit('postUploaded', { userId, postId });
        if (Array.isArray(data.post.hashtags)) {
          setGeneratedTags(data.post.hashtags);
        }
        handleRemoveMedia();
      },
      onError: err => {
        // Check if error has a response property (e.g., AxiosError)
        const t = (err as any)?.response?.data;
        if (t?.type === 'TOXIC') {
          setModerationWarning('⚠️ Post contains inappropriate content. Please revise.');
          toast.warn('Toxic content detected');
        } else {
          toast.error(err.message || 'Upload failed');
        }
      }
    });
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 text-black dark:text-white rounded shadow-md dark:shadow-lg border max-w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center space-x-2">
          <Camera className="h-6 w-6 text-purple-500" />
          <span>Create a Post</span>
        </h2>
      </div>

      {/* Media Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
        {!preview
          ? <MediaCapture onMediaCaptured={handleMediaCaptured} />
          : <MediaPreview previewUrl={preview} onRemove={handleRemoveMedia} />
        }
        {errors.media && <p className="text-red-500 text-sm mt-2">{errors.media}</p>}
      </div>

      {/* Caption & Description */}
      <div className="space-y-4 mb-4">
        <div>
          <input
            type="text" placeholder="Add a caption..."
            value={caption}
            onChange={e => {
              setCaption(e.target.value);
              if (e.target.value.trim()) setErrors(prev => ({ ...prev, caption: undefined }));
            }}
            className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500"
          />
          {errors.caption && <p className="text-red-500 text-sm mt-1">{errors.caption}</p>}
        </div>

        <textarea
          placeholder="What's on your mind?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 resize-none"
        />

        {/* AI-Generate Hashtags */}
        {description.trim() && (
          <button
            onClick={handleGenerateHashtags}
            disabled={isTagging}
            className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition"
          >
            {isTagging ? 'Generating...' : 'Generate Hashtags'}
          </button>
        )}

        {generatedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {generatedTags.map(tag => (
              <span key={tag}
                className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-white"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {moderationWarning && (
          <p className="text-yellow-600 text-sm font-semibold">{moderationWarning}</p>
        )}
      </div>

      {/* Visibility Selector */}
      <div className="relative mb-4">
        <select
          value={visibility}
          onChange={e => setVisibility(e.target.value as 'public' | 'private')}
          className="w-full p-3 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      {/* Share Button */}
      <button
        onClick={handleUpload}
        disabled={status === 'pending'}
        className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center space-x-2 ${
          status === 'pending' ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {status === 'pending'
          ? <><Loader2 className="h-5 w-5 animate-spin" /><span>Uploading...</span></>
          : <><Upload className="h-5 w-5" /><span>Share Post</span></>
        }
      </button>
    </div>
  );
};

export default PostUpload;
