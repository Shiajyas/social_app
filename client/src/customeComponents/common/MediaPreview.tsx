import { useEffect, useState } from 'react';
import { FaDownload, FaTrash } from 'react-icons/fa';

interface MediaPreviewProps {
  previewUrl: string;
  onRemove: () => void;
}

const MediaPreview = ({ previewUrl, onRemove }: MediaPreviewProps) => {
  const [isVideo, setIsVideo] = useState<boolean | null>(null);

  useEffect(() => {
    if (previewUrl.startsWith('blob:')) {
      const checkMediaType = async () => {
        try {
          const response = await fetch(previewUrl);
          const blob = await response.blob();
          setIsVideo(blob.type.startsWith('video/'));
        } catch (error) {
          console.error('Error checking media type:', error);
        }
      };
      checkMediaType();
    } else {
      setIsVideo(previewUrl.endsWith('.mp4') || previewUrl.endsWith('.mov')); // 🔹 Detect videos by extension
    }
  }, [previewUrl]);

  console.log(previewUrl, '.............................');
  return (
    <div className="p-4 bg-white dark:bg-gray-900 shadow-md rounded-lg flex-grow h-full flex flex-col items-center">
      {isVideo === null ? (
        <p className="text-gray-700 dark:text-gray-300">Loading preview...</p>
      ) : isVideo ? (
        <video
          src={previewUrl}
          controls
          className="w-full h-60 rounded object-contain bg-black dark:bg-gray-800"
        />
      ) : (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full h-96 rounded object-cover bg-gray-100 dark:bg-gray-800"
        />
      )}

      <div className="flex justify-center gap-4 mt-4">
        <a
          href={previewUrl}
          download
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-2 rounded flex items-center gap-2 transition-colors"
        >
          <FaDownload /> Download
        </a>
        <button
          onClick={onRemove}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-2 rounded flex items-center gap-2 transition-colors"
        >
          <FaTrash /> Remove
        </button>
      </div>
    </div>
  );
};

export default MediaPreview;
