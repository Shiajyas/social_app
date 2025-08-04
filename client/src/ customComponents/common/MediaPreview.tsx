import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MediaPreviewProps {
  previewUrl: string;
  onRemove: () => void;
}

const MediaPreview = ({ previewUrl, onRemove }: MediaPreviewProps) => {
  const [isVideo, setIsVideo] = useState<boolean>(false);

  useEffect(() => {
    const determineType = async () => {
      if (previewUrl.startsWith("blob:")) {
        try {
          const response = await fetch(previewUrl);
          const blob = await response.blob();
          setIsVideo(blob.type.startsWith("video/"));
        } catch (error) {
          console.error("Error checking media type:", error);
          setIsVideo(false);
        }
      } else {
        // Fallback if not blob URL
        const ext = previewUrl.split('.').pop()?.toLowerCase();
        setIsVideo(ext === "mp4" || ext === "mov" || ext === "webm");
      }
    };

    determineType();
  }, [previewUrl]);

  return (
    <Card className="p-4 flex flex-col items-center w-full max-w-md mx-auto">
      {isVideo ? (
        <video
          src={previewUrl}
          controls
          className="w-full max-h-[300px] rounded-md bg-black object-contain"
        />
      ) : (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full max-h-[400px] rounded-md object-cover bg-muted"
        />
      )}

      <div className="flex gap-4 mt-4">
   
        <Button
          variant="destructive"
          className="flex items-center gap-2"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </Button>
      </div>
    </Card>
  );
};

export default MediaPreview;
