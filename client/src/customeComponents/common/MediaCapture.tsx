import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FaCamera, FaVideo, FaMicrophone, FaTimes, FaStop, FaUpload } from 'react-icons/fa';

interface MediaCaptureProps {
  onMediaCaptured: (file: File, previewUrl: string) => void;
}

const filters = [
  'none',
  'grayscale(100%)',
  'sepia(80%)',
  'brightness(1.5)',
  'contrast(1.5)',
  'saturate(2)',
];

const MediaCapture = ({ onMediaCaptured }: MediaCaptureProps) => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(null);
  const [webcamKey, setWebcamKey] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState(filters[0]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordedChunks = useRef<Blob[]>([]);

  useEffect(() => {
    console.log('Fetching devices...');
    const fetchDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      const audioDevices = devices.filter((d) => d.kind === 'audioinput');

      setCameras(videoDevices);
      setMicrophones(audioDevices);

      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      if (audioDevices.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioDevices[0].deviceId);
      }
    };
    fetchDevices();
  }, []);

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    setWebcamKey((prev) => prev + 1);
  };

  const handleMicrophoneChange = (deviceId: string) => {
    setSelectedMicrophone(deviceId);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const objectURL = URL.createObjectURL(file);
      setPreviewUrl(objectURL);
      onMediaCaptured(file, objectURL);
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
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
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
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 shadow relative w-full max-w-sm mx-auto">
      {/* Webcam View */}
      <div
        className="w-full max-w-xs h-72 bg-gray-200 dark:bg-gray-800 flex justify-center items-center rounded-lg overflow-hidden relative mt-4"
        style={{ filter: selectedFilter }}
      >
        <Webcam
          key={webcamKey}
          ref={webcamRef}
          videoConstraints={selectedCamera ? { deviceId: { exact: selectedCamera } } : undefined}
          audioConstraints={
            selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : undefined
          }
          screenshotFormat="image/jpeg"
          className="w-full h-full"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {filters.map((filter, index) => (
          <button
            key={index}
            className={`px-3 py-1 border rounded text-xs transition-colors ${
              selectedFilter === filter
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200'
            }`}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter.replace(/\(.*\)/, '')}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={captureImage}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-2 rounded flex items-center text-sm"
        >
          <FaCamera className="mr-2" /> Capture
        </button>
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-2 rounded flex items-center text-sm"
          >
            <FaStop className="mr-2" /> Stop
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white p-2 rounded flex items-center text-sm"
          >
            <FaVideo className="mr-2" /> Record
          </button>
        )}
      </div>

      {/* Upload from device */}
      <div className="mt-4">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded flex items-center text-sm cursor-pointer transition"
        >
          <FaUpload className="mr-2" /> Select from Device
        </label>
      </div>

      {/* Device Selection */}
      <div className="w-full mt-4 p-2 border rounded shadow-lg bg-white dark:bg-gray-900 dark:border-gray-700">
        <label className="block text-sm text-gray-800 dark:text-gray-200 mb-1">Camera:</label>
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

        <label className="block text-sm text-gray-800 dark:text-gray-200 mt-2 mb-1">
          Microphone:
        </label>
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

      {/* Media Preview */}
      {previewUrl && (
        <div className="relative mt-4 w-full max-w-xs">
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full text-xs"
          >
            <FaTimes />
          </button>
          <video
            src={previewUrl}
            controls
            className="w-full h-72 rounded bg-black dark:bg-gray-800"
          />
        </div>
      )}
    </div>
  );
};

export default MediaCapture;
