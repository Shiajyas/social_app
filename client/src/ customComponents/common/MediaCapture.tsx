import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
  FaCamera,
  FaVideo,
  FaMicrophone,
  FaTimes,
  FaStop,
  FaUpload,
  FaOpenid,
} from 'react-icons/fa';
import { BsCloudUpload } from 'react-icons/bs'
import { HiChevronUp, HiChevronDown } from 'react-icons/hi'
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import MediaPreview from './MediaPreview';

interface MediaCaptureProps {
  onMediaCaptured: (file: File, previewUrl: string) => void;
  isPaidUser: boolean;
}

const filters = [
  { label: 'None', value: 'none' },
  { label: 'Grayscale', value: 'grayscale(100%)' },
  { label: 'Sepia', value: 'sepia(80%)' },
  { label: 'Brightness', value: 'brightness(1.5)' },
  { label: 'Contrast', value: 'contrast(1.5)' },
  { label: 'Saturate', value: 'saturate(2)' },
];

const MediaCapture = ({ onMediaCaptured, isPaidUser }: MediaCaptureProps) => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(null);
  const [webcamKey, setWebcamKey] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState(filters[0].value);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordTimer, setRecordTimer] = useState<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
    const [showUploadOptions, setShowUploadOptions] = useState(false);


  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  useEffect(() => {
    const fetchDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      const audioDevices = devices.filter((d) => d.kind === 'audioinput');
      setCameras(videoDevices);
      setMicrophones(audioDevices);
      if (videoDevices.length > 0 && !selectedCamera) setSelectedCamera(videoDevices[0].deviceId);
      if (audioDevices.length > 0 && !selectedMicrophone) setSelectedMicrophone(audioDevices[0].deviceId);
    };
    fetchDevices();
  }, []);

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    setWebcamKey((prev) => prev + 1);
  };

const handlePreviewRemove = () => {
    setPreviewUrl(null);
    setSelectedFilter(filters[0].value);
    setWebcamKey((prev) => prev + 1); // Reset webcam to clear preview
  };

  const handleMicrophoneChange = (deviceId: string) => {
    setSelectedMicrophone(deviceId);
  };

  

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const objectURL = URL.createObjectURL(file);

      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = objectURL;

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src); // clean up
          const maxDuration = isPaidUser ? 60 : 30;
          if (video.duration <= maxDuration) {
            setPreviewUrl(objectURL);
            onMediaCaptured(file, objectURL);
          } else {
            alert(`Please select a video shorter than ${maxDuration} seconds.`);
          }
        };
      } else {
        setPreviewUrl(objectURL);
        onMediaCaptured(file, objectURL);
      }
    }
  };

  const captureImage = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
          const objectURL = URL.createObjectURL(file);
          setPreviewUrl(objectURL);
          onMediaCaptured(file, objectURL);
        });
    }
  };

  const startRecording = async () => {
    const constraints = {
      video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
      audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    mediaRecorderRef.current = new MediaRecorder(stream);
    recordedChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const file = new File([blob], 'recorded-video.webm', { type: 'video/webm' });
      const objectURL = URL.createObjectURL(file);
      setPreviewUrl(objectURL);
      onMediaCaptured(file, objectURL);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);

    const maxDuration = isPaidUser ? 60 * 60 : 30; // 🔹 key logic
    const timeout = setTimeout(() => stopRecording(), maxDuration * 1000);
    setRecordTimer(timeout);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimer) {
        clearTimeout(recordTimer);
        setRecordTimer(null);
      }
    }
  };

return (
<div className="w-full max-w-xl mx-auto flex flex-col items-center p-6 border rounded-2xl bg-white dark:bg-gray-900 dark:border-gray-700 shadow-lg space-y-4">

    {/* 🔒 Only show webcam + capture options if no preview */}
    {!previewUrl && (
      <>
        <div
          className=" h-72 bg-gray-200 dark:bg-gray-800  flex items-center justify-center overflow-hidden mt-4"
          style={{ filter: selectedFilter }}
        >
          <Webcam
            key={webcamKey}
            ref={webcamRef}
            videoConstraints={selectedCamera ? { deviceId: { exact: selectedCamera } } : undefined}
            audioConstraints={selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : undefined}
            screenshotFormat="image/jpeg"
            className=" h-full object-cover"
          />
        </div>

        <ScrollArea className="w-full mt-4">
          <ToggleGroup
            type="single"
            value={selectedFilter}
            onValueChange={(val) => val && setSelectedFilter(val)}
            className="flex gap-2"
          >
            {filters.map((filter) => (
              <ToggleGroupItem key={filter.value} value={filter.value} className="text-xs capitalize">
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="flex gap-4 mt-4">
          <button
            onClick={captureImage}
            className="border border-blue-600 hover:bg-blue-600 text-blue-600 hover:text-white px-4 py-2 rounded-2xl flex items-center transition"
          >
            <FaCamera className="mr-2" /> Capture
          </button>
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="border border-red-600 hover:bg-red-600 text-red-600 hover:text-white px-4 py-2 rounded-2xl flex items-center transition"
            >
              <FaStop className="mr-2" /> Stop
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="border border-green-600 hover:bg-green-600 text-green-600 hover:text-white px-4 py-2 rounded-2xl flex items-center transition"
            >
              <FaVideo className="mr-2" /> Record {isPaidUser ? '' : '(30s)'}
            </button>
          )}
        </div>
      </>
    )}



    {/* Toggle to show upload options */}

 
<div className="flex flex-col items-center justify-between w-full mt-4">
  <button
    onClick={() => setShowUploadOptions(!showUploadOptions)}
    className={`border px-4 py-2 rounded-full flex items-center transition 
      ${showUploadOptions
        ? 'bg-blue-600 text-white border-blue-700'
        : 'border-gray-600 text-gray-700 hover:bg-gray-600 hover:text-white dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-600'}`}
  >
    <BsCloudUpload className="mr-2" />
    {showUploadOptions ? (
      <>
        Hide Upload Options <HiChevronUp className="ml-2" />
      </>
    ) : (
      <>
        Show Upload Options <HiChevronDown className="ml-2" />
      </>
    )}
  </button>
</div>

      {/* ✅ Show upload + device selection if toggled */}
      {!previewUrl && showUploadOptions && (
        <div>
          {/* File Upload is always shown */}
          <div className="mt-4 flex justify-center">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-600 text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-600 transition-colors cursor-pointer text-sm font-medium"
            >
              <FaUpload /> Select from Device
            </label>
          </div>

          {/* Camera/Mic Select */}
          <div className="w-full mt-4 p-4 border rounded-2xl bg-white dark:bg-gray-900 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Camera:</label>
            <select
              value={selectedCamera || ''}
              onChange={(e) => handleCameraChange(e.target.value)}
              className="border p-2 w-full rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              {cameras.map((c) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || 'Camera'}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mt-4 mb-1">Microphone:</label>
            <select
              value={selectedMicrophone || ''}
              onChange={(e) => handleMicrophoneChange(e.target.value)}
              className="border p-2 w-full rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              {microphones.map((m) => (
                <option key={m.deviceId} value={m.deviceId}>
                  {m.label || 'Microphone'}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

        {previewUrl && (
      <MediaPreview
        previewUrl={previewUrl}
        onRemove={handlePreviewRemove}
      />
    )}

    {/* Remove Preview Button */}
  </div>
);

};

export default MediaCapture;
